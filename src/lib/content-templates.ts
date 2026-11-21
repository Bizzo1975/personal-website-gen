/**
 * W21: content templates (table content_templates). One shape and one validator for
 * the list route, the per-template route and the admin screens.
 */
export const TEMPLATE_TYPES = ['post', 'project', 'page'] as const;
export type TemplateType = (typeof TEMPLATE_TYPES)[number];

export interface ContentTemplateDto {
  id: string;
  name: string;
  type: TemplateType;
  description: string | null;
  content: string;
  variables: string[];
  usageCount: number;
  author: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export const TEMPLATE_COLUMNS =
  'id, name, type, description, content, variables, usage_count, author, created_at, updated_at';

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? String(v) : null);

export function toTemplateDto(row: Record<string, unknown>): ContentTemplateDto {
  return {
    id: String(row.id),
    name: String(row.name),
    type: row.type as TemplateType,
    description: (row.description as string | null) ?? null,
    content: String(row.content ?? ''),
    variables: Array.isArray(row.variables) ? (row.variables as string[]) : [],
    usageCount: Number(row.usage_count ?? 0),
    author: String(row.author ?? ''),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

/** The {{name}} placeholders in a template, in order of first use (section tags {{#x}}/{{/x}} excluded). */
export function templateVariables(content: string): string[] {
  const seen = new Set<string>();
  for (const m of content.matchAll(/\{\{\s*([A-Za-z_][\w.]*)\s*\}\}/g)) seen.add(m[1]);
  return [...seen];
}

export function parseTemplateInput(body: unknown):
  | { ok: true; value: { name: string; type: TemplateType; description: string | null; content: string } }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Body must be a JSON object' };
  const b = body as Record<string, unknown>;
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  const content = typeof b.content === 'string' ? b.content : '';
  if (!name || name.length > 255) return { ok: false, error: 'Name is required (up to 255 characters)' };
  if (!(TEMPLATE_TYPES as readonly string[]).includes(String(b.type))) return { ok: false, error: `Type must be one of ${TEMPLATE_TYPES.join(', ')}` };
  if (!content.trim()) return { ok: false, error: 'Content is required' };
  const description = typeof b.description === 'string' && b.description.trim() ? b.description.trim() : null;
  return { ok: true, value: { name, type: b.type as TemplateType, description, content } };
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
