import { NextRequest } from "next/server";
import supabase from "@/utils/supabase/client";

// Mendapatkan informasi varian dan kombinasi untuk produk tertentu
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Await the params to properly access its properties
  const { id } = await context.params;
  
  // First, get the product variants
  const { data: variantData, error: variantError } = await supabase
    .from("product_variants")
    .select('*')
    .eq("product_id", id);
    
  if (variantError) {
    return Response.json({ error: variantError.message }, { status: 500 });
  }
  
  // If we have variants, get the sizes for each variant
  if (variantData && variantData.length > 0) {
    const variantIds = variantData.map(v => v.id);
    
    // Get all variant sizes
    const { data: sizeData, error: sizeError } = await supabase
      .from("variant_sizes")
      .select('id, variant_id, size_id')
      .in("variant_id", variantIds);
      
    if (sizeError) {
      console.error('Error fetching variant sizes:', sizeError);
      // Continue without sizes
    } else {
      // Get all size IDs to fetch size names
      const sizeIds = [...new Set(sizeData.map(s => s.size_id))];
      
      // Get size names
      const { data: sizeNames, error: namesError } = await supabase
        .from("sizes")
        .select('id, name')
        .in("id", sizeIds);
        
      if (!namesError && sizeNames) {
        // Create map for quick lookup
        const sizeMap: Record<string, string> = {};
        sizeNames.forEach(s => sizeMap[s.id] = s.name);
        
        // Group sizes by variant
        const variantSizesMap: Record<string, any[]> = {};
        sizeData.forEach(s => {
          if (!variantSizesMap[s.variant_id]) {
            variantSizesMap[s.variant_id] = [];
          }
          variantSizesMap[s.variant_id].push({
            ...s,
            size: sizeMap[s.size_id] ? { id: s.size_id, name: sizeMap[s.size_id] } : null
          });
        });
        
        // Add sizes to variants
        variantData.forEach(variant => {
          variant.sizes = variantSizesMap[variant.id] || [];
        });
      }
    }
  }
  
  const data = variantData;
  
  // Error handling already done above for variantError
  
  return Response.json(data);
}

// Menetapkan tipe varian untuk produk
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to properly access its properties
    const { id } = await context.params;
    console.log('Setting variant types for product ID:', id);
    
    const { variant_type_ids } = await request.json();
    
    if (!Array.isArray(variant_type_ids) || variant_type_ids.length === 0) {
      return Response.json({ 
        error: "Daftar ID tipe varian diperlukan" 
      }, { status: 400 });
    }
    
    // Hapus tipe varian yang ada
    const { error: deleteError } = await supabase
      .from("product_variant_types")
      .delete()
      .eq("product_id", id);
    
    if (deleteError) {
      console.error('Error deleting existing variant types:', deleteError);
      return Response.json({ error: deleteError.message }, { status: 500 });
    }
    
    // Tambahkan tipe varian baru
    const variantTypesToInsert = variant_type_ids.map(typeId => ({
      product_id: id,
      variant_type_id: typeId
    }));
    
    const { data, error } = await supabase
      .from("product_variant_types")
      .insert(variantTypesToInsert)
      .select();
    
    if (error) {
      console.error('Error inserting new variant types:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Variant types set successfully');
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error in POST handler:', error);
    return Response.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 