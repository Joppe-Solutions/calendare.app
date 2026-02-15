-- Update for Clerk authentication
-- Clerk user IDs are strings like "user_2xyz...", not UUIDs

-- Drop old sessions table (Clerk handles sessions)
DROP TABLE IF EXISTS sessions;

-- Drop old users table and recreate with Clerk-compatible schema
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Clerk user ID (e.g., "user_2xyz...")
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update businesses table to use TEXT for user_id
-- First drop the foreign key constraint
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_user_id_fkey;

-- Change user_id column type from UUID to TEXT
ALTER TABLE businesses 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Add new foreign key constraint
ALTER TABLE businesses 
  ADD CONSTRAINT businesses_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
