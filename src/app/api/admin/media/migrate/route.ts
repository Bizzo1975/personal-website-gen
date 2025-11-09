import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { query } from '@/lib/db';

/**
 * Media Library Migration API Route
 * POST: Run database migration to add advanced features
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 Starting Media Library Migration...');

    const steps: string[] = [];
    const errors: string[] = [];

    try {
      // Step 1: Add columns to media_files table for advanced features
      console.log('📝 Adding new columns to media_files table...');
      await query(`
        ALTER TABLE media_files 
        ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS folder VARCHAR(255) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      steps.push('✅ Added new columns to media_files table');

      // Step 2: Create media_folders table if it doesn't exist
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

      // Step 3: Create indexes for better performance
      console.log('🔍 Creating performance indexes...');
      await query(`CREATE INDEX IF NOT EXISTS idx_media_files_starred ON media_files(starred)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_media_files_tags ON media_files USING GIN(tags)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_media_files_folder ON media_files(folder)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_media_files_updated_at ON media_files(updated_at)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_media_folders_parent ON media_folders(parent_id)`);
      steps.push('✅ Created performance indexes');

      // Step 4: Add default folders
      console.log('📂 Adding default folders...');
      const folderInserts = [
        { name: 'Images', parent_id: null },
        { name: 'Documents', parent_id: null },
        { name: 'Videos', parent_id: null },
        { name: 'Projects', parent_id: null },
        { name: 'Blog', parent_id: null }
      ];

      for (const folder of folderInserts) {
        await query(`
          INSERT INTO media_folders (name, parent_id) 
          SELECT $1, $2 
          WHERE NOT EXISTS (SELECT 1 FROM media_folders WHERE name = $1 AND parent_id IS NULL)
        `, [folder.name, folder.parent_id]);
      }
      steps.push('✅ Added default folders');

      // Step 5: Update existing files to have proper structure
      console.log('🔄 Updating existing files...');
      const updateResult = await query(`
        UPDATE media_files SET 
            starred = COALESCE(starred, FALSE),
            tags = COALESCE(tags, '[]'::jsonb),
            updated_at = COALESCE(updated_at, created_at)
        WHERE starred IS NULL OR tags IS NULL OR updated_at IS NULL
      `);
      steps.push(`✅ Updated ${updateResult.rowCount} existing files`);

      // Step 6: Add trigger function for automatic updated_at timestamp
      console.log('⚙️ Creating automatic timestamp triggers...');
      await query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql'
      `);

      // Drop and recreate triggers
      await query(`DROP TRIGGER IF EXISTS update_media_files_updated_at ON media_files`);
      await query(`
        CREATE TRIGGER update_media_files_updated_at
            BEFORE UPDATE ON media_files
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
      `);

      await query(`DROP TRIGGER IF EXISTS update_media_folders_updated_at ON media_folders`);
      await query(`
        CREATE TRIGGER update_media_folders_updated_at
            BEFORE UPDATE ON media_folders
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()
      `);
      steps.push('✅ Created automatic timestamp triggers');

      // Step 7: Create convenience view
      console.log('📊 Creating media files view...');
      await query(`
        CREATE OR REPLACE VIEW media_files_with_folders AS
        SELECT 
            mf.*,
            folders.name as folder_name,
            folders.parent_id as folder_parent_id
        FROM media_files mf
        LEFT JOIN media_folders folders ON mf.folder = folders.id::text
      `);
      steps.push('✅ Created media files view');

      // Step 8: Add comments
      await query(`COMMENT ON TABLE media_files IS 'Enhanced media files table with starring, tagging, and folder support'`);
      await query(`COMMENT ON TABLE media_folders IS 'Media organization folders with hierarchical structure'`);
      await query(`COMMENT ON VIEW media_files_with_folders IS 'Convenience view combining media files with folder information'`);
      steps.push('✅ Added table comments');

      // Get summary stats
      const filesResult = await query('SELECT COUNT(*) as count FROM media_files');
      const foldersResult = await query('SELECT COUNT(*) as count FROM media_folders');
      const filesCount = filesResult.rows[0].count;
      const foldersCount = foldersResult.rows[0].count;

      console.log('🎉 Media Library Migration Complete!');

      return NextResponse.json({
        success: true,
        message: 'Media Library enhancement completed successfully!',
        steps,
        summary: {
          totalFiles: parseInt(filesCount),
          totalFolders: parseInt(foldersCount),
          features: [
            'File starring system',
            'Tagging system',
            'Folder organization',
            'Advanced search & filtering',
            'Bulk operations',
            'Keyboard shortcuts',
            'Professional UI'
          ]
        },
        errors: errors.length > 0 ? errors : null
      });

    } catch (stepError) {
      console.error('Migration step failed:', stepError);
      const errorMessage = stepError instanceof Error ? stepError.message : 'Unknown error';
      errors.push(`Migration step failed: ${errorMessage}`);
      
      return NextResponse.json({
        success: false,
        message: 'Migration failed during execution',
        steps,
        errors
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({
      success: false,
      error: 'Failed to run migration',
      details: errorMessage
    }, { status: 500 });
  }
} 