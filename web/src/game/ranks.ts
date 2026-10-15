/** Rank tiers, by running score. Each tier starts at its minScore and lasts until the next. */
export interface RankTier {
  name: string;
  minScore: number;
}

export const RANKS: readonly RankTier[] = [
  { name: "Beginner", minScore: 0 },
  { name: "Good Start", minScore: 5 },
  { name: "Moving Up", minScore: 15 },
  { name: "Good", minScore: 30 },
  { name: "Solid", minScore: 50 },
  { name: "Nice", minScore: 75 },
  { name: "Great", minScore: 100 },
  { name: "Amazing", minScore: 150 },
  { name: "Genius", minScore: 200 },
];

export const TOP_RANK = RANKS[RANKS.length - 1]!.name;

/** The rank for a score. The top rank, Genius, starts at 200 points. */
export function getRank(score: number): string {
  let rank = RANKS[0]!.name;
  for (const tier of RANKS) if (score >= tier.minScore) rank = tier.name;
  return rank;
}
