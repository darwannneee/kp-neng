import { NextRequest } from "next/server";
import supabase from "@/utils/supabase/client";

// === GET Semua Produk Admin ===
export async function GET(request: NextRequest) {

  const { data, error } = await supabase
    .from("products")
    .select("*")

  if (error) {
    console.log(data)
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

// === PUT Update Produk Berdasarkan ID ===
export async function PUT(request: NextRequest) {
  const formData = await request.formData();

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const colours = parseInt(formData.get("colours") as string);
  const price = formData.get("price") as string;
  const adminId = formData.get("admin_id") as string;
  const existingImage = formData.get("existingImage") as string;
  const image = formData.get("image") as File | null;

  let imageUrl = existingImage;

  if (image) {
    const fileName = `${Date.now()}-${image.name}`;
    const { error: uploadError } = await supabase.storage
      .from("ecoute")
      .upload(fileName, image, { contentType: image.type });

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    imageUrl = supabase.storage
      .from("ecoute")
      .getPublicUrl(fileName).data.publicUrl;
  }

  const { data, error } = await supabase
    .from("products")
    .update({ name, colours, price, image_url: imageUrl, admin_id: adminId })
    .eq("id", id)
    .select("*, admin:admins(username)")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}