export type JuryConsensusStatus = 'green' | 'yellow' | 'red' | 'none';

export interface JuryConsensus {
  status: JuryConsensusStatus;
  label: string;
  yesCount: number;
  noCount: number;
}

/** Majority-vote read across a bench's jury verdicts — unanimous yes is green, unanimous no is
 *  red, anything split (including an exact tie) is yellow labelled with whichever side has more
 *  votes, or "tied" when it's even. No scores yet at all is "none" (a neutral, uncoloured state),
 *  not yellow — a tie needs at least one vote on each side to actually be a tie. */
export function computeJuryConsensus(verdicts: string[]): JuryConsensus {
  const yes = verdicts.filter((v) => v === 'YES').length;
  const no = verdicts.filter((v) => v === 'NO').length;
  const total = yes + no;

  if (total === 0) return { status: 'none', label: 'not yet scored', yesCount: 0, noCount: 0 };
  if (no === 0) return { status: 'green', label: 'yes', yesCount: yes, noCount: no };
  if (yes === 0) return { status: 'red', label: 'no', yesCount: yes, noCount: no };
  if (yes === no) return { status: 'yellow', label: 'tied', yesCount: yes, noCount: no };
  return { status: 'yellow', label: yes > no ? 'yes' : 'no', yesCount: yes, noCount: no };
}
