import { NextRequest } from "next/server";
import supabase from "@/utils/supabase/client";

// Mendapatkan semua kombinasi varian untuk produk tertentu
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to properly access its properties
    const { id } = await context.params;
    
    const { data, error } = await supabase
      .from("product_variant_combinations")
      .select(`
        *,
        selected_options:product_variant_combination_options(
          id,
          variant_option:variant_options(
            id,
            name,
            image_url,
            variant_type:variant_types(id, name)
          )
        )
      `)
      .eq("product_id", id);
    
    if (error) {
      console.error('Error fetching variant combinations:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    return Response.json(data);
  } catch (error) {
    console.error('Unexpected error in GET handler:', error);
    return Response.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Menambahkan kombinasi varian baru ke produk
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to properly access its properties
    const { id } = await context.params;
    
    const formData = await request.formData();
    
    const price = formData.get("price") as string;
    const stock = parseInt(formData.get("stock") as string) || 0;
    const sku = formData.get("sku") as string;
    const selectedOptionsJSON = formData.get("selected_options") as string;
    const image = formData.get("image") as File | null;
    
    if (!price || !selectedOptionsJSON) {
      return Response.json({ 
        error: "Harga dan opsi varian yang dipilih diperlukan" 
      }, { status: 400 });
    }
    
    let selectedOptions;
    try {
      selectedOptions = JSON.parse(selectedOptionsJSON);
      if (!Array.isArray(selectedOptions) || selectedOptions.length === 0) {
        throw new Error("Format opsi varian tidak valid");
      }
    } catch (error) {
      return Response.json({ 
        error: "Format opsi varian tidak valid" 
      }, { status: 400 });
    }
    
    // Upload gambar jika ada
    let imageUrl = null;
    if (image) {
      const fileName = `${Date.now()}-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("ecoute")
        .upload(`variant-combinations/${fileName}`, image, { contentType: image.type });

      if (uploadError) {
        console.error('Error uploading variant image:', uploadError);
        return Response.json({ error: uploadError.message }, { status: 500 });
      }

      imageUrl = supabase.storage
        .from("ecoute")
        .getPublicUrl(`variant-combinations/${fileName}`).data.publicUrl;
    }
    
    // Buat kombinasi varian baru
    const { data: combination, error: combinationError } = await supabase
      .from("product_variant_combinations")
      .insert({
        product_id: id,
        price,
        stock,
        sku,
        image_url: imageUrl
      })
      .select()
      .single();
    
    if (combinationError) {
      console.error('Error creating variant combination:', combinationError);
      return Response.json({ error: combinationError.message }, { status: 500 });
    }
    
    // Tambahkan opsi varian yang dipilih
    const optionsToInsert = selectedOptions.map(optionId => ({
      combination_id: combination.id,
      variant_option_id: optionId
    }));
    
    const { error: optionsError } = await supabase
      .from("product_variant_combination_options")
      .insert(optionsToInsert);
    
    if (optionsError) {
      console.error('Error adding variant options:', optionsError);
      // Jika gagal menambahkan opsi, hapus kombinasi yang baru dibuat
      await supabase
        .from("product_variant_combinations")
        .delete()
        .eq("id", combination.id);
      
      return Response.json({ error: optionsError.message }, { status: 500 });
    }
    
    // Ambil kombinasi lengkap dengan opsi varian
    const { data: fullCombination, error: fetchError } = await supabase
      .from("product_variant_combinations")
      .select(`
        *,
        selected_options:product_variant_combination_options(
          id,
          variant_option:variant_options(
            id,
            name,
            image_url,
            variant_type:variant_types(id, name)
          )
        )
      `)
      .eq("id", combination.id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching complete combination:', fetchError);
      return Response.json({ error: fetchError.message }, { status: 500 });
    }
    
    return Response.json(fullCombination);
  } catch (error) {
    console.error('Unexpected error in POST handler:', error);
    return Response.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Memperbarui kombinasi varian
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to properly access its properties
    const { id } = await context.params;
    
    const formData = await request.formData();
    
    const combinationId = formData.get("combination_id") as string;
    const price = formData.get("price") as string;
    const stock = parseInt(formData.get("stock") as string) || 0;
    const sku = formData.get("sku") as string;
    const image = formData.get("image") as File | null;
    const existingImage = formData.get("existingImage") as string;
    
    if (!combinationId || !price) {
      return Response.json({ 
        error: "ID kombinasi dan harga diperlukan" 
      }, { status: 400 });
    }
    
    // Verifikasi kombinasi ini milik produk yang benar
    const { data: existingCombination, error: checkError } = await supabase
      .from("product_variant_combinations")
      .select("id")
      .eq("id", combinationId)
      .eq("product_id", id)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking combination ownership:', checkError);
      return Response.json({ error: checkError.message }, { status: 500 });
    }
    
    if (!existingCombination) {
      return Response.json({ 
        error: "Kombinasi varian tidak ditemukan untuk produk ini" 
      }, { status: 404 });
    }
    
    // Upload gambar baru jika disediakan
    let imageUrl = existingImage;
    if (image) {
      const fileName = `${Date.now()}-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("ecoute")
        .upload(`variant-combinations/${fileName}`, image, { contentType: image.type });

      if (uploadError) {
        console.error('Error uploading new variant image:', uploadError);
        return Response.json({ error: uploadError.message }, { status: 500 });
      }

      imageUrl = supabase.storage
        .from("ecoute")
        .getPublicUrl(`variant-combinations/${fileName}`).data.publicUrl;
    }
    
    // Perbarui kombinasi
    const { data, error } = await supabase
      .from("product_variant_combinations")
      .update({
        price,
        stock,
        sku,
        image_url: imageUrl
      })
      .eq("id", combinationId)
      .select(`
        *,
        selected_options:product_variant_combination_options(
          id,
          variant_option:variant_options(
            id,
            name,
            image_url,
            variant_type:variant_types(id, name)
          )
        )
      `)
      .single();
    
    if (error) {
      console.error('Error updating variant combination:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    return Response.json(data);
  } catch (error) {
    console.error('Unexpected error in PUT handler:', error);
    return Response.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Menghapus kombinasi varian
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to properly access its properties
    const { id } = await context.params;
    
    const { searchParams } = new URL(request.url);
    const combinationId = searchParams.get('combination_id');
    
    if (!combinationId) {
      return Response.json({ error: "ID kombinasi diperlukan" }, { status: 400 });
    }
    
    // Verifikasi kombinasi ini milik produk yang benar
    const { data: existingCombination, error: checkError } = await supabase
      .from("product_variant_combinations")
      .select("id")
      .eq("id", combinationId)
      .eq("product_id", id)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking combination ownership:', checkError);
      return Response.json({ error: checkError.message }, { status: 500 });
    }
    
    if (!existingCombination) {
      return Response.json({ 
        error: "Kombinasi varian tidak ditemukan untuk produk ini" 
      }, { status: 404 });
    }
    
    // Hapus opsi varian terlebih dahulu
    const { error: optionsError } = await supabase
      .from("product_variant_combination_options")
      .delete()
      .eq("combination_id", combinationId);
    
    if (optionsError) {
      console.error('Error deleting variant options:', optionsError);
      return Response.json({ error: optionsError.message }, { status: 500 });
    }
    
    // Hapus kombinasi varian
    const { error: deleteError } = await supabase
      .from("product_variant_combinations")
      .delete()
      .eq("id", combinationId);
    
    if (deleteError) {
      console.error('Error deleting variant combination:', deleteError);
      return Response.json({ error: deleteError.message }, { status: 500 });
    }
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE handler:', error);
    return Response.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 