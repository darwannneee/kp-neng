import { NextRequest } from "next/server";
import supabase from "@/utils/supabase/client";

// === POST Tambah Produk Baru ===
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    console.log('Processing add product request...');
    
    // Debug all form data entries
    console.log('DEBUG: All form data entries:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`DEBUG: ${key} = File: ${value.name}, size: ${value.size} bytes, type: ${value.type}`);
      } else if (key === 'variants') {
        console.log(`DEBUG: ${key} = [JSON string, length: ${(value as string).length}]`);
      } else {
        console.log(`DEBUG: ${key} = ${value}`);
      }
    }

    // Extract form data
    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const description = formData.get("description") as string;
    const adminId = formData.get("admin_id") as string;
    const category = formData.get('category_id') as string;
    const image = formData.get("image") as File;
    const variantsJson = formData.get("variants") as string || "[]";
    console.log('DEBUG: Raw variants JSON:', variantsJson);
    const variants = JSON.parse(variantsJson);
    
    console.log('Received form data:', {
      name,
      price,
      description,
      adminId,
      category,
      hasImage: !!image,
      variantsCount: variants.length
    });
    
    // Validate required fields
    if (!name || !price || !description || !category) {
      console.error('Missing required fields');
      return Response.json({ 
        error: "All required fields must be filled" 
      }, { status: 400 });
    }
    
    if (!image) {
      console.error('Image is required');
      return Response.json({ 
        error: "Image file is required" 
      }, { status: 400 });
    }
    
    // Create a sanitized product name for folder structure
    const sanitizedProductName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const productFolderPath = `products/${sanitizedProductName}_${Date.now()}`;
    
    // Upload main product image
    console.log('Uploading main product image...');
    const fileName = `${productFolderPath}/main-${image.name}`;
    const { error: uploadError } = await supabase.storage
      .from("ecoute")
      .upload(fileName, image, { contentType: image.type });
    
    if (uploadError) {
      console.error('Image upload error:', uploadError);
      return Response.json({ 
        error: uploadError.message 
      }, { status: 500 });
    }
    
    const imageUrl = supabase.storage
      .from("ecoute")
      .getPublicUrl(fileName).data.publicUrl;
    
    console.log('Image uploaded successfully:', imageUrl);
    
    // Save product to database with transaction
    const { data, error: dbError } = await supabase
      .from("products")
      .insert({
        name,
        price,
        description,
        image_url: imageUrl,
        category_id: category,
        admin_id: adminId,
      })
      .select("*, admin:admins(username)")
      .single();
    
    if (dbError) {
      console.error('Database error:', dbError);
      return Response.json({ 
        error: dbError.message 
      }, { status: 500 });
    }
    
    console.log('Product saved successfully:', data);
    
    // Collect variant images from formData
    const variantImages: Record<number, File> = {};
    console.log('DEBUG: Checking for variant images in formData...');
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('variantImage_') && value instanceof File && value.size > 0) {
        const index = parseInt(key.split('_')[1]);
        variantImages[index] = value;
        console.log(`Found variant image for index ${index}:`, {
          fileName: value.name,
          fileSize: value.size,
          fileType: value.type
        });
      }
    }
    console.log('DEBUG: Found variant images:', Object.keys(variantImages).length);
    
    // Process variants if provided
    if (variants && variants.length > 0) {
      console.log(`Processing ${variants.length} variants...`);
      console.log('DEBUG: variantImages available:', Object.keys(variantImages));
      
      for (let variantIndex = 0; variantIndex < variants.length; variantIndex++) {
        const variant = variants[variantIndex];
        try {
          // Upload variant image if provided
          let variantImageUrl = null;
          
          // Check if we have an image for this variant in the variantImages map
          const variantImage = variantImages[variantIndex];
          console.log(`Processing variant image for: ${variant.name} at index ${variantIndex}`, {
            hasImage: !!variantImage,
            imageType: variantImage ? variantImage.type : 'No image',
            imageSize: variantImage ? variantImage.size : 0
          });
          
          if (variantImage && variantImage.size > 0) {
            // Store variant images within the product folder
            const sanitizedVariantName = variant.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
            console.log(`Uploading image for variant: ${variant.name}`, {
              imageSize: variantImage.size,
              imageName: variantImage.name,
              imageType: variantImage.type
            });
            const variantFileName = `${productFolderPath}/variant_${sanitizedVariantName}_${Date.now()}-${variantImage.name}`;
            console.log('Variant image target path:', variantFileName);
            
            try {
              // This is important - we need to log the actual content of the file
              console.log('Uploading file with content type:', variantImage.type);
              
              const { error: variantUploadError, data: uploadData } = await supabase.storage
                .from("ecoute")
                .upload(variantFileName, variantImage, { 
                  contentType: variantImage.type,
                  cacheControl: '3600'
                });
              
              if (variantUploadError) {
                console.error(`Error uploading image for variant ${variant.name}:`, variantUploadError);
              } else {
                console.log('Upload successful. Upload data:', uploadData);
                
                const publicUrlResult = supabase.storage
                  .from("ecoute")
                  .getPublicUrl(variantFileName);
                  
                console.log('Public URL result:', publicUrlResult);
                variantImageUrl = publicUrlResult.data.publicUrl;
                console.log('Variant image uploaded successfully. URL:', variantImageUrl);
              }
            } catch (uploadError) {
              console.error(`Unexpected error during variant image upload for ${variant.name}:`, uploadError);
              console.error('Error details:', uploadError);
            }
          } else {
            console.log(`No image provided for variant: ${variant.name}`);
          }
          
          // Add the variant to product_variants
          console.log(`Adding variant to database: ${variant.name}`);
          console.log('Variant data being sent:', {
            product_id: data.id,
            name: variant.name,
            image_url: variantImageUrl
          });
          
          const { data: variantData, error: variantError } = await supabase
            .from("product_variants")
            .insert({
              product_id: data.id,
              name: variant.name,
              image_url: variantImageUrl
            })
            .select()
            .single();
          
          if (variantError) {
            console.error(`Error adding variant ${variant.name}:`, variantError);
            continue;
          }
          
          console.log(`Variant ${variant.name} added successfully with ID: ${variantData.id}`);
          
          // Add sizes for this variant if provided
          if (variant.sizes && variant.sizes.length > 0) {
            console.log(`Adding ${variant.sizes.length} sizes for variant ${variant.name}`);
            
            const sizesToInsert = variant.sizes.map((size: {size_id: string}) => ({
              variant_id: variantData.id,
              size_id: size.size_id // Menggunakan nama kolom yang benar di database
              // stock field has been removed from the database schema
            }));
            
            const { error: sizesError } = await supabase
              .from("variant_sizes")
              .insert(sizesToInsert);
              
            if (sizesError) {
              console.error(`Error adding sizes for variant ${variant.name}:`, sizesError);
            } else {
              console.log(`Successfully added ${sizesToInsert.length} sizes for variant ${variant.name}`);
            }
          }
        } catch (variantError) {
          console.error(`Error processing variant ${variant.name}:`, variantError);
        }
      }
    } else {
      console.log('No variants to process');
    }
    
    // Return the product data
    return Response.json(data);
  } catch (error) {
    console.error('Error in add product endpoint:', error);
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}