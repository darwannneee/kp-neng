-- Script to check and fix variant_sizes table structure

-- Check current structure of variant_sizes table
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if size_id column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'variant_sizes' AND column_name = 'size_id'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'size_id column already exists';
    ELSE
        -- Check if size column exists
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'variant_sizes' AND column_name = 'size'
        ) INTO column_exists;
        
        IF column_exists THEN
            -- Rename size to size_id for consistency
            RAISE NOTICE 'Renaming column "size" to "size_id"';
            ALTER TABLE variant_sizes RENAME COLUMN "size" TO "size_id";
        ELSE
            -- Neither column exists, add size_id
            RAISE NOTICE 'Adding size_id column';
            ALTER TABLE variant_sizes ADD COLUMN size_id UUID REFERENCES sizes(id);
        END IF;
    END IF;
END;
$$;
