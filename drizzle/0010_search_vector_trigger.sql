-- Migration: Add search_vector trigger for foods table
-- This ensures all foods are searchable via full-text search

-- Create the trigger function to update search_vector
CREATE OR REPLACE FUNCTION update_foods_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Combine name, description, and common_names into search vector
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(array_to_string(NEW.common_names, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--> statement-breakpoint

-- Create trigger to auto-update search_vector on INSERT
DROP TRIGGER IF EXISTS foods_search_vector_insert ON foods;
CREATE TRIGGER foods_search_vector_insert
  BEFORE INSERT ON foods
  FOR EACH ROW
  EXECUTE FUNCTION update_foods_search_vector();

--> statement-breakpoint

-- Create trigger to auto-update search_vector on UPDATE
DROP TRIGGER IF EXISTS foods_search_vector_update ON foods;
CREATE TRIGGER foods_search_vector_update
  BEFORE UPDATE ON foods
  FOR EACH ROW
  WHEN (
    OLD.name IS DISTINCT FROM NEW.name OR
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.common_names IS DISTINCT FROM NEW.common_names
  )
  EXECUTE FUNCTION update_foods_search_vector();

--> statement-breakpoint

-- Update existing rows to populate search_vector
UPDATE foods
SET search_vector = to_tsvector('english',
  COALESCE(name, '') || ' ' ||
  COALESCE(description, '') || ' ' ||
  COALESCE(array_to_string(common_names, ' '), '')
)
WHERE search_vector IS NULL;
