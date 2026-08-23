import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_MANAGE_SETTINGS, ForbiddenError } from '@/lib/auth/guard';
import { getUpload, type UploadKind } from '@/lib/uploads/settingsUploads';

function isValidKind(value: string): value is UploadKind {
  return value === 'RUBRIC' || value === 'JURY_GUIDELINES';
}

export async function GET(_req: NextRequest, { params }: { params: { kind: string } }) {
  const user = await getCurrentUser();
  try {
    assertRole(user, CAN_MANAGE_SETTINGS);
  } catch (err) {
    if (err instanceof ForbiddenError) return NextResponse.json({ error: err.message }, { status: 403 });
    throw err;
  }

  if (!isValidKind(params.kind)) {
    return NextResponse.json({ error: 'kind must be RUBRIC or JURY_GUIDELINES.' }, { status: 400 });
  }

  const upload = await getUpload(params.kind);
  if (!upload) return NextResponse.json({ error: 'nothing uploaded yet.' }, { status: 404 });

  const bytes = Buffer.from(upload.dataBase64, 'base64');
  return new NextResponse(bytes, {
    headers: {
      'Content-Type': upload.mimeType,
      'Content-Disposition': `attachment; filename="${upload.filename.replace(/"/g, '')}"`,
      'Content-Length': String(bytes.length),
    },
  });
}
