import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_REVIEW, ForbiddenError } from '@/lib/auth/guard';
import { validateOperatingModel, validateFunders, validateFounderExpertise } from '@/lib/validation/runner';

const RUNNERS = {
  opModel: validateOperatingModel,
  funders: validateFunders,
  founder: validateFounderExpertise,
} as const;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  try {
    assertRole(user, CAN_REVIEW);
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 });
    throw err;
  }

  const body = await req.json().catch(() => ({}));
  const applicationId = body.applicationId as string | undefined;
  const section = body.section as string | undefined;
  if (!applicationId) {
    return NextResponse.json({ error: 'applicationId is required.' }, { status: 400 });
  }
  if (!section || !(section in RUNNERS)) {
    return NextResponse.json({ error: 'section must be one of: opModel, funders, founder.' }, { status: 400 });
  }

  try {
    const { usedModel } = await RUNNERS[section as keyof typeof RUNNERS](applicationId);
    return NextResponse.json({ ok: true, usedModel });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'validation check failed' }, { status: 500 });
  }
}
