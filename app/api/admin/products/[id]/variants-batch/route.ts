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
    
    // Log all form data entries for debugging
    console.log(`Received form data for product ID: ${productId}`);
    console.log('Form data entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`Key: ${key}, Type: ${typeof value}, ${value instanceof File ? `File size: ${(value as File).size} bytes` : 'Not a file'}`);
    }
    
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
        console.log(`Found image file for variant ${i}, size: ${variantImageFile.size} bytes`);
        
        try {
          // Use the same approach as in the main products route
          const variantFileName = `${productId}_${variantId}_${Date.now()}`;
          
          console.log(`Uploading image for variant ${variant.name} with name: ${variantFileName}`);
          const { data: uploadData, error: variantUploadError } = await supabase.storage
            .from("ecoute")  // Using the same bucket as main products
            .upload(`variants/${variantFileName}`, variantImageFile, { 
              contentType: variantImageFile.type || 'image/jpeg'
            });
          
          if (variantUploadError) {
            console.error(`Error uploading variant image for ${variant.name}:`, variantUploadError);
            continue; // Skip this variant but continue with others
          }
          
          // Get the public URL using the same method as in products route
          variantImageUrl = supabase.storage
            .from("ecoute")
            .getPublicUrl(`variants/${variantFileName}`).data.publicUrl;
          
          console.log(`Image uploaded successfully for variant ${variant.name}, URL: ${variantImageUrl}`);
        } catch (imageError) {
          console.error(`Exception processing image for variant ${variant.name}:`, imageError);
        }
      } else {
        console.log(`No image file found for variant ${i} (${variant.name})`);
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
      
      // Add the variant to database - using the same approach as products route
      try {
        console.log(`Adding variant ${variant.name} to database for product ${productId}`);
        
        // Use the correct table name - product_variants instead of variants
        const { data: variantData, error: variantError } = await supabase
          .from("product_variants")  // Changed from "variants" to "product_variants"
          .insert({
            product_id: productId,
            name: variant.name,
            image_url: variantImageUrl
          })
          .select()
          .single();
          
        if (variantError) {
          console.error("Error adding variant:", variantError.code, variantError.message);
          console.error("Error details:", JSON.stringify(variantError));
          continue;  // Skip to next variant
        } else {
          console.log(`Successfully added variant: ${variant.name}`, JSON.stringify(variantData));
          
          // Store the variant ID for sizes
          const variantDbId = variantData.id;
          
          // Now we work with the correct variant ID from the database
          
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
            } else {
              console.log(`Successfully added ${sizeMappings.length} sizes for variant: ${variant.name}`);
            }
          }
        }
      } catch (dbError) {
        console.error(`Unexpected error during database operation for variant ${variant.name}:`, dbError);
        continue;
      }
      // Sizes are now processed inside the variant insertion block above
      // This ensures that we're using the correct variant ID from the database
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
