export * from "./types.js";
export * from "./rules.js";
export * from "./lexicon.js";

import type { ClassifyInput, ClassifyResult, FilterStrength } from "./types.js";
import { collectEvidence, contextAdjustment } from "./rules.js";

const thresholds: Record<FilterStrength, number> = {
  low: 0.9,
  medium: 0.62,
  nuclear: 0.28
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function classify(input: ClassifyInput): ClassifyResult {
  const strength = input.strength ?? "medium";
  const normalized = input.text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return {
      politicalScore: 0,
      blocked: false,
      categories: [],
      matched: [],
      confidence: "low"
    };
  }

  const matched = collectEvidence(normalized);
  const raw = matched.reduce((sum, item) => sum + item.weight, 0) + contextAdjustment(normalized, matched);
  const politicalScore = clamp01(raw);
  const categories = [...new Set(matched.map((item) => item.category))];

  return {
    politicalScore,
    blocked: politicalScore >= thresholds[strength],
    categories,
    matched,
    confidence: politicalScore >= 0.8 ? "high" : politicalScore >= 0.45 ? "medium" : "low"
  };
}
