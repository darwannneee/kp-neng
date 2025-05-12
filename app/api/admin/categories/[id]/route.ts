// src/app/api/admin/categories/[id]/route.ts
import { NextRequest } from "next/server";
// Gunakan Supabase Client API (kunci anon publik)
import supabase from "@/utils/supabase/client";


// PUT: Edit kategori (via API publik)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to properly access its properties
    const { id } = await context.params;
    console.log('Processing update for category ID:', id);
    
    const formData = await request.formData()
    
    const name = formData.get("name") as string
    const image = formData.get("image") as File | null
    const existingImage = formData.get("existingImage") as string
    
    let imageUrl = existingImage
    
    if (image) {
      console.log('Uploading new image for category:', image.name);
      const fileName = `${Date.now()}-${image.name}`
      const { error: uploadError } = await supabase.storage
        .from("ecoute")
        .upload(`categories/${fileName}`, image, { contentType: image.type })
    
      if (uploadError) {
        console.error('Image upload error:', uploadError);
        return Response.json({ error: uploadError }, { status: 500 })
      }
    
      imageUrl = supabase.storage
        .from("ecoute")
        .getPublicUrl(`categories/${fileName}`).data.publicUrl
      
      console.log('Image uploaded successfully:', imageUrl);
    }
    
    console.log('Updating category in database...');
    const { data, error } = await supabase
      .from("categories")
      .update({ name, image_url: imageUrl })
      .eq("id", id)
      .select()
      .single()
    
    if (error) {
      console.error('Database update error:', error);
      return Response.json({ error }, { status: 500 })
    }
    
    console.log('Category updated successfully:', data.id);
    return Response.json(data)
  } catch (error) {
    console.error('Unexpected error in PUT handler:', error);
    return Response.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// DELETE: Hapus kategori (via API publik)
export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to properly access its properties
    const { id } = await context.params;
    console.log('Processing delete for category ID:', id);
    
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
    
    if (error) {
      console.error('Error deleting category:', error);
      return Response.json({ error }, { status: 500 })
    }
    
    console.log('Category deleted successfully');
    return Response.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in DELETE handler:', error);
    return Response.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}