const DEFAULT_ANOMALY_THRESHOLD = 2.0;

export function detectAnomalies(monthlyBuckets, metricKey) {
  const series = Array.isArray(monthlyBuckets) ? monthlyBuckets : [];
  const values = series.map((bucket) => Number(bucket?.[metricKey] ?? 0));
  const mean = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const variance =
    values.length > 0
      ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
      : 0;
  const stdDev = Math.sqrt(variance);

  return series.map((bucket, index) => {
    const value = values[index] ?? 0;
    const zScore = stdDev > 0 ? (value - mean) / stdDev : 0;
    return {
      month: bucket.period,
      value,
      z_score: roundNumber(zScore),
      anomaly: stdDev > 0 && Math.abs(zScore) > DEFAULT_ANOMALY_THRESHOLD
    };
  });
}

export function linearRegression(xs, ys) {
  const points = Math.min(xs.length, ys.length);
  if (points === 0) {
    return {
      slope: 0,
      intercept: 0,
      r_squared: 0
    };
  }

  const xValues = xs.slice(0, points);
  const yValues = ys.slice(0, points);
  const meanX = xValues.reduce((sum, value) => sum + value, 0) / points;
  const meanY = yValues.reduce((sum, value) => sum + value, 0) / points;

  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < points; index += 1) {
    numerator += (xValues[index] - meanX) * (yValues[index] - meanY);
    denominator += (xValues[index] - meanX) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;

  let totalVariance = 0;
  let residualVariance = 0;
  for (let index = 0; index < points; index += 1) {
    const predicted = slope * xValues[index] + intercept;
    totalVariance += (yValues[index] - meanY) ** 2;
    residualVariance += (yValues[index] - predicted) ** 2;
  }

  const r_squared = totalVariance === 0 ? 1 : Math.max(0, 1 - residualVariance / totalVariance);

  return { slope, intercept, r_squared, };
}

export function predictNextMonths(regression, currentIndex, n, latestMonth) {
  const count = Math.max(0, Number(n) || 0);
  return Array.from({ length: count }, (_, offset) => {
    const monthIndex = currentIndex + offset + 1;
    const predicted = regression.slope * monthIndex + regression.intercept;
    return {
      month: shiftMonth(latestMonth, offset + 1),
      month_offset: offset + 1,
      predicted: roundNumber(predicted)
    };
  });
}

export function describePredictionConfidence(rSquared) {
  const value = Number(rSquared ?? 0);
  if (value >= 0.75) return "high";
  if (value >= 0.4) return "medium";
  return "low";
}

export function buildGovernanceNarrativePrompt(anomalies, predictions, summary) {
  return [
    "You are an analyst summarizing chamber governance analytics for organizational leadership.",
    "Write 3 concise paragraphs in plain English.",
    "Call out important anomalies, likely implications, and projected trends.",
    "Do not invent data beyond the provided metrics.",
    "",
    "Anomalies by metric:",
    JSON.stringify(anomalies),
    "",
    "Predictions by metric:",
    JSON.stringify(predictions),
    "",
    "Governance summary:",
    JSON.stringify(summary)
  ].join("\n");
}

export function computeInsightSummary(monthlyBuckets) {
  const metrics = ["meetings_held", "motions_passed", "action_items", "ai_interactions"];
  const anomalies = Object.fromEntries(
    metrics.map((metricKey) => [metricKey, detectAnomalies(monthlyBuckets, metricKey)])
  );

  const predictions = {};
  const improvingMetrics = [];
  const decliningMetrics = [];
  const stableMetrics = [];

  for (const metricKey of metrics) {
    const ys = monthlyBuckets.map((bucket) => Number(bucket?.[metricKey] ?? 0));
    const xs = ys.map((_, index) => index);
    const regression = linearRegression(xs, ys);
    predictions[metricKey] = regression;
    if (regression.slope > 0.1) improvingMetrics.push(metricKey);
    else if (regression.slope < -0.1) decliningMetrics.push(metricKey);
    else stableMetrics.push(metricKey);
  }

  const flattened = Object.values(anomalies)
    .flat()
    .filter((item) => item.anomaly)
    .sort((left, right) => Math.abs(right.z_score) - Math.abs(left.z_score));

  return {
    anomaly_count: flattened.length,
    mostAnomalousMonth: flattened[0]?.month ?? null,
    most_anomalous_months: [...new Set(flattened.map((item) => item.month))].slice(0, 3),
    improving_metrics: improvingMetrics,
    declining_metrics: decliningMetrics,
    stable_metrics: stableMetrics,
    trendingUp: improvingMetrics,
    trendingDown: decliningMetrics
  };
}

export function annotateTrendAnomalies(monthlyBuckets) {
  const metrics = ["meetings_held", "motions_passed", "action_items", "ai_interactions"];
  const anomalySets = Object.fromEntries(
    metrics.map((metricKey) => [
      metricKey,
      new Map(detectAnomalies(monthlyBuckets, metricKey).map((item) => [item.month, item]))
    ])
  );

  return monthlyBuckets.map((bucket) => {
    const details = {};
    let anomaly = false;

    for (const metricKey of metrics) {
      const metricAnomaly = anomalySets[metricKey].get(bucket.period) ?? {
        month: bucket.period,
        value: Number(bucket?.[metricKey] ?? 0),
        z_score: 0,
        anomaly: false
      };
      details[metricKey] = metricAnomaly;
      anomaly = anomaly || metricAnomaly.anomaly;
    }

    return {
      ...bucket,
      anomaly,
      anomaly_details: details
    };
  });
}

function shiftMonth(month, offset) {
  if (typeof month !== "string" || !/^\d{4}-\d{2}$/.test(month)) {
    return null;
  }

  const [year, currentMonth] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, currentMonth - 1 + offset, 1));
  return date.toISOString().slice(0, 7);
}

function roundNumber(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export { DEFAULT_ANOMALY_THRESHOLD };
