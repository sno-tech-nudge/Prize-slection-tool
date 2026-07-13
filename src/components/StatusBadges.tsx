import { Badge, Tag } from '@/design-system';
import { STAGE_STATUS_LABEL, SOLUTION_CATEGORY_LABEL, type StageStatusValue, type SolutionCategoryValue } from '@/lib/constants';
import type { DispositionValue } from '@/lib/constants';

export function StageBadge({ stage }: { stage: string }) {
  const tone =
    stage === 'WINNER' ? 'red' : stage === 'REJECTED' || stage === 'WITHDRAWN' ? 'neutral' : stage === 'FINALIST' || stage === 'JURY_REVIEW' ? 'ink' : 'outline';
  return <Badge tone={tone}>{STAGE_STATUS_LABEL[stage as StageStatusValue] ?? stage}</Badge>;
}

const DISPOSITION_LABEL: Record<DispositionValue, string> = {
  STRONG_ADVANCE: 'strong advance',
  ADVANCE: 'advance',
  BORDERLINE: 'borderline',
  REJECT: 'reject',
};

export function DispositionTag({ disposition }: { disposition: string }) {
  const selected = disposition === 'STRONG_ADVANCE' || disposition === 'ADVANCE';
  return <Tag selected={selected}>{DISPOSITION_LABEL[disposition as DispositionValue] ?? disposition}</Tag>;
}

export function CompositeBadge({ score }: { score: number }) {
  const tone = score >= 80 ? 'red' : score >= 60 ? 'ink' : score >= 45 ? 'yellow' : 'neutral';
  return <Badge tone={tone}>{Math.round(score)} / 100</Badge>;
}

export function SolutionCategoryTag({ category }: { category: string }) {
  return <Tag>{SOLUTION_CATEGORY_LABEL[category as SolutionCategoryValue] ?? category}</Tag>;
}
