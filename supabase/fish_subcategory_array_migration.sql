-- ============================================================
-- Migrate subcategory from TEXT → TEXT[] (multi-tag support)
-- A fish product can now belong to multiple subcategories.
-- Run this in Supabase SQL Editor before deploying the new code.
-- ============================================================

-- 1. Add a temporary TEXT[] column
ALTER TABLE products ADD COLUMN subcategory_tags TEXT[] DEFAULT '{}';

-- 2. Copy existing single values into the array column
UPDATE products
SET subcategory_tags = CASE
  WHEN subcategory IS NOT NULL AND subcategory != 'unassigned'
    THEN ARRAY[subcategory]
  ELSE '{}'
END;

-- 3. Drop the old TEXT column
ALTER TABLE products DROP COLUMN subcategory;

-- 4. Rename the new column to subcategory
ALTER TABLE products RENAME COLUMN subcategory_tags TO subcategory;

-- 5. Set a proper default for new rows
ALTER TABLE products ALTER COLUMN subcategory SET DEFAULT '{}';

-- Done — new code expects TEXT[], existing rows have been migrated.
