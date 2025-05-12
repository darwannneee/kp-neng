# Implementasi Varian Produk Gaya Shopee

Dokumentasi ini menjelaskan bagaimana mengimplementasikan dan menggunakan sistem varian produk mirip Shopee di aplikasi Ecoute.

## Struktur Database

Sistem varian produk yang baru menggunakan pendekatan yang lebih fleksibel dengan struktur sebagai berikut:

### 1. Tipe Varian (`variant_types`)

Tabel ini menyimpan kategori varian seperti Warna, Ukuran, Material, dll.

```sql
CREATE TABLE IF NOT EXISTS variant_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);
```

### 2. Opsi Varian (`variant_options`)

Tabel ini menyimpan nilai-nilai spesifik untuk setiap tipe varian (contoh: untuk tipe "Warna" ada opsi "Merah", "Hitam", dll.)

```sql
CREATE TABLE IF NOT EXISTS variant_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_type_id UUID NOT NULL REFERENCES variant_types(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(variant_type_id, name)
);
```

### 3. Tipe Varian Produk (`product_variant_types`)

Tabel join yang menentukan tipe varian apa saja yang tersedia untuk sebuah produk.

```sql
CREATE TABLE IF NOT EXISTS product_variant_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_type_id UUID NOT NULL REFERENCES variant_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, variant_type_id)
);
```

### 4. Kombinasi Varian Produk (`product_variant_combinations`)

Tabel ini menyimpan kombinasi varian yang tersedia dengan harga dan stok masing-masing.

```sql
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
```

### 5. Opsi Kombinasi Varian (`product_variant_combination_options`)

Tabel ini menghubungkan setiap kombinasi varian dengan opsi-opsi varian yang dipilih.

```sql
CREATE TABLE IF NOT EXISTS product_variant_combination_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  combination_id UUID NOT NULL REFERENCES product_variant_combinations(id) ON DELETE CASCADE,
  variant_option_id UUID NOT NULL REFERENCES variant_options(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(combination_id, variant_option_id)
);
```

## API Endpoint

### Tipe Varian

- `GET /api/variant-types` - Mendapatkan semua tipe varian
- `POST /api/variant-types` - Menambahkan tipe varian baru
- `DELETE /api/variant-types?id=<id>` - Menghapus tipe varian

### Opsi Varian

- `GET /api/variant-options?type_id=<id>` - Mendapatkan opsi varian untuk tipe varian tertentu
- `POST /api/variant-options` - Menambahkan opsi varian baru
- `PUT /api/variant-options` - Memperbarui opsi varian
- `DELETE /api/variant-options?id=<id>` - Menghapus opsi varian

### Varian Produk

- `GET /api/products/<id>/variants` - Mendapatkan informasi varian untuk produk tertentu
- `POST /api/products/<id>/variants` - Menetapkan tipe varian untuk produk

### Kombinasi Varian Produk

- `GET /api/products/<id>/variant-combinations` - Mendapatkan kombinasi varian untuk produk 
- `POST /api/products/<id>/variant-combinations` - Menambahkan kombinasi varian baru
- `PUT /api/products/<id>/variant-combinations` - Memperbarui kombinasi varian
- `DELETE /api/products/<id>/variant-combinations?combination_id=<id>` - Menghapus kombinasi varian

## Cara Menggunakan

### 1. Menambahkan Tipe Varian

Pertama, buat tipe varian yang akan digunakan (misal: "Warna", "Ukuran", dll.):

```javascript
const response = await fetch('/api/variant-types', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Warna' })
});
```

### 2. Menambahkan Opsi Varian

Tambahkan opsi-opsi untuk setiap tipe varian:

```javascript
const formData = new FormData();
formData.append('name', 'Merah');
formData.append('variant_type_id', 'id-tipe-warna');
formData.append('image', fileInput.files[0]); // Opsional

await fetch('/api/variant-options', {
  method: 'POST',
  body: formData
});
```

### 3. Menetapkan Tipe Varian untuk Produk

Pilih tipe varian apa saja yang tersedia untuk produk:

```javascript
await fetch(`/api/products/${productId}/variants`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    variant_type_ids: ['id-tipe-warna', 'id-tipe-ukuran']
  })
});
```

### 4. Membuat Kombinasi Varian Produk

Tambahkan kombinasi varian yang tersedia dengan harga dan stoknya:

