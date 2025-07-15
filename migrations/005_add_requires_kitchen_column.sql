-- Add requires_kitchen column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_kitchen BOOLEAN NOT NULL DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_requires_kitchen ON products(requires_kitchen);

-- Update existing products based on common patterns
-- You may want to customize this based on your specific product categories
UPDATE products SET requires_kitchen = true 
WHERE LOWER(name) LIKE '%pizza%' 
   OR LOWER(name) LIKE '%burger%' 
   OR LOWER(name) LIKE '%sandwich%' 
   OR LOWER(name) LIKE '%salad%' 
   OR LOWER(name) LIKE '%pasta%' 
   OR LOWER(name) LIKE '%steak%' 
   OR LOWER(name) LIKE '%chicken%' 
   OR LOWER(name) LIKE '%fish%' 
   OR LOWER(name) LIKE '%soup%' 
   OR LOWER(name) LIKE '%hot%'
   OR LOWER(name) LIKE '%cooked%'
   OR LOWER(name) LIKE '%grilled%'
   OR LOWER(name) LIKE '%fried%'
   OR LOWER(name) LIKE '%baked%';

-- Keep drinks and simple items as not requiring kitchen
UPDATE products SET requires_kitchen = false 
WHERE LOWER(name) LIKE '%drink%' 
   OR LOWER(name) LIKE '%soda%' 
   OR LOWER(name) LIKE '%water%' 
   OR LOWER(name) LIKE '%juice%' 
   OR LOWER(name) LIKE '%coffee%' 
   OR LOWER(name) LIKE '%tea%' 
   OR LOWER(name) LIKE '%beer%' 
   OR LOWER(name) LIKE '%wine%' 
   OR LOWER(name) LIKE '%chips%' 
   OR LOWER(name) LIKE '%candy%' 
   OR LOWER(name) LIKE '%snack%';

-- Add payment tracking fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;