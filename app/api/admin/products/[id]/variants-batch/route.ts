import { NextRequest, NextResponse } from "next/server";
import supabase from "@/utils/supabase/client";
import { v4 as uuidv4 } from "uuid";

// Increase to match next.config.js
export const maxDuration = 60; // Extend the function timeout to 60 seconds for large uploads

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
    
    // Log request info
    const contentLength = request.headers.get('content-length');
    console.log(`Request content length: ${contentLength} bytes (${parseInt(contentLength || '0') / (1024 * 1024)} MB)`);
    console.log(`Received variant batch for product ID: ${productId}`);
    
    // Get the variants JSON data
    const variantsString = formData.get("variants") as string;
    if (!variantsString) {
      return NextResponse.json({ error: "Variants data is required" }, { status: 400 });
    }
    
    const variantsData = JSON.parse(variantsString);
    
    // Debug info
    console.log(`Processing ${variantsData.length} variants for product ID: ${productId}`);
    
    // Track successful and failed variants
    const results = {
      successful: [],
      failed: []
    };
    
    // Process each variant in the batch
    for (let i = 0; i < variantsData.length; i++) {
      const variant = variantsData[i];
      const variantId = variant.id || uuidv4();
      const variantImageFile = formData.get(`variantImage_${i}`) as File | null;
      
      try {
        // Upload variant image if exists
        let variantImageUrl = variant.image_url;
        if (variantImageFile && variantImageFile.size > 0) {
          console.log(`Processing image for variant ${i} (${variant.name}), size: ${variantImageFile.size} bytes`);
          
          // Use the same approach as in the main products route
          const variantFileName = `${productId}_${variantId}_${Date.now()}`;
          
          const { data: uploadData, error: variantUploadError } = await supabase.storage
            .from("ecoute")  // Using the same bucket as main products
            .upload(`variants/${variantFileName}`, variantImageFile, { 
              contentType: variantImageFile.type || 'image/jpeg'
            });
          
          if (variantUploadError) {
            console.error(`Error uploading variant image for ${variant.name}:`, variantUploadError);
            results.failed.push({
              name: variant.name,
              error: `Image upload failed: ${variantUploadError.message}`
            });
            continue;
          }
          
          // Get the public URL using the same method as in products route
          variantImageUrl = supabase.storage
            .from("ecoute")
            .getPublicUrl(`variants/${variantFileName}`).data.publicUrl;
          
          console.log(`Image uploaded successfully for variant ${variant.name}, URL: ${variantImageUrl}`);
        } else {
          console.log(`No image file found for variant ${i} (${variant.name})`);
        }
        
        // Prepare variant data object
        const variantObject = {
          product_id: productId,
          name: variant.name,
          image_url: variantImageUrl
        };
        
        console.log(`Adding variant to database: ${variant.name} for product: ${productId}`);
        
        // First add the variant to get its ID
        const { data: variantData, error: variantError } = await supabase
          .from("product_variants")
          .insert(variantObject)
          .select()
          .single();
          
        if (variantError) {
          console.error("Error adding variant:", variantError.code, variantError.message);
          results.failed.push({
            name: variant.name,
            error: `Database error: ${variantError.message}`
          });
          continue;
        }
        
        console.log(`Successfully added variant: ${variant.name}`, variantData);
        
        // Get the variant ID from the database
        const variantDbId = variantData.id;
        
        // Process sizes using this variant ID
        if (variant.sizes && variant.sizes.length > 0) {
          console.log(`Processing ${variant.sizes.length} sizes for variant: ${variant.name} (ID: ${variantDbId})`);
          
          // Map sizes to variant_sizes format
          const sizeMappings = variant.sizes.map((size: { size_id: string }) => ({
            variant_id: variantDbId,
            size_id: size.size_id
          }));
          
          // Add sizes for this variant
          const { error: sizeError } = await supabase
            .from("variant_sizes")
            .insert(sizeMappings);
            
          if (sizeError) {
            console.error("Error adding variant sizes:", sizeError);
            // Don't fail the entire variant just for size errors
            console.log(`Variant created but sizes failed: ${variant.name}`);
            results.successful.push({
              name: variant.name,
              id: variantDbId,
              sizeError: true
            });
          } else {
            console.log(`Successfully added ${sizeMappings.length} sizes for variant: ${variant.name}`);
            results.successful.push({
              name: variant.name,
              id: variantDbId,
              sizeError: false
            });
          }
        } else {
          // No sizes to add
          results.successful.push({
            name: variant.name,
            id: variantDbId
          });
        }
      } catch (variantError) {
        console.error(`Unexpected error processing variant ${variant.name}:`, variantError);
        results.failed.push({
          name: variant.name,
          error: `Unexpected error: ${variantError.message || 'Unknown error'}`
        });
      }
    }
    
    // Return overall results
    return NextResponse.json({ 
      success: true, 
      message: "Variants batch processed",
      processed: {
        total: variantsData.length,
        successful: results.successful.length,
        failed: results.failed.length
      },
      results
    });
  } catch (error) {
    console.error("Error processing variants batch:", error);
    return NextResponse.json(
      { error: "Failed to process variants batch", message: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
