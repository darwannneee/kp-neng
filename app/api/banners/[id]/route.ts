import { NextRequest } from "next/server";
import supabase from "@/utils/supabase/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return Response.json({ error: "Banner tidak ditemukan" }, { status: 404 });
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    
    const title = formData.get("title") as string;
    const subtitle = formData.get("subtitle") as string;
    const buttonText = formData.get("buttonText") as string;
    const buttonLink = formData.get("buttonLink") as string;
    const type = formData.get("type") as string;
    const position = parseInt(formData.get("position") as string);
    const image = formData.get("image") as File | null;
    const existingImage = formData.get("existingImage") as string;
    
    let imageUrl = existingImage;
    
    if (image) {
      // Upload gambar baru
      const fileName = `banner-${Date.now()}-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(fileName, image, { contentType: image.type });
      
      if (uploadError) {
        return Response.json({ error: uploadError.message }, { status: 500 });
      }
      
      imageUrl = supabase.storage
        .from("banners")
        .getPublicUrl(fileName).data.publicUrl;
    }
    
    // Update data di database
    const { data, error } = await supabase
      .from("banners")
      .update({
        title,
        subtitle,
        button_text: buttonText,
        button_link: buttonLink,
        image_url: imageUrl,
        type,
        position,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get banner info before deleting (for image deletion later)
    const { data: banner } = await supabase
      .from("banners")
      .select("image_url")
      .eq("id", params.id)
      .single();
      
    // Delete from database
    const { error } = await supabase
      .from("banners")
      .delete()
      .eq("id", params.id);
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    // Optional: Delete image from storage (if you implement this)
    // You would extract file path from banner.image_url and use storage.remove()
    
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 