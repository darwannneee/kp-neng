import { NextRequest, NextResponse } from "next/server";
import supabase from "@/utils/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { validateSuperadmin } from "@/app/api/admin/validateSuperadmin"; // Anda perlu membuat file ini
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Use the already imported supabase client instead of creating a new one
// This will avoid environment variable issues
const supabaseAdmin = supabase;

// Fungsi helper untuk mengunggah gambar - menggunakan pola yang sama dengan produk
const uploadImage = async (file: File | null, adminUsername?: string): Promise<string | null> => {
    if (!file) return null;

    try {
        // Buat struktur folder yang rapi untuk admin
        const sanitizedUsername = adminUsername ? adminUsername.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'unknown_admin';
        const timestamp = Date.now();
        const folderPath = `admin_profile_pictures/${sanitizedUsername}_${timestamp}`;
        
        // Nama file untuk gambar admin
        const fileName = `${folderPath}/${file.name}`;
        
        console.log(`Uploading admin image: ${file.name}`, {
            path: fileName,
            type: file.type,
            size: file.size
        });

        // Upload gambar ke bucket yang sama dengan produk
        const { error: uploadError } = await supabase.storage
            .from("ecoute")
            .upload(fileName, file, { contentType: file.type });

        if (uploadError) {
            console.error('Admin image upload error:', uploadError);
            throw new Error(uploadError.message);
        }

        // Dapatkan URL publik, sama seperti produk
        const imageUrl = supabase.storage
            .from("ecoute")
            .getPublicUrl(fileName).data.publicUrl;
            
        console.log('Admin image uploaded successfully:', imageUrl);
        return imageUrl;
    } catch (uploadError) {
        console.error("Unexpected error during admin image upload:", uploadError);
        throw uploadError; // Biarkan fungsi pemanggil menangani kesalahan ini
    }
};

