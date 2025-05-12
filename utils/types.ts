// Common types used across the application

// Product with variants
export interface Product {
  id: string;
  name: string;
  price: string;
  description?: string;
  image_url?: string;
  category_id?: string;
  admin_id?: string;
  colours?: number; // Kept for backward compatibility
  created_at?: string;
  admin?: {
    username: string;
    id: string;
    image_url?: string;
  };
  variants?: ProductVariant[];
  category?: {
    name: string;
  };
  // Shopee-style variants
  variant_types?: VariantType[];
  variant_combinations?: VariantCombination[];
}

// Product variant
export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  image_url?: string;
  price?: string; // If different from base product price
  created_at?: string;
  sizes?: VariantSize[];
}

// Size for a variant - Modified to match database schema
export interface VariantSize {
  id: string;
  variant_id: string;
  size: string; // This is actually the size value in the database
  created_at?: string;
}

// Size entity for the dropdown selection
export interface Size {
  id: string;
  name: string;
  created_at?: string;
}

// --- Shopee-style variant types ---

// Tipe varian (misal: Warna, Ukuran, dll)
export interface VariantType {
  id: string;
  name: string;
  created_at?: string;
  options?: VariantOption[];
}

// Opsi untuk tipe varian (misal: untuk Warna - Merah, Hitam, dll)
export interface VariantOption {
  id: string;
  variant_type_id: string;
  name: string;
  image_url?: string;
  created_at?: string;
}

// Kombinasi varian dengan harga dan stok
export interface VariantCombination {
  id: string;
  product_id: string;
  sku?: string;
  price: string;
  stock: number;
  image_url?: string;
  created_at?: string;
  selected_options: VariantOptionDetail[];
  // For form handling
  key?: string; 
  selectedOptions?: string[];
  image?: File | null;
}

// Detail opsi yang dipilih dalam kombinasi
export interface VariantOptionDetail {
  id: string;
  combination_id: string;
  variant_option_id: string;
  variant_option?: VariantOption;
} 