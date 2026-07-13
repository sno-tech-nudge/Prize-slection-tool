import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_REVIEW, ForbiddenError } from '@/lib/auth/guard';
import { scoreApplication } from '@/lib/scoring/runner';

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
  if (!applicationId) {
    return NextResponse.json({ error: 'applicationId is required.' }, { status: 400 });
  }

  try {
    const { usedModel } = await scoreApplication(applicationId);
    return NextResponse.json({ ok: true, usedModel });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'scoring failed' }, { status: 500 });
  }
}
