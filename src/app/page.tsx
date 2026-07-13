import { redirect } from 'next/navigation';

/** This is an internal team tool, not an applicant-facing site — the dashboard is home. */
export default function RootPage() {
  redirect('/dashboard');
}
