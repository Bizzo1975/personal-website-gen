import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

// W1c: folders could be created but never renamed or deleted.

async function admin() {
  const session = await getServerSession(authOptions);
  return !!session && session.user?.role === 'admin';
}

/** PUT { name } - rename a folder (names are unique within the same parent). */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await admin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Invalid folder id' }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 255) return NextResponse.json({ error: 'Folder name is required (up to 255 characters)' }, { status: 400 });
  try {
    const folder = await query('SELECT id, parent_id FROM media_folders WHERE id = $1', [id]);
    if (folder.rows.length === 0) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    const clash = await query(
      'SELECT 1 FROM media_folders WHERE name = $1 AND parent_id IS NOT DISTINCT FROM $2 AND id <> $3',
      [name, folder.rows[0].parent_id, id]
    );
    if (clash.rows.length > 0) return NextResponse.json({ error: 'A folder with this name already exists here' }, { status: 409 });
    const r = await query(
      'UPDATE media_folders SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, parent_id',
      [name, id]
    );
    return NextResponse.json({ success: true, folder: { id: r.rows[0].id, name: r.rows[0].name, parentId: r.rows[0].parent_id } });
  } catch (error) {
    console.error('Folder rename error:', error);
    return NextResponse.json({ error: 'Failed to rename folder' }, { status: 500 });
  }
}

/** DELETE - only an empty folder (no files, no subfolders); nothing is moved or lost silently. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await admin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Invalid folder id' }, { status: 400 });
  try {
    const counts = await query(
      `SELECT (SELECT COUNT(*) FROM media_folders WHERE id = $1)::int AS exists,
              (SELECT COUNT(*) FROM media_files WHERE folder = $1::text)::int AS files,
              (SELECT COUNT(*) FROM media_folders WHERE parent_id = $1::int)::int AS subfolders`,
      [id]
    );
    const c = counts.rows[0];
    if (!c.exists) return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    if (c.files > 0 || c.subfolders > 0) {
      return NextResponse.json(
        { error: `Folder is not empty (${c.files} file(s), ${c.subfolders} folder(s)). Move or delete them first.` },
        { status: 409 }
      );
    }
    await query('DELETE FROM media_folders WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Folder delete error:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}
