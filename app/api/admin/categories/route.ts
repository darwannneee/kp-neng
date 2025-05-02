// src/app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
// Gunakan Supabase Client API (kunci anon publik), tunduk pada RLS jika diaktifkan
import supabase from "@/utils/supabase/client";


// GET: Ambil semua kategori dari Supabase (via API publik)
export async function GET(req: NextRequest) {
    try {
        // Fetch data kategori dari Supabase
        const { data, error } = await supabase.from("categories").select("*").order('name', { ascending: true });

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
        const { name } = await req.json();

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json(
                { error: "Nama kategori wajib diisi dan berupa string" },
                { status: 400 }
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
            { name: name.trim() },
        ]).select().single();


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