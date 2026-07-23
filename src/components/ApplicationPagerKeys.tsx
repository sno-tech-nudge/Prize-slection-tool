'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Lets ← / → step between applications, matching the on-screen prev/next arrows. Ignored
 *  while typing in an input/textarea (comments, notes) so arrow keys still move the cursor. */
export function ApplicationPagerKeys({
  prevId,
  nextId,
  queryString = '',
}: {
  prevId: string | null;
  nextId: string | null;
  queryString?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;
      if (e.key === 'ArrowLeft' && prevId) router.push(`/applications/${prevId}${queryString}`);
      if (e.key === 'ArrowRight' && nextId) router.push(`/applications/${nextId}${queryString}`);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [prevId, nextId, queryString, router]);

  return null;
}
