import type { MatchEvidence, PoliticsCategory } from "./types.js";
import { politicalLexicon } from "./lexicon.js";
import { politicalFigures } from "./figures.js";

export interface WeightedRule {
  term: string;
  category: PoliticsCategory;
  weight: number;
}

export const weightedRules: WeightedRule[] = (
  Object.entries(politicalLexicon) as [PoliticsCategory, readonly (readonly [string, number])[]][]
).flatMap(([category, entries]) => entries.map(([term, weight]) => ({ term, category, weight })))
  .concat(politicalFigures.map((term) => ({ term, category: "political_person" as const, weight: 0.65 })));

const nonPoliticalContext = [
  "吃飯", "美食", "餐廳", "球賽", "棒球", "籃球", "演唱會", "穿搭", "寵物", "旅遊", "生日"
];

const strongPoliticalContext = [
  "宣布", "表決", "攻防", "質詢", "提案", "修法", "政策", "法案", "選舉", "罷免", "公投", "黨團",
  "市長", "縣長", "總統", "候選人", "競選"
];

export function collectEvidence(text: string): MatchEvidence[] {
  const normalized = text.normalize("NFKC").replaceAll("臺", "台").toLowerCase();
  const matches = weightedRules.filter((rule) => normalized.includes(rule.term.toLowerCase()));
  return matches
    .filter((rule) => !matches.some((other) => other !== rule && other.term.length > rule.term.length
      && other.term.toLowerCase().includes(rule.term.toLowerCase())))
    .map((rule) => ({ ...rule }));
}

export function contextAdjustment(text: string, evidence: MatchEvidence[]): number {
  if (evidence.length === 0) return 0;

  const hasStrong = strongPoliticalContext.some((term) => text.includes(term));
  const hasLifestyle = nonPoliticalContext.some((term) => text.includes(term));

  if (hasStrong) return 0.12;
  if (hasLifestyle && evidence.every((e) => e.category === "political_person" || e.category === "government")) {
    return -0.28;
  }
  return 0;
}
