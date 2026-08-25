import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getUpload, type UploadKind } from '@/lib/uploads/settingsUploads';

function isValidKind(value: string): value is UploadKind {
  return value === 'JURY_GUIDELINES';
}

/** Any signed-in role can fetch the uploaded guidelines file — used for the admin "download to
 *  verify" link in settings. Upload/delete stay CAN_MANAGE_SETTINGS-gated in
 *  src/lib/uploads/actions.ts; this route is read-only. */
export async function GET(req: NextRequest, { params }: { params: { kind: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'sign in required.' }, { status: 401 });

  if (!isValidKind(params.kind)) {
    return NextResponse.json({ error: 'kind must be JURY_GUIDELINES.' }, { status: 400 });
  }

  const upload = await getUpload(params.kind);
  if (!upload) return NextResponse.json({ error: 'nothing uploaded yet.' }, { status: 404 });

  const inline = req.nextUrl.searchParams.get('disposition') === 'inline';
  const bytes = Buffer.from(upload.dataBase64, 'base64');
  return new NextResponse(bytes, {
    headers: {
      'Content-Type': upload.mimeType,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${upload.filename.replace(/"/g, '')}"`,
      'Content-Length': String(bytes.length),
    },
  });
}
