import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';

/** Token-issuing endpoint for direct-to-Blob deck PDF uploads (see DeckUploadPanel) — the browser
 *  uploads straight to Vercel Blob using a short-lived client token from here, never through this
 *  app's own serverless function body limit (4.5MB, too small for real pitch decks). The caller
 *  gets the resulting blob URL back directly and saves it via setDeckUrlAction itself, so there's
 *  no onUploadCompleted webhook here to keep local dev working the same as production. */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const user = await getCurrentUser();
        assertRole(user, CAN_MANAGE_SETTINGS);
        return {
          allowedContentTypes: ['application/pdf'],
          addRandomSuffix: true,
          maximumSizeInBytes: 25 * 1024 * 1024,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
