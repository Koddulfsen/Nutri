-- Migration: Enhance compound_sources for full source coverage
-- Adds unit tracking and conversion factors for scalable multi-source support

-- Add source unit column (what unit this source ID reports values in)
ALTER TABLE compound_sources ADD COLUMN IF NOT EXISTS source_unit TEXT;

-- Add conversion factor (multiply source value by this to get canonical unit)
ALTER TABLE compound_sources ADD COLUMN IF NOT EXISTS conversion_factor NUMERIC DEFAULT 1.0;

-- Add canonical flag (is this the primary mapping for aggregation?)
ALTER TABLE compound_sources ADD COLUMN IF NOT EXISTS is_canonical BOOLEAN DEFAULT false;

-- Add source name column (the name this source uses for this nutrient)
ALTER TABLE compound_sources ADD COLUMN IF NOT EXISTS source_name TEXT;

-- Comment on columns for documentation
COMMENT ON COLUMN compound_sources.source_unit IS 'The unit this source reports values in (e.g., IU, kJ, mcg)';
COMMENT ON COLUMN compound_sources.conversion_factor IS 'Multiply source value by this factor to convert to compound canonical unit';
COMMENT ON COLUMN compound_sources.is_canonical IS 'If true, this is the primary mapping used for aggregation (avoid double-counting variants)';
COMMENT ON COLUMN compound_sources.source_name IS 'The name this source uses for this nutrient';