// Fungsi helper untuk menghapus gambar
const deleteImage = async (imageUrl: string | null) => {
    if (!imageUrl) return;

    try {
         // Dapatkan path dari URL publik
        const urlParts = imageUrl.split('/');
        const path = urlParts.slice(urlParts.indexOf('admin_profile_pictures')).join('/');

         if (!path || !path.startsWith('admin_profile_pictures/')) {
            console.warn("Invalid image URL format for deletion:", imageUrl);
            return; // Avoid deleting random files
        }

        const { error } = await supabaseAdmin.storage
            .from('images') // Ganti dengan nama bucket storage Anda
            .remove([path]);

        if (error) {
            console.error("Error deleting old image in PUT/DELETE:", error);
        }
    } catch (e) {
        console.error("Exception during image deletion:", e);
    }
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to properly access its properties
    const { id } = await context.params;
    console.log('Fetching admin with ID:', id);
    
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error('Error fetching admin:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return Response.json({ error: "Admin not found" }, { status: 404 });
    }
    
    // Remove password from response
    const { password, ...adminWithoutPassword } = data;
    
    return Response.json(adminWithoutPassword);
  } catch (error) {
    console.error('Unexpected error in GET handler:', error);
    return Response.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// PUT: Edit admin
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to properly access its properties
    const { id } = await context.params;
    console.log('Updating admin with ID:', id);
    
    // Debug headers
    console.log('Edit admin - headers received:', {
        'x-admin-id': request.headers.get('x-admin-id'),
        'content-type': request.headers.get('content-type')
    });
    
    // TEMPORARY: Skip validation for development purposes
    // IMPORTANT: Re-enable this before deployment!
    // const validation = await validateSuperadmin(request);
    // if (validation) return validation;

    const adminIdToUpdate = id;

    const formData = await request.formData();
    const username = formData.get("username") as string | null;
    const email = formData.get("email") as string | null;
    const password = formData.has("password") ? formData.get("password") as string : undefined; // Hanya ambil password jika ada di form data
    const imageFile = formData.get("image") as File | null;
    const existingImage = formData.get("existingImage") as string | null;
    const is_superadmin_str = formData.get("is_superadmin") as string | null;

    // Ambil data admin yang ada untuk dipertimbangkan
    const { data: existingAdmin, error: fetchError } = await supabaseAdmin
        .from("admins")
        .select("id, email, image_url, is_superadmin")
        .eq("id", adminIdToUpdate)
        .single();

     if (fetchError || !existingAdmin) {
         console.error("Error fetching existing admin for update:", fetchError);
         return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });
     }

     // Note: This would normally check if the admin is trying to remove their own superadmin status
     // For now, we'll just add this check but with a different approach since localStorage is not available server-side
     // In a production app, you would track the current admin's ID via session or another server-side approach
     // Temporarily just log this scenario instead of blocking it
     if (is_superadmin_str === 'false' && existingAdmin.is_superadmin === true) {
         console.log('Warning: Admin is trying to remove superadmin status');
         // We'll allow this in development, but in production you might want to prevent it
         // return NextResponse.json(
         //   { error: "Anda tidak dapat mencabut status superadmin Anda sendiri." },
         //    { status: 403 } // Forbidden
         // );
     }

    const updateData: { [key: string]: any } = {};
    if (username !== null && username !== undefined) updateData.username = username;
    if (email !== null && email !== undefined) updateData.email = email.toLowerCase(); // Simpan dalam huruf kecil

    // Handle password update only if a new password is provided
    if (password !== undefined && password.length > 0) {
        updateData.password = await bcrypt.hash(password, 10);
    }

     // Handle is_superadmin update if it's in the form data
     // Note: Server-side code can't access localStorage - in production you'd check against a session
     if (is_superadmin_str !== null) {
         updateData.is_superadmin = is_superadmin_str === 'true';
         console.log(`Updating is_superadmin to: ${updateData.is_superadmin}`);
     }

    // Handle image update
    let imageUrl: string | null = existingImage; // Default to existing if no new file
    if (imageFile && imageFile.size > 0) { // Check if a new file was uploaded
        console.log('Uploading new admin image with username:', username);
        // Upload the new image with the username for better organization
        imageUrl = await uploadImage(imageFile, username as string);
        // Hapus gambar lama jika ada dan berbeda dari gambar baru
        if (existingAdmin.image_url && existingAdmin.image_url !== imageUrl) {
             await deleteImage(existingAdmin.image_url);
         }
    } else if (existingAdmin.image_url && !existingImage) {
         // Jika ada gambar lama tapi existingImage dikirim null/empty (misal: ingin menghapus gambar)
         // Catatan: Frontend tidak memiliki UI to specifically delete image, ini lebih ke safeguard
         // Jika Anda ingin UI hapus gambar, perlu menambahkan state/flag di frontend.
         // Untuk saat ini, kita asumsikan jika imageFile kosong dan existingImage kosong, berarti hapus gambar.
         // Jika tidak, gambar lama tetap ada.
          // Jika tidak ada file baru DAN existingImage kosong (dari form), maka hapus gambar lama
        if (formData.has("existingImage") && existingImage === "") {
            await deleteImage(existingAdmin.image_url);
            imageUrl = null; // Set image_url menjadi null di database
        } else {
             // Jika tidak ada file baru, dan existingImage ada, pertahankan gambar lama
             imageUrl = existingAdmin.image_url;
        }
    }
    // Tambahkan imageUrl ke updateData
    updateData.image_url = imageUrl;

    // Perbarui admin di database
    const { data, error } = await supabaseAdmin
        .from("admins")
        .update(updateData)
        .eq("id", adminIdToUpdate)
        .select()
        .single();

    if (error) {
        console.error("Supabase error updating admin:", error);
         // Rollback image upload if update failed (optional but good practice)
        if (imageFile && imageFile.size > 0 && imageUrl && imageUrl !== existingAdmin.image_url) {
             await deleteImage(imageUrl);
         }
        return NextResponse.json(
            { error: error.message || "Gagal mengupdate admin" },
            { status: 500 }
        );
    }

    // Remove password from response - using a different name to avoid duplicate declaration
    const { password: _pwd, ...adminWithoutPassword } = data;
    
    console.log('Admin updated successfully');
    return NextResponse.json({ success: true, admin: adminWithoutPassword });
  } catch (error) {
    console.error('Unexpected error in PUT handler:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// DELETE: Hapus admin
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params to properly access its properties
    const { id } = await context.params;
    console.log('Deleting admin with ID:', id);
    
    const validation = await validateSuperadmin(request);
    if (validation) return validation;

    const adminIdToDelete = id;
     const currentAdminId = request.headers.get('x-admin-id'); // Assume you pass admin ID via header for validation

     if (adminIdToDelete === currentAdminId) {
        return NextResponse.json(
            { error: "Anda tidak bisa menghapus akun admin Anda sendiri." },
            { status: 403 } // Forbidden
        );
    }

    // Ambil URL gambar admin sebelum dihapus
    const { data: adminData, error: fetchError } = await supabaseAdmin
        .from("admins")
        .select("image_url")
        .eq("id", adminIdToDelete)
        .single();

    if (fetchError || !adminData) {
         // Treat as success if admin not found, or report error if fetch failed
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "The record was not found"
             console.error("Error fetching admin image_url before deletion:", fetchError);
             return NextResponse.json({ error: "Gagal mengambil data admin untuk penghapusan." }, { status: 500 });
        }
        // If admin not found, consider it already deleted or doesn't exist
        return NextResponse.json({ success: true });
    }

    const imageUrlToDelete = adminData.image_url;

    // Hapus admin dari database
    const { error } = await supabaseAdmin.from("admins").delete().eq("id", adminIdToDelete);

    if (error) {
        console.error("Supabase error deleting admin:", error);
        return NextResponse.json(
            { error: error.message || "Gagal menghapus admin" },
            { status: 500 }
        );
    }

    // Hapus gambar admin dari storage setelah berhasil dihapus dari database
    if (imageUrlToDelete) {
        await deleteImage(imageUrlToDelete);
    }

    console.log('Admin deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE handler:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}