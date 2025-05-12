-- Product Variants Shopee Style
-- Mendukung multi-dimensi varian (warna, ukuran, dll) dengan harga berbeda per kombinasi

-- Tabel untuk tipe varian (contoh: Warna, Ukuran, Material, dll)
CREATE TABLE IF NOT EXISTS variant_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);

-- Insert tipe varian umum
INSERT INTO variant_types (name) VALUES 
  ('Warna'),
  ('Ukuran'),
  ('Material'),
  ('Jenis');

-- Tabel untuk opsi varian (contoh: untuk tipe Warna - Merah, Hitam, dll)
CREATE TABLE IF NOT EXISTS variant_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_type_id UUID NOT NULL REFERENCES variant_types(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(variant_type_id, name)
);

-- Insert opsi varian umum untuk Ukuran
DO $$
DECLARE
  size_variant_id UUID;
BEGIN
  SELECT id INTO size_variant_id FROM variant_types WHERE name = 'Ukuran' LIMIT 1;
  
  INSERT INTO variant_options (variant_type_id, name) VALUES 
    (size_variant_id, 'XS'),
    (size_variant_id, 'S'),
    (size_variant_id, 'M'),
    (size_variant_id, 'L'),
    (size_variant_id, 'XL'),
    (size_variant_id, 'XXL'),
    (size_variant_id, 'XXXL')
  ON CONFLICT (variant_type_id, name) DO NOTHING;
END $$;

-- Insert opsi varian umum untuk Warna
DO $$
DECLARE
  color_variant_id UUID;
BEGIN
  SELECT id INTO color_variant_id FROM variant_types WHERE name = 'Warna' LIMIT 1;
  
  INSERT INTO variant_options (variant_type_id, name) VALUES 
    (color_variant_id, 'Hitam'),
    (color_variant_id, 'Putih'),
    (color_variant_id, 'Merah'),
    (color_variant_id, 'Biru'),
    (color_variant_id, 'Hijau'),
    (color_variant_id, 'Kuning'),
    (color_variant_id, 'Abu-abu'),
    (color_variant_id, 'Coklat'),
    (color_variant_id, 'Pink')
  ON CONFLICT (variant_type_id, name) DO NOTHING;
END $$;

-- Tabel yang menghubungkan produk dengan tipe varian yang tersedia
CREATE TABLE IF NOT EXISTS product_variant_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_type_id UUID NOT NULL REFERENCES variant_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, variant_type_id)
);

-- Tabel untuk kombinasi varian dengan harga dan stok
CREATE TABLE IF NOT EXISTS product_variant_combinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100),
  price VARCHAR(255),
  stock INT DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, sku)
);

-- Tabel untuk detail opsi dalam kombinasi varian
CREATE TABLE IF NOT EXISTS product_variant_combination_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  combination_id UUID NOT NULL REFERENCES product_variant_combinations(id) ON DELETE CASCADE,
  variant_option_id UUID NOT NULL REFERENCES variant_options(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(combination_id, variant_option_id)
);

-- Indeks untuk performa
CREATE INDEX IF NOT EXISTS idx_product_variant_types_product_id ON product_variant_types(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_types_variant_type_id ON product_variant_types(variant_type_id);
CREATE INDEX IF NOT EXISTS idx_variant_options_variant_type_id ON variant_options(variant_type_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_combinations_product_id ON product_variant_combinations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_combination_options_combination_id ON product_variant_combination_options(combination_id);
CREATE INDEX IF NOT EXISTS idx_product_variant_combination_options_variant_option_id ON product_variant_combination_options(variant_option_id); 