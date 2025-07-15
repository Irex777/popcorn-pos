-- QUICK PRODUCTION FIX
-- Copy and paste this into your database admin panel

ALTER TABLE shops ADD COLUMN IF NOT EXISTS business_mode TEXT NOT NULL DEFAULT 'shop';
ALTER TABLE shops ADD CONSTRAINT IF NOT EXISTS check_business_mode CHECK (business_mode IN ('shop', 'restaurant'));