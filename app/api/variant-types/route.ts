import { NextRequest } from 'next/server';
import supabase from '@/utils/supabase/client';

// Type definition untuk membantu TypeScript
interface Product {
  id: string;
  name: string;
  image_url?: string;
}

interface VariantType {
  id: string;
  name: string;
  product_count: number;
  products?: Product[];
  created_by_id?: string;
  created_at?: string;
  created_by?: {
    id: string;
    username: string;
    image_url?: string;
  };
}

interface VariantWithProduct {
  id: string;
  name: string;
  product_id: string;
  created_by_id?: string;
  created_at?: string;
  products: {
    id: string;
    name: string;
    image_url?: string;
  };
}

// Get all unique variant types from product_variants table
export async function GET() {
  try {
    // Dapatkan semua variant dari product_variants
    const { data: variants, error } = await supabase
      .from('product_variants')
      .select(`
        id,
        name,
        product_id,
        created_by_id,
        created_at,
        products(id, name, image_url)
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching variants:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!variants || variants.length === 0) {
      return Response.json([]);
    }

    // Kelompokkan berdasarkan nama varian untuk mendapatkan tipe varian yang unik
    const variantTypeMap: Record<string, VariantType> = {};
    
    (variants as unknown as VariantWithProduct[]).forEach(variant => {
      if (!variantTypeMap[variant.name]) {
        variantTypeMap[variant.name] = {
          id: variant.id,
          name: variant.name,
          product_count: 0,
          products: [],
          created_by_id: variant.created_by_id,
          created_at: variant.created_at
        };
      }
      
      // Tambahkan produk ke daftar produk jika belum ada
      const productExists = variantTypeMap[variant.name].products?.some(p => p.id === variant.products.id);
      if (variant.products && !productExists) {
        if (!variantTypeMap[variant.name].products) {
          variantTypeMap[variant.name].products = [];
        }
        variantTypeMap[variant.name].products.push({
          id: variant.products.id,
          name: variant.products.name,
          image_url: variant.products.image_url
        });
        variantTypeMap[variant.name].product_count++;
      }
    });

    // Konversi map ke array
    const variantTypes = Object.values(variantTypeMap);

    // Dapatkan semua admin IDs unik
    const adminIds = [...new Set(variantTypes
      .filter(type => type.created_by_id)
      .map(type => type.created_by_id))];

    // Ambil informasi admin jika ada admin IDs
    if (adminIds.length > 0) {
      const { data: admins, error: adminError } = await supabase
        .from('admins')
        .select('id, username, image_url')
        .in('id', adminIds);

      if (admins && !adminError) {
        // Buat map untuk akses cepat
        const adminMap = admins.reduce((map, admin) => {
          map[admin.id] = admin;
          return map;
        }, {});

        // Tambahkan info admin ke setiap tipe variant
        variantTypes.forEach(type => {
          if (type.created_by_id && adminMap[type.created_by_id]) {
            type.created_by = adminMap[type.created_by_id];
          }
        });
      }
    }

    return Response.json(variantTypes);
  } catch (err) {
    console.error('Unexpected error fetching variant types:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

// Create a new variant type
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name) {
      return Response.json({ error: 'Nama tipe variant diperlukan' }, { status: 400 });
    }
    
    const admin_id = request.headers.get('x-admin-id');
    
    if (!admin_id) {
      return Response.json({ error: 'Admin ID diperlukan' }, { status: 401 });
    }
    
    // Cek apakah ada produk dengan variant yang sama
    const { data: existingVariants, error: existingError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('name', name.trim())
      .limit(1);
      
    if (existingError) {
      return Response.json({ error: existingError.message }, { status: 500 });
    }
    
    if (existingVariants && existingVariants.length > 0) {
      return Response.json({ error: 'Tipe variant dengan nama tersebut sudah ada' }, { status: 409 });
    }
    
    // Dapatkan info admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('id, username, image_url')
      .eq('id', admin_id)
      .single();
      
    if (adminError) {
      return Response.json({ error: 'Gagal mendapatkan info admin' }, { status: 500 });
    }

    // Insert new variant type
    const { data: newVariant, error: insertError } = await supabase
      .from('product_variants')
      .insert([
        {
          name: name.trim(),
          created_by_id: admin_id,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
      
    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }
    
    // Kembalikan response sukses dengan info tipe variant 
    const variantType: VariantType = {
      id: newVariant.id,
      name: newVariant.name,
      product_count: 0,
      products: [],
      created_by_id: admin_id,
      created_at: newVariant.created_at,
      created_by: adminData
    };
    
    return Response.json(variantType);
  } catch (err) {
    console.error('Unexpected error creating variant type:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

// Update variant type
export async function PUT(request: NextRequest) {
  try {
    const { id, name } = await request.json();
    
    if (!name || !id) {
      return Response.json({ error: 'ID dan nama tipe variant diperlukan' }, { status: 400 });
    }
    
    const admin_id = request.headers.get('x-admin-id');
    
    if (!admin_id) {
      return Response.json({ error: 'Admin ID diperlukan' }, { status: 401 });
    }

    // Update only the specific variant
    const { data: updatedVariant, error: updateError } = await supabase
      .from('product_variants')
      .update({ 
        name: name.trim()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    // Get admin info
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('id, username, image_url')
      .eq('id', admin_id)
      .single();
      
    if (adminError) {
      return Response.json({ error: 'Gagal mendapatkan info admin' }, { status: 500 });
    }
    
    return Response.json({ 
      id: updatedVariant.id,
      name: updatedVariant.name,
      created_by_id: updatedVariant.created_by_id,
      created_at: updatedVariant.created_at,
      created_by: adminData,
      message: 'Tipe variant diperbarui'
    });
  } catch (err) {
    console.error('Unexpected error updating variant type:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

// Delete variant type
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return Response.json({ error: 'ID diperlukan' }, { status: 400 });
    }
    
    const admin_id = request.headers.get('x-admin-id');
    
    if (!admin_id) {
      return Response.json({ error: 'Admin ID diperlukan' }, { status: 401 });
    }

    // Delete variant type
    const { error: deleteError } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', id);
      
    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 500 });
    }
    
    return Response.json({ 
      id,
      message: 'Tipe variant berhasil dihapus'
    });
  } catch (err) {
    console.error('Unexpected error deleting variant type:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}