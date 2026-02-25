import { expect } from "@playwright/test";
import { CONSOLE_GUARD_RULES, getConsoleGuardMode } from "./console_guard_config.mjs";

export function attachConsoleGuard(page, options = {}) {
  const mode = options.mode ?? getConsoleGuardMode();
  const rules = options.rules ?? CONSOLE_GUARD_RULES;
  const failures = [];
  const warnings = [];
  const warningCounts = new Map();

  const classify = (text) => {
    const match = rules.find((rule) => rule.pattern.test(text));
    return match?.severity ?? "fail";
  };

  const onConsole = (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    const severity = classify(text);
    if (severity === "ignore") return;
    if (severity === "warn") {
      const key = `console: ${text}`;
      warnings.push(key);
      warningCounts.set(key, (warningCounts.get(key) ?? 0) + 1);
      return;
    }
    failures.push(`console: ${text}`);
  };

  const onPageError = (error) => {
    const text = error?.message ?? String(error);
    const severity = classify(text);
    if (severity === "ignore") return;
    if (severity === "warn") {
      const key = `pageerror: ${text}`;
      warnings.push(key);
      warningCounts.set(key, (warningCounts.get(key) ?? 0) + 1);
      return;
    }
    failures.push(`pageerror: ${text}`);
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  return {
    async assertNoUnexpected() {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
      if (warnings.length > 0 && mode !== "off") {
        const summarized = Array.from(warningCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([text, count]) => `${text}${count > 1 ? ` (x${count})` : ""}`);
        console.warn(`Console guard warnings:\n${summarized.join("\n")}`);
      }
      if (mode === "off") return;
      if (mode === "warn") return;
      expect(failures, `Unexpected browser errors:\n${failures.join("\n")}`).toEqual([]);
    }
  };
}
