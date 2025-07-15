import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * Direct Media Library Migration API Route
 * POST: Run database migration without authentication (for development)
 * Note: This endpoint should be removed in production
 */

export async function POST(request: NextRequest) {
  try {
    // Security check - only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        error: 'Direct migration not allowed in production',
        message: 'Please use the authenticated migration endpoint or run migration through admin panel'
      }, { status: 403 });
    }

    // Additional security - require a specific header
    const migrationKey = request.headers.get('X-Migration-Key');
    if (migrationKey !== 'migrate-media-library-dev') {
      return NextResponse.json({ 
        error: 'Invalid migration key',
        message: 'Include X-Migration-Key header with value: migrate-media-library-dev'
      }, { status: 401 });
    }

    console.log('🔧 Starting Direct Media Library Migration...');

    const steps = [];
    const errors = [];

    try {
      // Step 1: Check if media_files table exists
      try {
        await query('SELECT 1 FROM media_files LIMIT 1');
        console.log('✅ media_files table exists');
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'media_files table not found',
          message: 'Please ensure your database is set up correctly with the media_files table'
        }, { status: 500 });
      }

      // Step 1: Add columns to media_files table for advanced features
      console.log('📝 Adding new columns to media_files table...');
      try {
        await query(`
          ALTER TABLE media_files 
          ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
          ADD COLUMN IF NOT EXISTS folder VARCHAR(255) DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        steps.push('✅ Added new columns to media_files table');
      } catch (error) {
        console.error('Error adding columns:', error);
        errors.push(`Failed to add columns: ${error.message}`);
      }

      // Step 2: Create media_folders table if it doesn't exist
      console.log('📁 Creating media_folders table...');
      try {
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
        console.error('Error creating folders table:', error);
        errors.push(`Failed to create folders table: ${error.message}`);
      }

      // Step 3: Create indexes for better performance
      console.log('🔍 Creating performance indexes...');
      try {
        await query(`CREATE INDEX IF NOT EXISTS idx_media_files_starred ON media_files(starred)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_media_files_tags ON media_files USING GIN(tags)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_media_files_folder ON media_files(folder)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_media_files_updated_at ON media_files(updated_at)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_media_folders_parent ON media_folders(parent_id)`);
        steps.push('✅ Created performance indexes');
      } catch (error) {
        console.error('Error creating indexes:', error);
        errors.push(`Failed to create indexes: ${error.message}`);
      }

      // Step 4: Add default folders
      console.log('📂 Adding default folders...');
      try {
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
      } catch (error) {
        console.error('Error adding folders:', error);
        errors.push(`Failed to add folders: ${error.message}`);
      }

      // Step 5: Update existing files to have proper structure
      console.log('🔄 Updating existing files...');
      try {
        const updateResult = await query(`
          UPDATE media_files SET 
              starred = COALESCE(starred, FALSE),
              tags = COALESCE(tags, '[]'::jsonb),
              updated_at = COALESCE(updated_at, created_at)
          WHERE starred IS NULL OR tags IS NULL OR updated_at IS NULL
        `);
        steps.push(`✅ Updated ${updateResult.rowCount} existing files`);
      } catch (error) {
        console.error('Error updating files:', error);
        errors.push(`Failed to update files: ${error.message}`);
      }

      // Step 6: Add trigger function for automatic updated_at timestamp
      console.log('⚙️ Creating automatic timestamp triggers...');
      try {
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
      } catch (error) {
        console.error('Error creating triggers:', error);
        errors.push(`Failed to create triggers: ${error.message}`);
      }

      // Step 7: Create convenience view
      console.log('📊 Creating media files view...');
      try {
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
      } catch (error) {
        console.error('Error creating view:', error);
        errors.push(`Failed to create view: ${error.message}`);
      }

      // Step 8: Add comments
      try {
        await query(`COMMENT ON TABLE media_files IS 'Enhanced media files table with starring, tagging, and folder support'`);
        await query(`COMMENT ON TABLE media_folders IS 'Media organization folders with hierarchical structure'`);
        await query(`COMMENT ON VIEW media_files_with_folders IS 'Convenience view combining media files with folder information'`);
        steps.push('✅ Added table comments');
      } catch (error) {
        console.error('Error adding comments:', error);
        errors.push(`Failed to add comments: ${error.message}`);
      }

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
        errors: errors.length > 0 ? errors : null,
        note: 'Migration completed successfully! You can now refresh your Media Library page to see the new features.'
      });

    } catch (stepError) {
      console.error('Migration step failed:', stepError);
      errors.push(`Migration step failed: ${stepError.message}`);
      
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