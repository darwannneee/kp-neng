import { NextRequest } from "next/server"
import supabase from "@/utils/supabase/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const trending = searchParams.get('trending') === 'true';
    const category = searchParams.get('category');
    
    // Buat query untuk produk
    let query = supabase.from("products").select("*");
    
    // Tambahkan filter jika ada
    if (category) {
      query = query.eq('category_id', category);
    }
    
    // Jika diminta produk trending, ambil berdasarkan views (jika ada) atau sort lain
    if (trending) {
      // Untuk implementasi sederhana, kita sort berdasarkan ID
      // Idealnya gunakan field seperti views_count, likes_count, dll.
      query = query.order('id', { ascending: false });
    } else {
      // Default sort: terbaru duluan
      query = query.order('created_at', { ascending: false });
    }
    
    // Batasi jumlah produk yang diambil
    query = query.limit(limit);
    
    const { data, error } = await query;
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: { formData: () => any; }) {
  const formData = await request.formData();
  
  const name = formData.get("name") as string;
  const colours = parseInt(formData.get("colours") as string);
  const price = formData.get("price") as string;
  const categoryId = formData.get("category_id") as string;
  const image = formData.get("image") as File;

  // Upload image
  const fileName = `${Date.now()}-${image.name}`;
  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(fileName, image, {
      contentType: image.type,
    });

  if (uploadError) return Response.json({ error: uploadError }, { status: 500 });

  const imageUrl = supabase.storage
    .from("product-images")
    .getPublicUrl(fileName).data.publicUrl;

  // Simpan ke database
  const { data, error: dbError } = await supabase
    .from("products")
    .insert({ 
      name, 
      colours, 
      price, 
      image_url: imageUrl,
      category_id: categoryId 
    })
    .select("*, category:categories(name)")
    .single();

  if (dbError) return Response.json({ error: dbError }, { status: 500 });
  return Response.json(data);
}