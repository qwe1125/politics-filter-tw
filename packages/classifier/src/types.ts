export type FilterStrength = "low" | "medium" | "nuclear";

export type PoliticsCategory =
  | "political_person"
  | "party_politics"
  | "election"
  | "government"
  | "legislature"
  | "cross_strait"
  | "international_politics"
  | "public_policy"
  | "political_commentary"
  | "political_meme";

export interface ClassifyInput {
  text: string;
  source?: "threads" | "x" | "facebook" | "youtube" | "android" | "unknown";
  strength?: FilterStrength;
}

export interface MatchEvidence {
  term: string;
  category: PoliticsCategory;
  weight: number;
}

export interface ClassifyResult {
  politicalScore: number;
  blocked: boolean;
  categories: PoliticsCategory[];
  matched: MatchEvidence[];
  confidence: "low" | "medium" | "high";
}
