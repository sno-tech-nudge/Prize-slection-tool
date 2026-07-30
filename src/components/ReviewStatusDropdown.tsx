import { Badge } from '@/design-system';

/** Read-only "reviewed / not reviewed" badge — reflects whether at least one real HumanReview
 *  exists for this application, nothing else. This used to be an editable dropdown that toggled
 *  stageStatus directly (SUBMITTED <-> UNDER_REVIEW) as a manual override, independent of whether
 *  anyone had actually submitted a score — that let "reviewed" show for an application nobody had
 *  reviewed (or hide it for one that had been scored but not stage-toggled), which is exactly the
 *  inconsistency between this column, the dashboard KPI, and the reviewed/not-reviewed filter
 *  (both of which already read humanReviews.length > 0) that this component now matches. */
export function ReviewStatusDropdown({ reviewed }: { reviewed: boolean }) {
  return <Badge tone={reviewed ? 'red' : 'outline'}>{reviewed ? 'reviewed' : 'not reviewed'}</Badge>;
}
