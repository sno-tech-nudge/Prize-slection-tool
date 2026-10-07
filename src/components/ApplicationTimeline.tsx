import React from 'react';
import { Check, X } from 'lucide-react';
import { Card } from '@/design-system';

type StepState = 'passed' | 'rejected' | 'pending' | 'locked';

interface TimelineApp {
  round1Decision: string | null;
  round2Decision: string | null;
  round3Decision: string | null;
  currentRound: string;
}

interface Step {
  key: string;
  label: string;
  caption: string;
  state: StepState;
  detail: string;
}

function stepFromDecision(decision: string | null, reached: boolean): { state: StepState; detail: string } {
  if (!reached) return { state: 'locked', detail: 'not reached' };
  if (decision === 'YES') return { state: 'passed', detail: 'moved ahead' };
  if (decision === 'NO') return { state: 'rejected', detail: 'rejected' };
  if (decision === 'UNDER_REVIEW') return { state: 'pending', detail: 'under review' };
  return { state: 'pending', detail: 'decision pending' };
}

/** The application's journey round by round, derived from its round decisions: a green tick once a
 *  round is passed, a red cross where it was rejected, a blinking light on the round still waiting
 *  for a decision, and everything after a rejection (or not yet reached) left greyed out. */
function buildSteps(app: TimelineApp): Step[] {
  const r1 = stepFromDecision(app.round1Decision, true);
  const r2 = stepFromDecision(app.round2Decision, r1.state === 'passed');
  const r3 = stepFromDecision(app.round3Decision, r2.state === 'passed');
  const selected: { state: StepState; detail: string } =
    r3.state === 'passed' || app.currentRound === 'SELECTED'
      ? { state: 'passed', detail: 'selected' }
      : { state: 'locked', detail: 'not reached' };

  return [
    { key: 'r1', label: 'round 1', caption: 'application screening', ...r1 },
    { key: 'r2', label: 'round 2', caption: 'jury round', ...r2 },
    { key: 'r3', label: 'round 3', caption: 'field visit', ...r3 },
    { key: 'sel', label: 'selected', caption: 'final cohort', ...selected },
  ];
}

const STATE_COLOR: Record<StepState, string> = {
  passed: 'var(--status-good)',
  rejected: 'var(--delta-red)',
  pending: 'var(--delta-yellow)',
  locked: 'var(--border-subtle)',
};

function Marker({ state }: { state: StepState }) {
  const base: React.CSSProperties = {
    width: 32,
    height: 32,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${STATE_COLOR[state]}`,
    background: 'var(--surface-card)',
  };
  if (state === 'passed') {
    return (
      <span style={base} aria-label="passed">
        <Check size={18} strokeWidth={3} color="var(--status-good)" strokeLinejoin="miter" strokeLinecap="square" />
      </span>
    );
  }
  if (state === 'rejected') {
    return (
      <span style={base} aria-label="rejected">
        <X size={18} strokeWidth={3} color="var(--delta-red)" strokeLinejoin="miter" strokeLinecap="square" />
      </span>
    );
  }
  if (state === 'pending') {
    return (
      <span style={base} aria-label="decision pending">
        <span className="delta-blink" style={{ width: 12, height: 12, background: 'var(--delta-yellow)' }} />
      </span>
    );
  }
  return <span style={base} aria-label="not reached" />;
}

export function ApplicationTimeline({ app }: { app: TimelineApp }) {
  const steps = buildSteps(app);

  return (
    <Card>
      <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-6)' }}>application timeline</h2>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', rowGap: 'var(--space-6)' }}>
        {steps.map((step, i) => {
          const last = i === steps.length - 1;
          return (
            <li key={step.key} style={{ display: 'flex', alignItems: 'flex-start', flex: last ? '0 0 auto' : '1 1 0', minWidth: 160 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <Marker state={step.state} />
                <div>
                  <div
                    style={{
                      fontSize: 'var(--fs-small)',
                      fontWeight: 'var(--fw-bold)' as unknown as number,
                      color: step.state === 'locked' ? 'var(--text-muted)' : 'var(--text-primary)',
                      textTransform: 'lowercase',
                    }}
                  >
                    {step.label}
                  </div>
                  <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>{step.caption}</div>
                  <div
                    style={{
                      fontSize: 'var(--fs-caption)',
                      fontWeight: 'var(--fw-semibold)' as unknown as number,
                      marginTop: 'var(--space-1)',
                      color:
                        step.state === 'passed'
                          ? 'var(--status-good)'
                          : step.state === 'rejected'
                            ? 'var(--delta-red)'
                            : 'var(--text-secondary)',
                    }}
                  >
                    {step.detail}
                  </div>
                </div>
              </div>
              {!last && (
                <div
                  aria-hidden="true"
                  style={{
                    flex: 1,
                    height: 2,
                    marginTop: 15,
                    marginInline: 'var(--space-3)',
                    background: step.state === 'passed' ? 'var(--status-good)' : 'var(--border-subtle)',
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
