import { NextRequest, NextResponse } from "next/server";
import supabase from "@/utils/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { validateSuperadmin } from "@/app/api/admin/validateSuperadmin"; // Anda perlu membuat file ini
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Inisialisasi Supabase dengan kunci service_role
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Gunakan service_role key
);

// Fungsi helper untuk mengunggah gambar
const uploadImage = async (file: File | null): Promise<string | null> => {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `admin_profile_pictures/${fileName}`;

    const { data, error } = await supabaseAdmin.storage
        .from('images') // Ganti dengan nama bucket storage Anda jika berbeda
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
         console.error("Error uploading image in PUT/DELETE:", error);
         throw new Error(error.message || "Gagal mengunggah gambar.");
    }

    // Dapatkan URL publik
    const { data: publicUrlData } = supabaseAdmin.storage
        .from('images') // Ganti dengan nama bucket storage Anda jika berbeda
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
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


// PUT: Edit admin
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const validation = await validateSuperadmin(req);
    if (validation) return validation;

    const adminIdToUpdate = params.id;

    try {
        const formData = await req.formData();
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

         if (adminIdToUpdate === localStorage.getItem("adminId") && is_superadmin_str === 'false' && existingAdmin.is_superadmin === true) {
             // Check if the current admin is trying to remove their own superadmin status
              return NextResponse.json(
                { error: "Anda tidak dapat mencabut status superadmin Anda sendiri." },
                 { status: 403 } // Forbidden
            );
         }


        const updateData: { [key: string]: any } = {};
        if (username !== null && username !== undefined) updateData.username = username;
        if (email !== null && email !== undefined) updateData.email = email.toLowerCase(); // Simpan dalam huruf kecil

        // Handle password update only if a new password is provided
        if (password !== undefined && password.length > 0) {
            updateData.password = await bcrypt.hash(password, 10);
        }

         // Handle is_superadmin update only if it's in the form data and not the current admin
         if (is_superadmin_str !== null && adminIdToUpdate !== localStorage.getItem("adminId")) {
             updateData.is_superadmin = is_superadmin_str === 'true';
         }


        // Handle image update
        let imageUrl: string | null = existingImage; // Default to existing if no new file
        if (imageFile && imageFile.size > 0) { // Check if a new file was uploaded
            // Unggah gambar baru
            imageUrl = await uploadImage(imageFile);
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

        return NextResponse.json({ success: true, admin: data });

    } catch (err: any) {
        console.error("API error updating admin:", err);
        return NextResponse.json(
            { error: "Terjadi kesalahan server saat mengupdate admin: " + err.message },
            { status: 500 }
        );
    }
}

// DELETE: Hapus admin
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const validation = await validateSuperadmin(req);
    if (validation) return validation;

    const adminIdToDelete = params.id;
     const currentAdminId = req.headers.get('x-admin-id'); // Assume you pass admin ID via header for validation

     if (adminIdToDelete === currentAdminId) {
        return NextResponse.json(
            { error: "Anda tidak bisa menghapus akun admin Anda sendiri." },
            { status: 403 } // Forbidden
        );
    }


    try {

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

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error("API error deleting admin:", err);
        return NextResponse.json(
            { error: "Terjadi kesalahan server saat menghapus admin: " + err.message },
            { status: 500 }
        );
    }
}