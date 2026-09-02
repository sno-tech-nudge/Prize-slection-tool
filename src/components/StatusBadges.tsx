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

// Deliberately no red/amber/green-style coding by score or disposition here — the composite and
// disposition are decision support, not a verdict, so they're shown as plain neutral badges the
// reviewer reads and judges themselves rather than a traffic light telling them what to think.
export function DispositionTag({ disposition }: { disposition: string }) {
  return <Tag>{DISPOSITION_LABEL[disposition as DispositionValue] ?? disposition}</Tag>;
}

export function CompositeBadge({ score, max = 100 }: { score: number; max?: number }) {
  return (
    <Badge tone="outline">
      {Math.round(score)} / {max}
    </Badge>
  );
}

export function SolutionCategoryTag({ category }: { category: string }) {
  return <Tag>{SOLUTION_CATEGORY_LABEL[category as SolutionCategoryValue] ?? category}</Tag>;
}
