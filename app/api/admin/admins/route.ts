import { NextRequest, NextResponse } from "next/server";
import supabase from "@/utils/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { validateSuperadmin } from "@/app/api/admin/validateSuperadmin"; // Anda perlu membuat file ini
import bcrypt from 'bcryptjs'; // Digunakan untuk hashing password
import { v4 as uuidv4 } from 'uuid'; // Untuk membuat UUID unik

// Inisialisasi Supabase dengan kunci service_role untuk hak akses penuh
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
        console.error("Error uploading image:", error);
        throw new Error("Gagal mengunggah gambar.");
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
             // Log error but don't necessarily fail the whole operation
            console.error("Error deleting old image:", error);
        }
    } catch (e) {
        console.error("Exception during image deletion:", e);
    }
};


// GET: Ambil semua admin
export async function GET(req: NextRequest) {
    // Middleware ini bisa dipanggil di sini atau di middleware Next.js global
    const validation = await validateSuperadmin(req);
    if (validation) return validation; // Return response if not authorized

    try {
        const { data, error } = await supabaseAdmin.from("admins").select("*");

        if (error) {
            console.error("Supabase error fetching admins:", error);
            return NextResponse.json(
                { error: error.message || "Gagal mengambil data admin" },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("API error fetching admins:", err);
        return NextResponse.json(
            { error: "Terjadi kesalahan server" },
            { status: 500 }
        );
    }
}

// POST: Tambah admin baru
export async function POST(req: NextRequest) {
    const validation = await validateSuperadmin(req);
    if (validation) return validation;

    try {
        const formData = await req.formData();
        const username = formData.get("username") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const imageFile = formData.get("image") as File | null;
        const is_superadmin_str = formData.get("is_superadmin") as string;
        const is_superadmin = is_superadmin_str === 'true';

        if (!username || !email || !password) {
            return NextResponse.json(
                { error: "Username, email, dan password wajib diisi" },
                { status: 400 }
            );
        }
          // Validasi email format
          if (!/\S+@\S+\.\S+/.test(email)) {
            return NextResponse.json(
                { error: "Format email tidak valid" },
                { status: 400 }
            );
          }

        // Cek apakah email sudah ada (untuk mencegah duplikasi)
        const { count: existingAdminCount, error: checkError } = await supabaseAdmin
            .from("admins")
            .select("id", { count: 'exact' })
            .eq("email", email.toLowerCase());

        if (checkError) {
            console.error("Error checking existing email:", checkError);
             return NextResponse.json(
                { error: "Gagal memeriksa email yang sudah ada" },
                { status: 500 }
            );
        }
        if (existingAdminCount && existingAdminCount > 0) {
             return NextResponse.json(
                { error: "Email sudah terdaftar" },
                { status: 409 } // Conflict
            );
        }


        // Unggah gambar jika ada
        let imageUrl: string | null = null;
        if (imageFile) {
            imageUrl = await uploadImage(imageFile);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tambahkan admin ke database menggunakan service_role key
        const { data, error } = await supabaseAdmin.from("admins").insert([
            {
                username,
                email: email.toLowerCase(), // Simpan email dalam huruf kecil
                password: hashedPassword,
                image_url: imageUrl,
                is_superadmin: is_superadmin,
            },
        ]).select().single(); // Menggunakan select().single() untuk mendapatkan data admin yang baru ditambahkan

        if (error) {
            console.error("Supabase error adding admin:", error);
             // Hapus gambar yang diunggah jika insert gagal
            if (imageUrl) {
                await deleteImage(imageUrl);
            }
            return NextResponse.json(
                { error: error.message || "Gagal menambahkan admin" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, admin: data }, { status: 201 });

    } catch (err) {
         console.error("API error adding admin:", err);
        return NextResponse.json(
            { error: "Terjadi kesalahan server saat menambahkan admin" },
            { status: 500 }
        );
    }
}
