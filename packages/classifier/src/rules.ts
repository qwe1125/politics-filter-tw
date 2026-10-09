import type { MatchEvidence, PoliticsCategory } from "./types.js";

export interface WeightedRule {
  term: string;
  category: PoliticsCategory;
  weight: number;
}

export const weightedRules: WeightedRule[] = [
  { term: "民主進步黨", category: "party_politics", weight: 0.55 },
  { term: "民進黨", category: "party_politics", weight: 0.55 },
  { term: "中國國民黨", category: "party_politics", weight: 0.55 },
  { term: "國民黨", category: "party_politics", weight: 0.55 },
  { term: "台灣民眾黨", category: "party_politics", weight: 0.55 },
  { term: "民眾黨", category: "party_politics", weight: 0.55 },
  { term: "政黨", category: "party_politics", weight: 0.35 },
  { term: "黨團", category: "party_politics", weight: 0.4 },
  { term: "選舉", category: "election", weight: 0.65 },
  { term: "候選人", category: "election", weight: 0.55 },
  { term: "競選", category: "election", weight: 0.55 },
  { term: "造勢", category: "election", weight: 0.45 },
  { term: "投票", category: "election", weight: 0.35 },
  { term: "罷免", category: "election", weight: 0.65 },
  { term: "公投", category: "election", weight: 0.6 },
  { term: "總統府", category: "government", weight: 0.55 },
  { term: "行政院", category: "government", weight: 0.5 },
  { term: "立法院", category: "legislature", weight: 0.6 },
  { term: "立委", category: "legislature", weight: 0.45 },
  { term: "議員", category: "legislature", weight: 0.35 },
  { term: "三讀", category: "legislature", weight: 0.55 },
  { term: "法案", category: "legislature", weight: 0.4 },
  { term: "修法", category: "legislature", weight: 0.45 },
  { term: "預算案", category: "legislature", weight: 0.45 },
  { term: "覆議", category: "legislature", weight: 0.55 },
  { term: "兩岸", category: "cross_strait", weight: 0.5 },
  { term: "台海", category: "cross_strait", weight: 0.45 },
  { term: "統獨", category: "cross_strait", weight: 0.6 },
  { term: "外交", category: "international_politics", weight: 0.35 },
  { term: "制裁", category: "international_politics", weight: 0.4 },
  { term: "國會", category: "international_politics", weight: 0.35 },
  { term: "政策", category: "public_policy", weight: 0.3 },
  { term: "補助", category: "public_policy", weight: 0.22 },
  { term: "稅制", category: "public_policy", weight: 0.25 },
  { term: "電價", category: "public_policy", weight: 0.2 },
  { term: "兵役", category: "public_policy", weight: 0.3 },
  { term: "勞基法", category: "public_policy", weight: 0.35 },
  { term: "政治", category: "political_commentary", weight: 0.38 },
  { term: "政客", category: "political_commentary", weight: 0.4 },
  { term: "政治人物", category: "political_person", weight: 0.5 },
  { term: "執政黨", category: "party_politics", weight: 0.5 },
  { term: "在野黨", category: "party_politics", weight: 0.5 }
];

const nonPoliticalContext = [
  "吃飯", "美食", "餐廳", "球賽", "棒球", "籃球", "演唱會", "穿搭", "寵物", "旅遊", "生日"
];

const strongPoliticalContext = [
  "宣布", "表決", "攻防", "質詢", "提案", "修法", "政策", "法案", "選舉", "罷免", "公投", "黨團"
];

export function collectEvidence(text: string): MatchEvidence[] {
  const normalized = text.toLowerCase();
  return weightedRules
    .filter((rule) => normalized.includes(rule.term.toLowerCase()))
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
