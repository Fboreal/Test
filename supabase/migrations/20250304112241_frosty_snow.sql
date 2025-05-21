/*
  # Fix description column

  1. Changes
    - Ensures the description column exists on the articles table
    - This migration replaces the duplicate 20250303214007_raspy_haze.sql migration
*/

-- Check if description column exists before adding it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'articles' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE articles ADD COLUMN description text;
  END IF;
END $$;