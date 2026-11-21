import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { MediaService } from '@/lib/services/media-service';

/**
 * DELETE: delete media files and report, per file, what really happened (W22).
 * Body: { fileIds: string[], force?: boolean }
 * - A file that is used somewhere (posts, projects, pages, site settings, profiles,
 *   campaigns) is not deleted unless force is true; the response lists where it is used.
 * - The old POST here "simulated" deletion (deleted nothing, reported success). Removed.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const fileIds: unknown = body.fileIds;
    const force = body.force === true;
    if (!Array.isArray(fileIds) || fileIds.length === 0 || fileIds.some((id) => typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id))) {
      return NextResponse.json({ error: 'fileIds must be a non-empty list of media ids' }, { status: 400 });
    }

    const results = [];
    for (const id of fileIds as string[]) {
      try {
        results.push({ id, ...(await MediaService.deleteMediaFileChecked(id, force)) });
      } catch (error) {
        results.push({ id, status: 'error' as const, error: error instanceof Error ? error.message : String(error) });
      }
    }

    const deleted = results.filter((r) => r.status === 'deleted').length;
    const inUse = results.filter((r) => r.status === 'in_use');
    const diskProblems = results.filter((r) => r.status === 'deleted' && 'disk' in r && r.disk === 'failed');
    const failed = results.filter((r) => r.status === 'error' || r.status === 'not_found');

    return NextResponse.json(
      {
        success: deleted === fileIds.length && diskProblems.length === 0,
        deleted,
        total: fileIds.length,
        inUse: inUse.length,
        results,
      },
      // 409 when nothing was deleted because the files are in use; 207-style partials stay 200
      { status: deleted === 0 && inUse.length > 0 && failed.length === 0 ? 409 : deleted === 0 ? 400 : 200 }
    );
  } catch (error) {
    console.error('Media delete error:', error);
    return NextResponse.json({ error: 'Failed to delete files' }, { status: 500 });
  }
}
