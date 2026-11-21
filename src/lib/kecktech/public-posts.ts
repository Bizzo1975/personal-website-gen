/** Which posts are public in the /api/blog feed: published, and not gated. */
export const PUBLIC_POST_WHERE = `(published = true OR status = 'published') AND COALESCE(permission_level, 'all') = 'all'`;
