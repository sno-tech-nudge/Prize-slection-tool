import { redirect } from 'next/navigation';

// jury scoring now lives in the right panel of /applications/[id] for JURY-role viewers —
// this route stays only so old bookmarks/links keep working.
export default function JuryApplicationPage({ params }: { params: { id: string } }) {
  redirect(`/applications/${params.id}`);
}
