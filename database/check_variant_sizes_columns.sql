-- Script untuk memeriksa struktur tabel variant_sizes dan menambahkan kolom yang diperlukan

-- Tampilkan struktur tabel saat ini
DO $$
DECLARE
    col_name RECORD;
BEGIN
    RAISE NOTICE 'Struktur tabel variant_sizes saat ini:';
    FOR col_name IN
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'variant_sizes'
    LOOP
        RAISE NOTICE '  Kolom: %, Tipe: %', col_name.column_name, col_name.data_type;
    END LOOP;
END;
$$;

-- Tambahkan kolom size_id jika tidak ada
DO $$
BEGIN
    -- Cek apakah kolom size_id ada di tabel variant_sizes
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'variant_sizes' AND column_name = 'size_id'
    ) THEN
        -- Cek apakah kolom size ada
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'variant_sizes' AND column_name = 'size'
        ) THEN
            -- Jika ada kolom size, rename saja
            RAISE NOTICE 'Mengubah nama kolom size menjadi size_id';
            ALTER TABLE variant_sizes RENAME COLUMN size TO size_id;
        ELSE
            -- Jika tidak ada keduanya, buat kolom size_id
            RAISE NOTICE 'Menambahkan kolom size_id ke tabel variant_sizes';
            ALTER TABLE variant_sizes ADD COLUMN size_id UUID;
        END IF;
    ELSE
        RAISE NOTICE 'Kolom size_id sudah ada di tabel variant_sizes';
    END IF;
END;
$$;
