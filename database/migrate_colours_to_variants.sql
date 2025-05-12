-- Migration script to convert existing colours field to variants
-- This script will create variants based on the colours count for existing products

-- First, ensure we have the required tables
\i product_variants.sql

-- For each product, create variants based on its colours count
DO $$
DECLARE
    product_record RECORD;
    variant_id UUID;
    size_id UUID;
    variant_count INT;
    i INT;
    variant_name TEXT;
    xs_size_id UUID;
    s_size_id UUID;
    m_size_id UUID;
    l_size_id UUID;
    xl_size_id UUID;
BEGIN
    -- Get size IDs for reference
    SELECT id INTO xs_size_id FROM sizes WHERE name = 'XS' LIMIT 1;
    SELECT id INTO s_size_id FROM sizes WHERE name = 'S' LIMIT 1;
    SELECT id INTO m_size_id FROM sizes WHERE name = 'M' LIMIT 1;
    SELECT id INTO l_size_id FROM sizes WHERE name = 'L' LIMIT 1;
    SELECT id INTO xl_size_id FROM sizes WHERE name = 'XL' LIMIT 1;
    
    -- Process each product
    FOR product_record IN 
        SELECT id, name, colours, price 
        FROM products 
        WHERE colours > 0
    LOOP
        variant_count := product_record.colours;
        
        -- Create variants based on colours count
        FOR i IN 1..variant_count LOOP
            -- Create a variant name (e.g., "Black", "White", "Blue", etc.)
            CASE i
                WHEN 1 THEN variant_name := 'Black';
                WHEN 2 THEN variant_name := 'White';
                WHEN 3 THEN variant_name := 'Blue';
                WHEN 4 THEN variant_name := 'Red';
                WHEN 5 THEN variant_name := 'Green';
                ELSE variant_name := product_record.name || ' Variant ' || i;
            END CASE;
            
            -- Insert the variant
            INSERT INTO product_variants (product_id, name, price, stock)
            VALUES (product_record.id, variant_name, product_record.price, 10)
            RETURNING id INTO variant_id;
            
            -- Add common sizes with default stock
            INSERT INTO variant_sizes (variant_id, size_id, stock)
            VALUES 
                (variant_id, s_size_id, 5),
                (variant_id, m_size_id, 10),
                (variant_id, l_size_id, 8);
        END LOOP;
    END LOOP;
END $$; 