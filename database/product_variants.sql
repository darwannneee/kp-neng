-- Product Variants and Sizes Migration
-- This migration adds tables for product variants and sizes to support multiple variants per product

-- Add product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  price VARCHAR(255),
  stock INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, name)
);

-- Add sizes table
CREATE TABLE IF NOT EXISTS sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);

-- Insert common size values
INSERT INTO sizes (name) VALUES 
  ('XS'),
  ('S'),
  ('M'),
  ('L'),
  ('XL'),
  ('XXL'),
  ('XXXL');

-- Add variant_sizes join table for many-to-many relationship
CREATE TABLE IF NOT EXISTS variant_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  size_id UUID NOT NULL REFERENCES sizes(id) ON DELETE CASCADE,
  stock INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(variant_id, size_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variant_sizes_variant_id ON variant_sizes(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_sizes_size_id ON variant_sizes(size_id);

-- Note: We'll keep the 'colours' field in the products table for backward compatibility during migration
-- It can be removed later after the application has been fully updated 