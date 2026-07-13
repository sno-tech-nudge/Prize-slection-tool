import { NextResponse } from 'next/server';
import { processPendingJobs, getJobStats } from '@/lib/jobs/queue';

/** Ticked by the client-side JobQueueTicker every few seconds while the internal tool is open.
 *  SWAP POINT: in production this is a real worker process consuming a real queue, not a poll. */
export async function POST() {
  const result = await processPendingJobs(3);
  const stats = await getJobStats();
  return NextResponse.json({ ...result, stats });
}

export async function GET() {
  const stats = await getJobStats();
  return NextResponse.json({ stats });
}
