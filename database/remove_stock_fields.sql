-- Migration to remove stock fields from database

-- 1. Remove stock column from product_variants if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'stock') THEN
    ALTER TABLE product_variants DROP COLUMN stock;
  END IF;
END
$$;

-- 2. Remove stock column from variant_sizes if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'variant_sizes' AND column_name = 'stock') THEN
    ALTER TABLE variant_sizes DROP COLUMN stock;
  END IF;
END
$$;

-- 3. Update product_variants table to ensure it has necessary columns
DO $$
BEGIN
  -- Make sure image_url exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'image_url') THEN
    ALTER TABLE product_variants ADD COLUMN image_url TEXT;
  END IF;
  
  -- Remove price if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'price') THEN
    ALTER TABLE product_variants DROP COLUMN price;
  END IF;
END
$$;

-- 4. Fix relationship between variant_sizes and sizes tables
DO $$
BEGIN
  -- Check if foreign key exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'variant_sizes' 
    AND ccu.table_name = 'sizes' 
    AND ccu.column_name = 'id'
  ) THEN
    -- Add foreign key constraint if it doesn't exist
    BEGIN
      ALTER TABLE variant_sizes
      ADD CONSTRAINT variant_sizes_size_id_fkey
      FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      -- Constraint might exist with different name or there might be data issues
      RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
    END;
  END IF;
END
$$;
