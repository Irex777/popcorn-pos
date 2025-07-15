-- Add business_mode column to shops table
ALTER TABLE shops ADD COLUMN IF NOT EXISTS business_mode TEXT NOT NULL DEFAULT 'shop';

-- Add check constraint to ensure only valid business modes
ALTER TABLE shops ADD CONSTRAINT check_business_mode 
  CHECK (business_mode IN ('shop', 'restaurant'));