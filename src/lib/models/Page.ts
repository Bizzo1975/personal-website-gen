// PostgreSQL Page interface matching the pages table schema
export interface Page {
  id: string;
  name: string;
  title: string;
  slug: string;
  content: string;
  meta_description?: string;
  header_title?: string;
  header_subtitle?: string;
  hero_heading?: string;
  created_at: Date;
  updated_at: Date;
}

// Type for creating a new page (without auto-generated fields)
export interface CreatePageData {
  name: string;
  title: string;
  slug: string;
  content: string;
  meta_description?: string;
  header_title?: string;
  header_subtitle?: string;
  hero_heading?: string;
}

// Type for updating a page
export interface UpdatePageData {
  name?: string;
  title?: string;
  slug?: string;
  content?: string;
  meta_description?: string;
  header_title?: string;
  header_subtitle?: string;
  hero_heading?: string;
}
