#!/usr/bin/env node

/**
 * Script to update all projects to draft status and remove featured flag
 * This script will:
 * 1. Set all projects status to 'draft'
 * 2. Set all projects featured to false
 * 3. Update the updated_at timestamp
 */

const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateAllProjectsToDraft() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting bulk project update...');
    
    // First, let's see what projects we have
    const countResult = await client.query('SELECT COUNT(*) as total FROM projects');
    const totalProjects = parseInt(countResult.rows[0].total);
    console.log(`📊 Found ${totalProjects} projects in database`);
    
    if (totalProjects === 0) {
      console.log('✅ No projects found to update');
      return;
    }
    
    // Show current status distribution
    const statusResult = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM projects 
      GROUP BY status 
      ORDER BY status
    `);
    console.log('\n📈 Current project status distribution:');
    statusResult.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count} projects`);
    });
    
    // Show current featured distribution
    const featuredResult = await client.query(`
      SELECT featured, COUNT(*) as count 
      FROM projects 
      GROUP BY featured 
      ORDER BY featured
    `);
    console.log('\n⭐ Current featured status distribution:');
    featuredResult.rows.forEach(row => {
      console.log(`   Featured ${row.featured}: ${row.count} projects`);
    });
    
    // Update all projects to draft and remove featured status
    console.log('\n🔄 Updating all projects...');
    const updateResult = await client.query(`
      UPDATE projects 
      SET 
        status = 'draft',
        featured = false,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, title, status, featured
    `);
    
    console.log(`✅ Successfully updated ${updateResult.rows.length} projects`);
    
    // Show updated status
    console.log('\n📊 Updated project status:');
    updateResult.rows.forEach(row => {
      console.log(`   ${row.title}: status=${row.status}, featured=${row.featured}`);
    });
    
    // Verify the update
    const verifyResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
        COUNT(CASE WHEN featured = false THEN 1 END) as not_featured_count
      FROM projects
    `);
    
    const stats = verifyResult.rows[0];
    console.log('\n✅ Verification:');
    console.log(`   Total projects: ${stats.total}`);
    console.log(`   Draft projects: ${stats.draft_count}`);
    console.log(`   Not featured: ${stats.not_featured_count}`);
    
    if (stats.total == stats.draft_count && stats.total == stats.not_featured_count) {
      console.log('\n🎉 All projects successfully updated to draft status with no featured projects!');
    } else {
      console.log('\n⚠️  Warning: Some projects may not have been updated correctly');
    }
    
  } catch (error) {
    console.error('❌ Error updating projects:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 Project Bulk Update Script');
    console.log('=============================');
    console.log('This script will set ALL projects to draft status and remove featured flags');
    console.log('');
    
    // Check if we're in the right directory
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const fs = require('fs');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.error('❌ Error: Please run this script from the project root directory');
      process.exit(1);
    }
    
    await updateAllProjectsToDraft();
    
    console.log('\n🎯 Script completed successfully!');
    console.log('All projects are now in draft status with no featured projects.');
    
  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { updateAllProjectsToDraft };






