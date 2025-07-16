-- PRODUCTION HOTFIX: Add business_mode column to shops table
-- This migration adds the missing business_mode column that is causing 500 errors

-- Check if column exists first (safe for re-running)
DO $$ 
BEGIN
    -- Add business_mode column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shops' AND column_name = 'business_mode'
    ) THEN
        ALTER TABLE shops ADD COLUMN business_mode TEXT NOT NULL DEFAULT 'shop';
        RAISE NOTICE 'Added business_mode column to shops table';
    ELSE
        RAISE NOTICE 'business_mode column already exists';
    END IF;
    
    -- Add constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'shops' AND constraint_name = 'check_business_mode'
    ) THEN
        ALTER TABLE shops ADD CONSTRAINT check_business_mode 
            CHECK (business_mode IN ('shop', 'restaurant'));
        RAISE NOTICE 'Added check_business_mode constraint';
    ELSE
        RAISE NOTICE 'check_business_mode constraint already exists';
    END IF;
    
    -- Update any existing shops to have default business_mode
    UPDATE shops SET business_mode = 'shop' WHERE business_mode IS NULL;
    
    RAISE NOTICE 'Migration completed successfully';
END $$;