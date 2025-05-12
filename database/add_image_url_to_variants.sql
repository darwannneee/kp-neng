-- Migration to add image_url column to product_variants table

-- Add image_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_variants' AND column_name = 'image_url') THEN
    ALTER TABLE product_variants ADD COLUMN image_url TEXT;
  END IF;
END
$$;
