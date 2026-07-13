export interface ConsensusInput {
  aiComposite?: number | null;
  humanComposites: number[];
}

export interface ConsensusResult {
  avgHuman: number | null;
  spread: number | null; // max - min among human reviewer composites
  aiVsHumanGap: number | null;
  divergent: boolean; // true if reviewers disagree with each other or with the AI beyond threshold
}

const SPREAD_THRESHOLD = 20; // points on a 0-100 scale
const AI_GAP_THRESHOLD = 25;

export function computeConsensus({ aiComposite, humanComposites }: ConsensusInput): ConsensusResult {
  if (humanComposites.length === 0) {
    return { avgHuman: null, spread: null, aiVsHumanGap: null, divergent: false };
  }
  const avgHuman = humanComposites.reduce((a, b) => a + b, 0) / humanComposites.length;
  const spread = Math.max(...humanComposites) - Math.min(...humanComposites);
  const aiVsHumanGap = aiComposite != null ? Math.abs(aiComposite - avgHuman) : null;
  const divergent = spread > SPREAD_THRESHOLD || (aiVsHumanGap != null && aiVsHumanGap > AI_GAP_THRESHOLD);
  return { avgHuman, spread, aiVsHumanGap, divergent };
}
