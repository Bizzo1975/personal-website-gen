import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';
import { MediaService } from '@/lib/services/media-service';

/**
 * Individual Media File API Routes
 * GET: Get media file by ID
 * PUT: Update media file metadata
 * DELETE: Delete media file
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Media ids are UUIDs; anything else is simply not found (was a 500 from Postgres).
    if (!UUID_RE.test(resolvedParams.id)) return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // W41: this selected type/size/url/created_by, which media_files does not have,
    // so it always failed with a 500.
    const result = await query(
      `SELECT id, filename, original_name, file_path, file_size, mime_type, content_type,
              alt_text, uploaded_by, starred, tags, folder, created_at, updated_at
       FROM media_files 
       WHERE id = $1`,
      [resolvedParams.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    const usedBy = await MediaService.findMediaUsage(result.rows[0].file_path);
    return NextResponse.json({ ...result.rows[0], usedBy });

  } catch (error) {
    console.error('Media get error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media file' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Media ids are UUIDs; anything else is simply not found (was a 500 from Postgres).
    if (!UUID_RE.test(resolvedParams.id)) return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);
    if (has('filename') && (typeof body.filename !== 'string' || !body.filename.trim())) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    // W41: fields not sent keep their values (an alt-text-only update used to blank the name).
    const result = await query(
      `UPDATE media_files 
       SET alt_text = CASE WHEN $1::boolean THEN $2 ELSE alt_text END,
           original_name = CASE WHEN $3::boolean THEN $4 ELSE original_name END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [has('altText'), body.altText ?? null, has('filename'), has('filename') ? String(body.filename).trim() : null, resolvedParams.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error('Media update error:', error);
    return NextResponse.json(
      { error: 'Failed to update media file' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    // Media ids are UUIDs; anything else is simply not found (was a 500 from Postgres).
    if (!UUID_RE.test(resolvedParams.id)) return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // W22: refused while the file is used, unless ?force=true; the disk outcome is reported.
    const force = new URL(request.url).searchParams.get('force') === 'true';
    const r = await MediaService.deleteMediaFileChecked(resolvedParams.id, force);
    if (r.status === 'not_found') return NextResponse.json({ error: 'Media file not found' }, { status: 404 });
    if (r.status === 'in_use') {
      return NextResponse.json({ error: `In use by ${r.usedBy.join(', ')}`, usedBy: r.usedBy }, { status: 409 });
    }
    return NextResponse.json(r);

  } catch (error) {
    console.error('Media delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete media file' },
      { status: 500 }
    );
  }
}
