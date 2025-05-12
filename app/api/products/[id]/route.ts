import { NextRequest } from "next/server";
import supabase from "@/utils/supabase/client";

// Define interfaces for type safety
interface Size {
  id: string;
  name: string;
}

interface VariantSize {
  id: string;
  variant_id: string;
  size_id: string;
  stock: number;
  size: Size | Size[];
}

interface VariantImage {
  id: string;
  variant_id?: string;  // Making this optional to match the actual data structure
  image_url: string;
}

interface Variant {
  id: string;
  name: string;
  product_id: string;
  image_url: string | null;
  created_at: string;
  sizes?: VariantSize[];
  additional_images?: VariantImage[];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Await the params to properly access its properties
  const { id } = await context.params;
  
  // Get the product details
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*, category:categories(name)")
    .eq("id", id)
    .single();
  
  if (productError) {
    return Response.json({ error: productError.message }, { status: 500 });
  }
  
  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }
  
  // 1. Fetch product variants
  console.log('Fetching variants for product:', id);
  
  const { data: rawVariants, error: variantsError } = await supabase
    .from("product_variants")
    .select(`
      id,
      name,
      product_id,
      image_url,
      created_at
    `)
    .eq("product_id", id);
    
  // Cast the raw data to our Variant type
  const variants = rawVariants as Variant[] | null;
  
  if (variantsError) {
    console.error("Error fetching variants:", variantsError);
    product.variants = [];
  } else {
    // 2. Get variant sizes for each variant
    for (const variant of variants || []) {
      const { data: sizes, error: sizesError } = await supabase
        .from("variant_sizes")
        .select(`
          id,
          variant_id,
          size_id,
          stock,
          size:sizes(id, name)
        `)
        .eq("variant_id", variant.id);
        
      if (sizesError) {
        console.error(`Error fetching sizes for variant ${variant.id}:`, sizesError);
        variant.sizes = [];
      } else {
        // Cast to proper type to fix TypeScript errors
        variant.sizes = sizes as VariantSize[] || [];
      }
      
      // 3. Get additional variant images from variant_images table
      const { data: variantImages, error: imagesError } = await supabase
        .from("variant_images")
        .select("id, image_url")
        .eq("variant_id", variant.id);
        
      if (imagesError) {
        console.error(`Error fetching images for variant ${variant.id}:`, imagesError);
      } else if (variantImages && variantImages.length > 0) {
        // If we found images in variant_images, they take precedence
        variant.additional_images = variantImages as VariantImage[];
        
        // If variant has no image_url but has variant_images, use the first one
        if (!variant.image_url && variantImages.length > 0) {
          variant.image_url = variantImages[0].image_url;
        }
      }
    }
    
    console.log(`Found ${variants?.length || 0} variants for product ${id}`);
    // Add variants to the product
    product.variants = variants || [];
    
    // Log variant details for debugging
    if (variants && variants.length > 0) {
      console.log('First variant details:', {
        id: variants[0].id,
        name: variants[0].name,
        hasImage: !!variants[0].image_url,
        imageUrl: variants[0].image_url,
        sizesCount: variants[0].sizes?.length || 0,
        additionalImages: variants[0].additional_images?.length || 0
      });
    }
  }
  
  return Response.json(product);
} 