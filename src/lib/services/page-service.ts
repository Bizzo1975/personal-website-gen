import { query } from '../db';

// Define PageData interface directly here to avoid export issues
export interface PageData {
  id: string;
  name?: string;
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  heroHeading?: string;
  connectSectionTitle?: string;
  connectSectionContent?: string;
  formSectionTitle?: string;
  formDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Convert database row to PageData interface
export function convertToPageData(row: any): PageData {
  return {
    id: row.id,
    name: row.name || '',
    title: row.title,
    slug: row.slug,
    content: row.content,
    metaDescription: row.meta_description,
    headerTitle: row.header_title,
    headerSubtitle: row.header_subtitle,
    heroHeading: row.hero_heading,
    connectSectionTitle: row.connect_section_title,
    connectSectionContent: row.connect_section_content,
    formSectionTitle: row.form_section_title,
    formDescription: row.form_description,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Get all pages
export async function getAllPages(): Promise<PageData[]> {
  try {
    const result = await query('SELECT * FROM pages ORDER BY created_at DESC');
    return result.rows.map(convertToPageData);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}

// Get page by ID
export async function getPageById(id: string): Promise<PageData | null> {
  try {
    const result = await query('SELECT * FROM pages WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return convertToPageData(result.rows[0]);
  } catch (error) {
    console.error('Error fetching page by ID:', error);
    return null;
  }
}

// Get page by slug
export async function getPageBySlug(slug: string): Promise<PageData | null> {
  try {
    const result = await query('SELECT * FROM pages WHERE slug = $1', [slug]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return convertToPageData(result.rows[0]);
  } catch (error) {
    console.error('Error fetching page by slug:', error);
    return null;
  }
}

// Create a new page
export async function createPage(pageData: Omit<PageData, 'id' | 'createdAt' | 'updatedAt'>): Promise<PageData | null> {
  try {
    const result = await query(
      `INSERT INTO pages (
        name, title, slug, content, meta_description, header_title, header_subtitle, 
        hero_heading, connect_section_title, connect_section_content, 
        form_section_title, form_description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        pageData.name,
        pageData.title,
        pageData.slug,
        pageData.content,
        pageData.metaDescription,
        pageData.headerTitle,
        pageData.headerSubtitle,
        pageData.heroHeading,
        pageData.connectSectionTitle,
        pageData.connectSectionContent,
        pageData.formSectionTitle,
        pageData.formDescription,
      ]
    );
    
    return convertToPageData(result.rows[0]);
  } catch (error) {
    console.error('Error creating page:', error);
    return null;
  }
}

// Update a page
export async function updatePage(id: string, pageData: Partial<PageData>): Promise<PageData | null> {
  try {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    if (pageData.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(pageData.name);
    }
    if (pageData.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(pageData.title);
    }
    if (pageData.slug !== undefined) {
      fields.push(`slug = $${paramCount++}`);
      values.push(pageData.slug);
    }
    if (pageData.content !== undefined) {
      fields.push(`content = $${paramCount++}`);
      values.push(pageData.content);
    }
    if (pageData.metaDescription !== undefined) {
      fields.push(`meta_description = $${paramCount++}`);
      values.push(pageData.metaDescription);
    }
    if (pageData.headerTitle !== undefined) {
      fields.push(`header_title = $${paramCount++}`);
      values.push(pageData.headerTitle);
    }
    if (pageData.headerSubtitle !== undefined) {
      fields.push(`header_subtitle = $${paramCount++}`);
      values.push(pageData.headerSubtitle);
    }
    if (pageData.heroHeading !== undefined) {
      fields.push(`hero_heading = $${paramCount++}`);
      values.push(pageData.heroHeading);
    }
    if (pageData.connectSectionTitle !== undefined) {
      fields.push(`connect_section_title = $${paramCount++}`);
      values.push(pageData.connectSectionTitle);
    }
    if (pageData.connectSectionContent !== undefined) {
      fields.push(`connect_section_content = $${paramCount++}`);
      values.push(pageData.connectSectionContent);
    }
    if (pageData.formSectionTitle !== undefined) {
      fields.push(`form_section_title = $${paramCount++}`);
      values.push(pageData.formSectionTitle);
    }
    if (pageData.formDescription !== undefined) {
      fields.push(`form_description = $${paramCount++}`);
      values.push(pageData.formDescription);
    }
    
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const result = await query(
      `UPDATE pages SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return convertToPageData(result.rows[0]);
  } catch (error) {
    console.error('Error updating page:', error);
    return null;
  }
}

// Delete a page
export async function deletePage(id: string): Promise<boolean> {
  try {
    const result = await query('DELETE FROM pages WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  } catch (error) {
    console.error('Error deleting page:', error);
    return false;
  }
}

// Check if a page exists by slug
export async function pageExistsBySlug(slug: string, excludeId?: string): Promise<boolean> {
  try {
    let queryStr = 'SELECT id FROM pages WHERE slug = $1';
    const params: any[] = [slug];
    
    if (excludeId) {
      queryStr += ' AND id != $2';
      params.push(excludeId);
    }
    
    const result = await query(queryStr, params);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking page existence:', error);
    return false;
  }
}

// Search pages
export async function searchPages(searchTerm: string): Promise<PageData[]> {
  try {
    const result = await query(
      `SELECT * FROM pages 
       WHERE title ILIKE $1 OR content ILIKE $1 OR slug ILIKE $1 
       ORDER BY created_at DESC`,
      [`%${searchTerm}%`]
    );
    
    return result.rows.map(convertToPageData);
  } catch (error) {
    console.error('Error searching pages:', error);
    return [];
  }
} 