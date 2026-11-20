-- Existing PostService.updatePost and native editor use this Boolean column.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;
