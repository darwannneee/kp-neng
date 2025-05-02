import { NextRequest } from "next/server";
import supabase from "@/utils/supabase/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Query banners, optionally filter by type
    let query = supabase.from("banners").select("*").order('position', { ascending: true });
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const title = formData.get("title") as string;
    const subtitle = formData.get("subtitle") as string; 
    const buttonText = formData.get("buttonText") as string;
    const buttonLink = formData.get("buttonLink") as string;
    const type = formData.get("type") as string;
    const position = parseInt(formData.get("position") as string);
    const adminId = formData.get("admin_id") as string;
    const image = formData.get("image") as File;
    
    if (!image) {
      return Response.json({ error: "Gambar banner diperlukan" }, { status: 400 });
    }
    
    // Upload gambar
    const fileName = `banner-${Date.now()}-${image.name}`;
    const { error: uploadError } = await supabase.storage
      .from("banners")
      .upload(fileName, image, { contentType: image.type });
    
    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }
    
    const imageUrl = supabase.storage
      .from("banners")
      .getPublicUrl(fileName).data.publicUrl;
    
    // Simpan ke database
    const { data, error: dbError } = await supabase
      .from("banners")
      .insert({
        title,
        subtitle,
        button_text: buttonText,
        button_link: buttonLink,
        image_url: imageUrl,
        type,
        position,
        admin_id: adminId,
      })
      .select()
      .single();
    
    if (dbError) {
      return Response.json({ error: dbError.message }, { status: 500 });
    }
    
    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 