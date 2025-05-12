-- Script untuk menghapus kolom price dari tabel product_variants jika ada

DO $$
BEGIN
    -- Cek apakah kolom price ada di tabel product_variants
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'product_variants' AND column_name = 'price'
    ) THEN
        -- Hapus kolom price jika ada
        ALTER TABLE product_variants DROP COLUMN price;
        RAISE NOTICE 'Kolom price telah dihapus dari tabel product_variants';
    ELSE
        RAISE NOTICE 'Kolom price tidak ditemukan di tabel product_variants';
    END IF;
END;
$$;
