import { NextRequest } from "next/server"
import supabase from "@/utils/supabase/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const includeVariants = searchParams.get('include_variants') === 'true';
  
  let query = supabase
    .from("products")
    .select("*, category:categories(name)");
  
  if (category) {
    query = query.eq("category_id", category);
  }
  
  const { data, error } = await query;
  
  if (error) return Response.json({ error }, { status: 500 });

  // If variants are requested, fetch them for each product
  if (includeVariants && data && data.length > 0) {
    const productIds = data.map(product => product.id);
    
    const { data: variants, error: variantsError } = await supabase
      .from("product_variants")
      .select(`
        *,
        sizes:variant_sizes(
          id,
          size_id,
          size:sizes(id, name)
        )
      `)
      .in("product_id", productIds);
    
    if (variantsError) return Response.json({ error: variantsError }, { status: 500 });
    
    // Group variants by product_id
    const variantsByProduct = variants.reduce((acc, variant) => {
      if (!acc[variant.product_id]) {
        acc[variant.product_id] = [];
      }
      acc[variant.product_id].push(variant);
      return acc;
    }, {});
    
    // Add variants to each product
    data.forEach(product => {
      product.variants = variantsByProduct[product.id] || [];
    });
  }
  
  return Response.json(data);
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