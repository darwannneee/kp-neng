// src/app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
// Gunakan Supabase Client API (kunci anon publik), tunduk pada RLS jika diaktifkan
import supabase from "@/utils/supabase/client";


// GET: Ambil semua kategori dari Supabase (via API publik)
export async function GET(req: NextRequest) {
    try {
        // Check if we need to include admin info
        const includeAdmin = req.nextUrl.searchParams.get('include') === 'admin';
        
        // Fetch data kategori dari Supabase - with join to admins if needed
        const query = includeAdmin
            ? supabase.from("categories").select(`
                *,
                created_by:admins!created_by_id (
                  id,
                  username,
                  image_url
                )
              `)
            : supabase.from("categories").select("*");
            
        const { data, error } = await query.order('name', { ascending: true });

        if (error) {
            console.error("Supabase error fetching categories:", error);
            return NextResponse.json(
                { error: error.message || "Gagal mengambil data kategori" },
                { status: 500 }
            );
        }
         if (!data) {
             return NextResponse.json([], { status: 200 });
         }

        return NextResponse.json(data);
    } catch (err) {
        console.error("API error fetching categories:", err);
        return NextResponse.json(
            { error: "Terjadi kesalahan server saat mengambil kategori" },
            { status: 500 }
        );
    }
}


// POST: Tambah kategori baru (via API publik)
export async function POST(req: NextRequest) {
    try {
        const { name, admin_id } = await req.json();

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json(
                { error: "Nama kategori wajib diisi dan berupa string" },
                { status: 400 }
            );
        }
        
        // Get admin ID from request body or header
        const created_by_id = admin_id || req.headers.get('x-admin-id');
        
        if (!created_by_id) {
            return NextResponse.json(
                { error: "Admin ID diperlukan untuk membuat kategori" },
                { status: 401 }
            );
        }

         // Cek apakah nama kategori sudah ada
        const { count: existingCategoryCount, error: checkError } = await supabase
            .from("categories")
            .select("id", { count: 'exact' })
            .eq("name", name.trim());

        if (checkError) {
             console.error("Error checking existing category name:", checkError);
             return NextResponse.json(
                 { error: "Gagal memeriksa nama kategori yang sudah ada" },
                 { status: 500 }
             );
         }

         if (existingCategoryCount && existingCategoryCount > 0) {
             return NextResponse.json(
                 { error: "Nama kategori sudah ada" },
                 { status: 409 } // Conflict
             );
         }


        // Tambahkan kategori ke database
        const { data, error } = await supabase.from("categories").insert([
            { 
                name: name.trim(),
                created_by_id: created_by_id // Add creator ID 
            },
        ]).select(`
            *,
            created_by:admins!created_by_id (
              id,
              username,
              image_url
            )
        `).single();


        if (error) {
            console.error("Supabase error adding category:", error);
            return NextResponse.json(
                { error: error.message || "Gagal menambahkan kategori" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, category: data }, { status: 201 });

    } catch (err) {
         console.error("API error adding category:", err);
        return NextResponse.json(
            { error: "Terjadi kesalahan server saat menambahkan kategori" },
            { status: 500 }
        );
    }
}