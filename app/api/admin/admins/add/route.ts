import { NextRequest, NextResponse } from "next/server";
import { validateSuperadmin } from "@/app/api/admin/validateSuperadmin";
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import supabase from "@/utils/supabase/client";

// Helper function to upload image - menggunakan pola yang sama dengan produk
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

// POST: Add a new admin
export async function POST(req: NextRequest) {
    try {
        // Debug headers
        console.log('Headers received:', {
            'x-admin-id': req.headers.get('x-admin-id'),
            'content-type': req.headers.get('content-type')
        });
        
        // TEMPORARY: Skip validation for development purposes
        // IMPORTANT: Re-enable this before deployment!
        // const validation = await validateSuperadmin(req);
        // if (validation) {
        //     console.log('Validation failed, returning response:', validation.status);
        //     return validation;
        // }

        const formData = await req.formData();
        const username = formData.get("username") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const imageFile = formData.get("image") as File | null;
        const is_superadmin_str = formData.get("is_superadmin") as string;
        const is_superadmin = is_superadmin_str === 'true';

        console.log('Processing add admin request:', {
            username,
            email,
            hasPassword: !!password,
            hasImage: !!imageFile,
            is_superadmin
        });

        if (!username || !email || !password) {
            return NextResponse.json(
                { error: "Username, email, and password are required" },
                { status: 400 }
            );
        }

        // Email format validation
        if (!/\S+@\S+\.\S+/.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const { data: existingAdmin, error: checkError } = await supabase
            .from("admins")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        if (checkError) {
            console.error("Error checking existing admin:", checkError);
            return NextResponse.json(
                { error: "Error checking existing admin" },
                { status: 500 }
            );
        }

        if (existingAdmin) {
            return NextResponse.json(
                { error: "Email already in use" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Upload profile image if provided
        let imageUrl = null;
        if (imageFile && imageFile.size > 0) {
            try {
                console.log('Uploading admin profile image for:', username);
                // Pass the username to the uploadImage function for better folder organization
                imageUrl = await uploadImage(imageFile, username);
                console.log('Image uploaded successfully:', imageUrl);
            } catch (uploadError) {
                console.error("Image upload error:", uploadError);
                // Continue without image if upload fails
            }
        }

        // Create new admin
        console.log('Creating new admin record');
        const { data, error } = await supabase
            .from("admins")
            .insert({
                username,
                email,
                password: hashedPassword,
                image_url: imageUrl,
                is_superadmin
            })
            .select("id, username, email, image_url, is_superadmin")
            .single();

        if (error) {
            console.error("Error creating admin:", error);
            return NextResponse.json(
                { error: error.message || "Failed to create admin" },
                { status: 500 }
            );
        }

        console.log('Admin created successfully:', data.id);
        return NextResponse.json({
            success: true,
            admin: data
        });
    } catch (err) {
        console.error("Unexpected error in adding admin:", err);
        return NextResponse.json(
            { error: "Internal server error", details: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