```javascript
const formData = new FormData();
formData.append('price', '299000');
formData.append('stock', '10');
formData.append('sku', 'SKU-MERAH-XL');
formData.append('selected_options', JSON.stringify(['id-opsi-merah', 'id-opsi-xl']));
formData.append('image', fileInput.files[0]); // Opsional

await fetch(`/api/products/${productId}/variant-combinations`, {
  method: 'POST',
  body: formData
});
```

## Contoh Penggunaan di Frontend

### Menampilkan Opsi Varian di Halaman Produk

```jsx
function ProductDetailPage({ productId }) {
  const [product, setProduct] = useState(null);
  
  useEffect(() => {
    async function fetchProductDetails() {
      const response = await fetch(`/api/products/${productId}`);
      const data = await response.json();
      setProduct(data);
    }
    
    fetchProductDetails();
  }, [productId]);
  
  // Menampilkan opsi varian (Warna, Ukuran, dll)
  if (product) {
    return (
      <div>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        
        {product.variant_types?.map(type => (
          <div key={type.id}>
            <h3>{type.name}</h3>
            <div className="variant-options">
              {type.options?.map(option => (
                <button key={option.id} className="variant-option">
                  {option.image_url ? (
                    <img src={option.image_url} alt={option.name} width="30" height="30" />
                  ) : null}
                  <span>{option.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        
        {/* Harga dan stok akan diperbarui berdasarkan kombinasi yang dipilih */}
        <div className="price">Rp {product.price}</div>
        
        {/* Tombol tambah ke keranjang */}
        <button className="add-to-cart">Tambah ke Keranjang</button>
      </div>
    );
  }
  
  return <p>Loading...</p>;
}
```

## Migrasi dari Sistem Varian Lama

Untuk memigrasikan data dari sistem varian lama (colours) ke sistem varian baru, Anda dapat menggunakan SQL berikut:

```sql
-- Jalankan script ini untuk mengonversi data varian lama ke format baru
DO $$
DECLARE
  product_record RECORD;
  colour_variant_id UUID;
  variant_id UUID;
  option_id UUID;
  variant_count INT;
  i INT;
  variant_name TEXT;
BEGIN
  -- Dapatkan ID untuk tipe varian warna
  SELECT id INTO colour_variant_id FROM variant_types WHERE name = 'Warna' LIMIT 1;
  
  -- Ambil produk dengan colours > 0
  FOR product_record IN 
    SELECT id, name, colours, price 
    FROM products 
    WHERE colours > 0
  LOOP
    -- Tambahkan tipe varian warna ke produk
    INSERT INTO product_variant_types (product_id, variant_type_id)
    VALUES (product_record.id, colour_variant_id)
    ON CONFLICT DO NOTHING;
    
    variant_count := product_record.colours;
    
    -- Buat varian berdasarkan jumlah colours
    FOR i IN 1..variant_count LOOP
      -- Nama varian warna berdasarkan indeks
      CASE i
        WHEN 1 THEN variant_name := 'Hitam';
        WHEN 2 THEN variant_name := 'Putih';
        WHEN 3 THEN variant_name := 'Biru';
        WHEN 4 THEN variant_name := 'Merah';
        WHEN 5 THEN variant_name := 'Hijau';
        ELSE variant_name := 'Warna ' || i;
      END CASE;
      
      -- Dapatkan atau buat opsi warna
      SELECT id INTO option_id FROM variant_options 
      WHERE variant_type_id = colour_variant_id AND name = variant_name
      LIMIT 1;
      
      IF option_id IS NULL THEN
        -- Buat opsi warna jika belum ada
        INSERT INTO variant_options (variant_type_id, name)
        VALUES (colour_variant_id, variant_name)
        RETURNING id INTO option_id;
      END IF;
      
      -- Buat kombinasi varian
      INSERT INTO product_variant_combinations (product_id, price, stock)
      VALUES (product_record.id, product_record.price, 10)
      RETURNING id INTO variant_id;
      
      -- Tambahkan opsi warna ke kombinasi
      INSERT INTO product_variant_combination_options (combination_id, variant_option_id)
      VALUES (variant_id, option_id);
    END LOOP;
  END LOOP;
END $$;
```

## Catatan Penting

1. Sistem ini memungkinkan kombinasi beberapa tipe varian (Warna x Ukuran x Material, dll).
2. Setiap kombinasi memiliki harga, stok, dan gambar sendiri.
3. SKU bersifat opsional, tetapi berguna untuk pelacakan inventaris.
4. Kompatibilitas dengan sistem varian lama tetap dipertahankan untuk transisi yang mulus. 