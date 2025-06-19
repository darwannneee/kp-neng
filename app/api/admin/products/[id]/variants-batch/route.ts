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
    
    // Debug info
    console.log(`Processing ${variantsData.length} variants for product ID: ${productId}`);
    console.log('Variants data:', JSON.stringify(variantsData));
    
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
      
      // Prepare variant data object
      const variantObject = {
        id: variantId,
        name: variant.name,
        product_id: productId,
        image_url: variantImageUrl,
      };
      
      console.log(`Upserting variant: ${variant.name} (ID: ${variantId}) for product: ${productId}`);
      console.log('Variant data:', JSON.stringify(variantObject));
      
      // Insert or update variant
      const { data: variantData, error: variantError } = await supabase
        .from("variants")
        .upsert(variantObject)
        .select();
      
      if (variantError) {
        console.error("Error upserting variant:", variantError);
        console.error("Error details:", JSON.stringify(variantError));
        continue;
      } else {
        console.log(`Successfully upserted variant: ${variant.name}`, JSON.stringify(variantData));
      }
      
      // Insert sizes for this variant
      if (variant.sizes && variant.sizes.length > 0) {
        console.log(`Processing ${variant.sizes.length} sizes for variant: ${variant.name} (ID: ${variantId})`);
        
        // Delete existing variant_sizes first to avoid duplicates
        const { error: deleteError } = await supabase
          .from("variant_sizes")
          .delete()
          .eq("variant_id", variantId);
        
        if (deleteError) {
          console.error("Error deleting existing variant sizes:", deleteError);
        } else {
          console.log(`Successfully deleted existing sizes for variant: ${variantId}`);
        }
        
        // Prepare the size mappings
        const sizeMappings = variant.sizes.map((size: { size_id: string }) => ({
          id: uuidv4(),
          variant_id: variantId,
          size_id: size.size_id,
        }));
        
        console.log('Size mappings to insert:', JSON.stringify(sizeMappings));
        
        // Insert the new size mappings
        const { data: sizeData, error: sizeError } = await supabase
          .from("variant_sizes")
          .insert(sizeMappings)
          .select();
        
        if (sizeError) {
          console.error("Error inserting variant sizes:", sizeError);
          console.error("Error details:", JSON.stringify(sizeError));
          continue;
        } else {
          console.log(`Successfully inserted ${sizeMappings.length} sizes for variant: ${variant.name}`);
        }
      } else {
        console.log(`No sizes to process for variant: ${variant.name} (ID: ${variantId})`);
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
