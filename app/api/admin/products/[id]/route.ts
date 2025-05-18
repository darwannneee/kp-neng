import { NextRequest } from "next/server"
import supabase from "@/utils/supabase/client"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to properly access its properties
    const { id } = await context.params;
    console.log('Processing update for product ID:', id);
    
    const formData = await request.formData();
    
    // Log received form data
    console.log('Received form data fields:', Array.from(formData.keys()));
    
    // Handle form data
    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const description = formData.get("description") as string;
    const categoryId = formData.get("category_id") as string;
    const adminId = formData.get("admin_id") as string;
    const existingImage = formData.get("existingImage") as string;
    const variantsJson = formData.get("variants") as string | null;
    const variants = variantsJson ? JSON.parse(variantsJson) : [];
    
    // Periksa dan log semua field dalam formData untuk debugging
    console.log('All form data entries:');
    for (const pair of formData.entries()) {
      if (pair[0] === 'variants') {
        console.log(pair[0], '...JSON data...');
      } else if (pair[1] instanceof File) {
        console.log(pair[0], `File: ${(pair[1] as File).name}, size: ${(pair[1] as File).size} bytes`);
      } else {
        console.log(pair[0], pair[1]);
      }
    }
    
    // Get variant images from form data
    const variantImages: { [key: number]: File } = {};
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('variantImage_') && value instanceof File && value.size > 0) {
        const index = parseInt(key.split('_')[1]);
        variantImages[index] = value;
        console.log(`Found variant image for index ${index}:`, {
          fileName: value.name,
          fileSize: value.size
        });
      }
    }
    
    const image = formData.get("image") as File | null;

    console.log('Processing product update:', {
      id,
      name,
      price,
      categoryId,
      description: description?.substring(0, 20) + '...',
      hasImage: !!image,
      existingImage: existingImage?.substring(0, 20) + '...',
      hasVariantsData: !!variantsJson
    });

    // Validate required fields
    if (!name || !price || !description || !categoryId) {
      console.error('Missing required fields');
      return Response.json({ 
        error: "All required fields must be filled" 
      }, { status: 400 });
    }

    // Create a sanitized product name for folder structure
    const sanitizedProductName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const productFolderPath = `products/${sanitizedProductName}_${Date.now()}`;
    let imageUrl = existingImage;

    if (image) {
      console.log('Uploading new image:', image.name);
      const fileName = `${productFolderPath}/main-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("ecoute")
        .upload(fileName, image, { contentType: image.type });

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        return Response.json({ error: uploadError.message }, { status: 500 });
      }

      imageUrl = supabase.storage
        .from("ecoute")
        .getPublicUrl(fileName).data.publicUrl;
      
      console.log('Image uploaded successfully:', imageUrl);
    }

    console.log('Updating product in database...');
    const { data, error } = await supabase
      .from("products")
      .update({ 
        name, 
        price, 
        description, 
        image_url: imageUrl,
        category_id: categoryId
      })
      .eq("id", id)
      .select("*, admin:admins(username)")
      .single();

    if (error) {
      console.error('Database update error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log('Product updated successfully:', data.id);

    // Handle variants update if provided
    if (variantsJson) {
      try {
        // variants sudah di-parse sebelumnya
        console.log(`Processing ${variants.length} variants for product ${id}`);
        
        // Get existing variants
        const { data: existingVariants, error: variantsError } = await supabase
          .from("product_variants")
          .select("id, name")
          .eq("product_id", id);
          
        if (variantsError) {
          console.error("Error fetching existing variants:", variantsError);
          return Response.json(data); // Return the product data even if variant processing fails
        }
        
        // Process variants update
        const existingVariantIds = existingVariants.map(v => v.id);
        console.log(`Found ${existingVariantIds.length} existing variants`);
        
        const updatedVariantIds: string[] = [];
        
        if (Array.isArray(variants) && variants.length > 0) {
          console.log('DEBUG: variantImages available:', Object.keys(variantImages));
          // Process each variant sequentially to avoid race conditions
          for (let variantIndex = 0; variantIndex < variants.length; variantIndex++) {
            const variant = variants[variantIndex];
            try {
              if (variant.id) {
                // Update existing variant
                updatedVariantIds.push(variant.id);
                console.log(`Updating existing variant ${variant.id}: ${variant.name}`);
                
                // Handle variant image update if provided
                let variantImageUrl = variant.image_url;
                const variantImage = variantImages[variantIndex];
                
                if (variantImage) {
                  console.log('Uploading image for existing variant:', {
                    fileName: variantImage.name,
                    fileSize: variantImage.size,
                    fileType: variantImage.type
                  });
                  
                  const sanitizedVariantName = variant.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                  const variantFileName = `${Date.now()}-${sanitizedVariantName}-${variantImage.name}`;
                  
                  const { error: variantUploadError } = await supabase.storage
                    .from("ecoute")
                    .upload(`variants/${variantFileName}`, variantImage, { 
                      contentType: variantImage.type 
                    });
                    
                  if (variantUploadError) {
                    console.error("Error uploading variant image:", variantUploadError);
                  } else {
                    variantImageUrl = supabase.storage
                      .from("ecoute")
                      .getPublicUrl(`variants/${variantFileName}`).data.publicUrl;
                    console.log('Variant image uploaded:', variantImageUrl);
                  }
                }
                
                // Update variant data
                const { error: updateError } = await supabase
                  .from("product_variants")
                  .update({
                    name: variant.name,
                    image_url: variantImageUrl
                  })
                  .eq("id", variant.id);
                  
                if (updateError) {
                  console.error(`Error updating variant ${variant.name}:`, updateError);
                  continue;
                }
                
                // Process variant sizes
                await updateVariantSizes(variant.id, variant.sizes);
                
              } else {
                // Add new variant
                console.log(`Adding new variant: ${variant.name}`);
                
                // Handle variant image upload
                let variantImageUrl = null;
                const variantImage = variantImages[variantIndex];
                
                if (variantImage) {
                  console.log('Uploading image for new variant:', {
                    fileName: variantImage.name,
                    fileSize: variantImage.size,
                    fileType: variantImage.type
                  });
                  
                  const sanitizedVariantName = variant.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                  const variantFileName = `${Date.now()}-${sanitizedVariantName}-${variantImage.name}`;
                  
                  const { error: variantUploadError } = await supabase.storage
                    .from("ecoute")
                    .upload(`variants/${variantFileName}`, variantImage, { 
                      contentType: variantImage.type 
                    });
                    
                  if (variantUploadError) {
                    console.error("Error uploading variant image:", variantUploadError);
                  } else {
                    variantImageUrl = supabase.storage
                      .from("ecoute")
                      .getPublicUrl(`variants/${variantFileName}`).data.publicUrl;
                    console.log('Variant image uploaded:', variantImageUrl);
                  }
                }
                
                const { data: newVariant, error: insertError } = await supabase
                  .from("product_variants")
                  .insert({
                    product_id: id,
                    name: variant.name,
                    image_url: variantImageUrl
                  })
                  .select()
                  .single();
                  
                if (insertError) {
                  console.error(`Error adding new variant ${variant.name}:`, insertError);
                  continue;
                }
                
                if (newVariant) {
                  console.log(`New variant ${variant.name} added with ID: ${newVariant.id}`);
                  updatedVariantIds.push(newVariant.id);
                  
                  // Add sizes for the new variant
                  await updateVariantSizes(newVariant.id, variant.sizes);
                }
              }
            } catch (variantError) {
              console.error(`Error processing variant ${variant.name}:`, variantError);
            }
          }
          
          // Delete variants that were not updated/included
          const variantsToDelete = existingVariantIds.filter(id => !updatedVariantIds.includes(id));
          
          if (variantsToDelete.length > 0) {
            console.log(`Deleting ${variantsToDelete.length} removed variants:`, variantsToDelete);
            
            // Clean up variant sizes first
            for (const variantId of variantsToDelete) {
              const { error: sizesDeleteError } = await supabase
                .from("variant_sizes")
                .delete()
                .eq("variant_id", variantId);
                
              if (sizesDeleteError) {
                console.error(`Error deleting sizes for variant ${variantId}:`, sizesDeleteError);
              }
            }
            
            // Now delete the variants
            const { error: deleteError } = await supabase
              .from("product_variants")
              .delete()
              .in("id", variantsToDelete);
              
            if (deleteError) {
              console.error("Error deleting removed variants:", deleteError);
            } else {
              console.log(`Successfully deleted ${variantsToDelete.length} variants`);
            }
          }
        } else {
          // If empty variants array was sent, delete all variants and their sizes
          console.log('Deleting all variants for product:', id);
          
          // Delete variant sizes first
          const { error: sizesDeleteError } = await supabase
            .from("variant_sizes")
            .delete()
            .in("variant_id", existingVariantIds);
            
          if (sizesDeleteError) {
            console.error("Error deleting all variant sizes:", sizesDeleteError);
          }
          
          // Delete variants
          const { error: deleteAllError } = await supabase
            .from("product_variants")
            .delete()
            .eq("product_id", id);
            
          if (deleteAllError) {
            console.error("Error deleting all variants:", deleteAllError);
          } else {
            console.log(`Successfully deleted all variants for product ${id}`);
          }
        }
      } catch (e) {
        console.error("Error processing variants update:", e);
      }
    }

    console.log('Product update completed successfully');
    return Response.json(data);
  } catch (error) {
    console.error('Unexpected error in PUT handler:', error);
    return Response.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

interface VariantSize {
  id?: string;
  variant_id: string;
  size_id: string;
}

async function updateVariantSizes(variantId: string, sizes: VariantSize[]) {
  if (!Array.isArray(sizes) || sizes.length === 0) {
    console.log(`No sizes to process for variant ${variantId}`);
    return;
  }
  
  console.log(`Processing ${sizes.length} sizes for variant ${variantId}`);
  
  // Get existing sizes for this variant
  const { data: existingSizes, error: getSizesError } = await supabase
    .from("variant_sizes")
    .select("id, size_id") // Menggunakan nama kolom yang benar di database
    .eq("variant_id", variantId);
    
  if (getSizesError) {
    console.error(`Error fetching sizes for variant ${variantId}:`, getSizesError);
    return;
  }
  
  const existingSizeMap = new Map();
  existingSizes?.forEach(sizeObj => existingSizeMap.set(sizeObj.size_id, sizeObj.id)); // Menggunakan nama kolom yang benar di database
  
  // Process each size
  for (const size of sizes) {
    try {
      if (existingSizeMap.has(size.size_id)) {
        // Update existing size
        const sizeId = existingSizeMap.get(size.size_id);
        console.log(`Updating existing size ${sizeId} (${size.size_id})`);
        
        // No need to update anything since stock field has been removed
        // Just mark it as processed by removing from the map
        
        // Remove from map to track which ones to delete later
        existingSizeMap.delete(size.size_id);
      } else {
        // Add new size
        console.log(`Adding new size ${size.size_id}`);
        
        const { error: insertError } = await supabase
          .from("variant_sizes")
          .insert({
            variant_id: variantId,
            size_id: size.size_id // Menggunakan nama kolom yang benar di database
            // stock field has been removed from the database schema
          });
          
        if (insertError) {
          console.error(`Error adding new size ${size.size_id}:`, insertError);
        }
      }
    } catch (sizeError) {
      console.error(`Error processing size ${size.size_id}:`, sizeError);
    }
  }
  
  // Delete sizes that weren't included in the update
  if (existingSizeMap.size > 0) {
    const sizeIdsToDelete = Array.from(existingSizeMap.values());
    console.log(`Deleting ${sizeIdsToDelete.length} sizes that are no longer used:`, sizeIdsToDelete);
    
    const { error: deleteError } = await supabase
      .from("variant_sizes")
      .delete()
      .in("id", sizeIdsToDelete);
      
    if (deleteError) {
      console.error(`Error deleting sizes:`, deleteError);
    }
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to properly access its properties
    const { id } = await context.params;
    
    // No need to extract adminId if not using it
    // const adminId = request.headers.get("x-admin-id");
    
    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
      return Response.json({ error: productError.message }, { status: 500 });
    }
    
    // Get all variants for this product
    const { data: variants, error: getVariantsError } = await supabase
      .from("product_variants")
      .select("id")
      .eq("product_id", id);
      
    if (getVariantsError) {
      console.error('Error fetching variants for deletion:', getVariantsError);
    } else if (variants && variants.length > 0) {
      const variantIds = variants.map(v => v.id);
      console.log(`Deleting ${variantIds.length} variant sizes...`);
      
      // Delete variant sizes first
      const { error: sizesDeleteError } = await supabase
        .from("variant_sizes")
        .delete()
        .in("variant_id", variantIds);
        
      if (sizesDeleteError) {
        console.error('Error deleting variant sizes:', sizesDeleteError);
      }
      
      // Delete variants
      console.log(`Deleting ${variantIds.length} variants...`);
      const { error: variantsDeleteError } = await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", id);
        
      if (variantsDeleteError) {
        console.error('Error deleting variants:', variantsDeleteError);
      }
    }
    
    // Delete the product
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error('Error deleting product:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Product and associated data deleted successfully');
    return Response.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE handler:', error);
    return Response.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
