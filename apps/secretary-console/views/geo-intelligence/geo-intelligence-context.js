import {
  filterBusinessesByShowcaseCity,
  filterMeetingsByShowcaseCity
} from "../common/showcase-city-context.js";

function summarizeCategories(businesses = []) {
  const counts = new Map();
  businesses.forEach((business) => {
    const category = String(business.category ?? "").trim();
    if (!category) {
      return;
    }
    counts.set(category, (counts.get(category) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([category]) => category);
}

function summarizeMeetingTopics(meetings = [], cityTag = "") {
  const counts = new Map();
  meetings.forEach((meeting) => {
    (meeting.tags ?? []).forEach((tag) => {
      const clean = String(tag ?? "").trim().toLowerCase();
      if (!clean || clean === cityTag) {
        return;
      }
      counts.set(clean, (counts.get(clean) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([topic]) => topic);
}

function summarizeBusinessNames(businesses = []) {
  return businesses
    .map((business) => String(business.name ?? "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function buildGeoInputContext({
  selectedCity,
  businesses = [],
  meetings = []
}) {
  if (!selectedCity || selectedCity.id === "all") {
    return {
      businessCount: 0,
      meetingCount: 0,
      businessNames: [],
      categories: [],
      meetingTopics: [],
      existingDetails: []
    };
  }

  const scopedBusinesses = filterBusinessesByShowcaseCity(businesses, selectedCity);
  const scopedMeetings = filterMeetingsByShowcaseCity(meetings, selectedCity);
  const businessNames = summarizeBusinessNames(scopedBusinesses);
  const categories = summarizeCategories(scopedBusinesses);
  const meetingTopics = summarizeMeetingTopics(scopedMeetings, selectedCity.tag);
  const details = [];

  details.push(`Businesses in ${selectedCity.label}: ${scopedBusinesses.length}`);

  if (categories.length > 0) {
    details.push(`Top business categories: ${categories.join(", ")}`);
  }

  if (meetingTopics.length > 0) {
    details.push(`Meeting topics: ${meetingTopics.join(", ")}`);
  }

  details.push(`Recent meeting footprint: ${scopedMeetings.length}`);

  return {
    businessCount: scopedBusinesses.length,
    meetingCount: scopedMeetings.length,
    businessNames,
    categories,
    meetingTopics,
    existingDetails: details
  };
}

export function buildGeoExistingDetails(input) {
  return buildGeoInputContext(input).existingDetails;
}
