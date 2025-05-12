-- Script untuk menghapus kolom price dari tabel product_variants

DO $$
BEGIN
    -- Cek apakah kolom price masih ada di tabel product_variants
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'product_variants' AND column_name = 'price'
    ) THEN
        ALTER TABLE product_variants DROP COLUMN price;
        RAISE NOTICE 'Kolom price berhasil dihapus dari tabel product_variants';
    ELSE
        RAISE NOTICE 'Kolom price tidak ditemukan di tabel product_variants';
    END IF;
END;
$$;
