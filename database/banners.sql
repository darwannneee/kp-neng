-- Membuat tabel banners
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    button_text TEXT,
    button_link TEXT,
    image_url TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'hero',  -- hero, promo, category, section
    position INTEGER NOT NULL DEFAULT 1,
    admin_id UUID REFERENCES admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menambahkan indeks
CREATE INDEX idx_banners_type ON banners(type);
CREATE INDEX idx_banners_position ON banners(position);

-- Contoh data awal (Uncomment jika ingin menggunakan)
/*
INSERT INTO banners (title, subtitle, button_text, button_link, image_url, type, position, admin_id) 
VALUES 
('Elegance yang Sempurna', 'Koleksi terbaru untuk mempercantik gaya Anda', 'Belanja Sekarang', '/products', 'https://www.stories.com/static-images/sb/2143x3000/217cffba4d/im_25_17_020_5x7.jpg?imwidth=1920', 'hero', 1, NULL),
('Koleksi Musim Panas', 'Temukan gaya fashion terbaik untuk musim panas', 'Lihat Koleksi', '/products?season=summer', 'https://www.stories.com/static-images/sb/2142x3000/7552da1ad7/im_25_17_019_5x7.jpg?imwidth=1920', 'promo', 1, NULL),
('Aksesoris Terbaru', 'Lengkapi penampilanmu dengan aksesoris premium', 'Jelajahi', '/products?category=accessories', 'https://www.stories.com/static-images/sb/2143x3000/217cffba4d/im_25_17_020_5x7.jpg?imwidth=1920', 'promo', 2, NULL);
*/ 