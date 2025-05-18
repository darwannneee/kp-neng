import { NextRequest, NextResponse } from "next/server";
import { validateSuperadmin } from "@/app/api/admin/validateSuperadmin"; // Anda perlu membuat file ini
import bcrypt from 'bcryptjs'; // Digunakan untuk hashing password
import { v4 as uuidv4 } from 'uuid'; // Untuk membuat UUID unik
import supabase from "@/utils/supabase/client";

// Fungsi helper untuk mengunggah gambar
const uploadImage = async (file: File | null): Promise<string | null> => {
    if (!file) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `admin_profile_pictures/${fileName}`;

    const { data, error } = await supabase.storage
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
    const { data: publicUrlData } = supabase.storage
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

        const { error } = await supabase.storage
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
export async function GET(request: NextRequest) {
  try {
    // Verify the session
    // const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    // if (sessionError || !sessionData.session) {
    //   return Response.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // const adminId = request.headers.get('x-admin-id');
    const adminId = request.headers.get('x-admin-id');
    
    if (!adminId) {
      return Response.json({ error: 'No admin ID provided' }, { status: 401 });
    }
    
    // Check if the requesting admin exists and is a superadmin
    const { data: requestingAdmin, error: adminError } = await supabase
      .from('admins')
      .select('is_superadmin')
      .eq('id', adminId)
      .single();
      
    if (adminError || !requestingAdmin) {
      return Response.json({ error: 'Admin not found' }, { status: 404 });
    }
    
    if (!requestingAdmin.is_superadmin) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Fetch all admins
    const { data: admins, error } = await supabase
      .from('admins')
      .select(`
        id, 
        username, 
        email, 
        is_superadmin, 
        created_at,
        created_by:admins!created_by_id(id, username)
      `);
      
    if (error) {
      console.error('Error fetching admins:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    return Response.json(admins);
  } catch (error) {
    console.error('Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
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
        const { count: existingAdminCount, error: checkError } = await supabase
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
        const { data, error } = await supabase.from("admins").insert([
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
