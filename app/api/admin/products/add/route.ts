import { NextRequest } from "next/server";
import supabase from "@/utils/supabase/client";

// === POST Tambah Produk Baru ===
export async function POST(request: NextRequest) {
    const formData = await request.formData();
  
    const name = formData.get("name") as string;
    const colours = parseInt(formData.get("colours") as string);
    const price = formData.get("price") as string;
    const description = formData.get("description") as string;
    const adminId = formData.get("admin_id") as string;
    const category = formData.get('category_id') as string;
    const image = formData.get("image") as File;
  
    if (!image) {
      return Response.json({ error: "Image file is required" }, { status: 400 });
    }
  
    // Upload Image
    const fileName = `${Date.now()}-${image.name}`;
    const { error: uploadError } = await supabase.storage
      .from("ecoute")
      .upload(fileName, image, { contentType: image.type });
  
    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }
  
    const imageUrl = supabase.storage
      .from("ecoute")
      .getPublicUrl(fileName).data.publicUrl;
  
    // Simpan ke database
    const { data, error: dbError } = await supabase
      .from("products")
      .insert({
        name,
        colours,
        price,
        description,
        image_url: imageUrl,
        category_id: category,
        admin_id: adminId,
      })
      .select("*, admin:admins(username)")
      .single();
  
    if (dbError) {
      return Response.json({ error: dbError.message }, { status: 500 });
    }
  
    return Response.json(data);
  }