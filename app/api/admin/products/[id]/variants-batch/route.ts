import { NextRequest, NextResponse } from "next/server";
import supabase from "@/utils/supabase/client";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }
    
    const formData = await request.formData();
    
    // Get the variants JSON data
    const variantsString = formData.get("variants") as string;
    if (!variantsString) {
      return NextResponse.json({ error: "Variants data is required" }, { status: 400 });
    }
    
    const variantsData = JSON.parse(variantsString);
    
    // Process each variant in the batch
    for (let i = 0; i < variantsData.length; i++) {
      const variant = variantsData[i];
      const variantId = variant.id || uuidv4();
      const variantImageFile = formData.get(`variantImage_${i}`) as File | null;
      
      // Upload variant image if exists
      let variantImageUrl = variant.image_url;
      if (variantImageFile && variantImageFile.size > 0) {
        const variantImageName = `${productId}_${variantId}_${Date.now()}`;
        const { data: variantUploadData, error: variantUploadError } = await supabase.storage
          .from("variants")
          .upload(variantImageName, variantImageFile);
        
        if (variantUploadError) {
          console.error("Error uploading variant image:", variantUploadError);
          continue; // Skip this variant but continue with others
        }
        
        const { data: variantUrlData } = await supabase.storage
          .from("variants")
          .getPublicUrl(variantImageName);
        
        variantImageUrl = variantUrlData.publicUrl;
      }
      
      // Insert or update variant
      const { data: variantData, error: variantError } = await supabase
        .from("variants")
        .upsert({
          id: variantId,
          name: variant.name,
          product_id: productId,
          image_url: variantImageUrl,
        })
        .select();
      
      if (variantError) {
        console.error("Error upserting variant:", variantError);
        continue;
      }
      
      // Insert sizes for this variant
      if (variant.sizes && variant.sizes.length > 0) {
        // Delete existing variant_sizes first to avoid duplicates
        await supabase
          .from("variant_sizes")
          .delete()
          .eq("variant_id", variantId);
        
        // Prepare the size mappings
        const sizeMappings = variant.sizes.map((size: { size_id: string }) => ({
          id: uuidv4(),
          variant_id: variantId,
          size_id: size.size_id,
        }));
        
        // Insert the new size mappings
        const { error: sizeError } = await supabase
          .from("variant_sizes")
          .insert(sizeMappings);
        
        if (sizeError) {
          console.error("Error inserting variant sizes:", sizeError);
          continue;
        }
      }
    }
    
    return NextResponse.json({ success: true, message: "Variants batch processed" });
  } catch (error) {
    console.error("Error processing variants batch:", error);
    return NextResponse.json(
      { error: "Failed to process variants batch" },
      { status: 500 }
    );
  }
}
