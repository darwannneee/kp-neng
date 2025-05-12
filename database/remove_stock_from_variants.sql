-- Script untuk menghapus kolom stock dari tabel product_variants dan variant_sizes

-- Hapus stock dari tabel product_variants
DO $$
BEGIN
    -- Cek apakah kolom stock ada di tabel product_variants
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'product_variants' AND column_name = 'stock'
    ) THEN
        -- Hapus kolom stock jika ada
        ALTER TABLE product_variants DROP COLUMN stock;
        RAISE NOTICE 'Kolom stock telah dihapus dari tabel product_variants';
    ELSE
        RAISE NOTICE 'Kolom stock tidak ditemukan di tabel product_variants';
    END IF;
END;
$$;

-- Hapus stock dari tabel variant_sizes
DO $$
BEGIN
    -- Cek apakah kolom stock ada di tabel variant_sizes
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'variant_sizes' AND column_name = 'stock'
    ) THEN
        -- Hapus kolom stock jika ada
        ALTER TABLE variant_sizes DROP COLUMN stock;
        RAISE NOTICE 'Kolom stock telah dihapus dari tabel variant_sizes';
    ELSE
        RAISE NOTICE 'Kolom stock tidak ditemukan di tabel variant_sizes';
    END IF;
END;
$$;
