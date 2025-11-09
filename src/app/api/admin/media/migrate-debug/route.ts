import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

/**
 * Media Library Migration Debug API Route
 * POST: Run database migration with detailed error reporting
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 Starting Media Library Migration Debug...');

    const steps: string[] = [];
    const errors: string[] = [];

    // Step 1: Check current table structure
    try {
      console.log('🔍 Checking current media_files table structure...');
      const tableInfo = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'media_files'
        ORDER BY ordinal_position
      `);
      steps.push(`✅ Current table has ${tableInfo.rows.length} columns: ${tableInfo.rows.map(r => r.column_name).join(', ')}`);
    } catch (error) {
      const msg = `❌ Step 1 failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(msg);
      errors.push(msg);
      return NextResponse.json({ success: false, message: 'Failed at step 1', steps, errors }, { status: 500 });
    }

    // Step 2: Add columns one by one
    const columnsToAdd = [
      { name: 'starred', type: 'BOOLEAN', default: 'FALSE' },
      { name: 'tags', type: 'JSONB', default: "'[]'" },
      { name: 'folder', type: 'VARCHAR(255)', default: 'NULL' },
      { name: 'updated_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
    ];

    for (const col of columnsToAdd) {
      try {
        console.log(`📝 Adding column ${col.name}...`);
        await query(`ALTER TABLE media_files ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} DEFAULT ${col.default}`);
        steps.push(`✅ Added column ${col.name}`);
      } catch (error) {
        const msg = `❌ Failed to add column ${col.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(msg);
        errors.push(msg);
      }
    }

    // Step 3: Create media_folders table
    try {
      console.log('📁 Creating media_folders table...');
      await query(`
        CREATE TABLE IF NOT EXISTS media_folders (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            parent_id INTEGER REFERENCES media_folders(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      steps.push('✅ Created media_folders table');
    } catch (error) {
      const msg = `❌ Failed to create media_folders table: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(msg);
      errors.push(msg);
    }

    // Step 4: Create indexes
    const indexes = [
      { name: 'idx_media_files_starred', sql: 'CREATE INDEX IF NOT EXISTS idx_media_files_starred ON media_files(starred)' },
      { name: 'idx_media_files_tags', sql: 'CREATE INDEX IF NOT EXISTS idx_media_files_tags ON media_files USING GIN(tags)' },
      { name: 'idx_media_files_folder', sql: 'CREATE INDEX IF NOT EXISTS idx_media_files_folder ON media_files(folder)' },
      { name: 'idx_media_files_updated_at', sql: 'CREATE INDEX IF NOT EXISTS idx_media_files_updated_at ON media_files(updated_at)' },
      { name: 'idx_media_folders_parent', sql: 'CREATE INDEX IF NOT EXISTS idx_media_folders_parent ON media_folders(parent_id)' }
    ];

    for (const idx of indexes) {
      try {
        console.log(`🔍 Creating index ${idx.name}...`);
        await query(idx.sql);
        steps.push(`✅ Created index ${idx.name}`);
      } catch (error) {
        const msg = `❌ Failed to create index ${idx.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(msg);
        errors.push(msg);
      }
    }

    // Step 5: Test final table structure
    try {
      console.log('🔍 Checking final table structure...');
      const finalTableInfo = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'media_files'
        ORDER BY ordinal_position
      `);
      steps.push(`✅ Final table has ${finalTableInfo.rows.length} columns: ${finalTableInfo.rows.map(r => r.column_name).join(', ')}`);
    } catch (error) {
      const msg = `❌ Failed to check final structure: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(msg);
      errors.push(msg);
    }

    // Step 6: Get summary
    try {
      const filesResult = await query('SELECT COUNT(*) as count FROM media_files');
      const filesCount = filesResult.rows[0].count;
      steps.push(`✅ Total media files: ${filesCount}`);
    } catch (error) {
      const msg = `❌ Failed to get file count: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(msg);
      errors.push(msg);
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length === 0 ? 'Migration completed successfully!' : 'Migration completed with some errors',
      steps,
      errors,
      summary: {
        totalSteps: steps.length,
        totalErrors: errors.length,
        status: errors.length === 0 ? 'success' : 'partial_success'
      }
    });

  } catch (error) {
    console.error('❌ Migration debug error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: 'Failed to run migration debug',
      details: errorMessage
    }, { status: 500 });
  }
} 