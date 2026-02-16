-- Add logo and cover image to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#10B981';
