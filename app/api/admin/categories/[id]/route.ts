// src/app/api/admin/categories/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
// Gunakan Supabase Client API (kunci anon publik)
import supabase from "@/utils/supabase/client";


// PUT: Edit kategori (via API publik)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const categoryIdToUpdate = params.id;

    try {
        const { name } = await req.json();

         if (!name || typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json(
                { error: "Nama kategori wajib diisi dan berupa string" },
                { status: 400 }
            );
        }

         // Cek apakah nama kategori sudah ada, kecuali kategori yang sedang diedit
        const { count: existingCategoryCount, error: checkError } = await supabase
            .from("categories")
            .select("id", { count: 'exact' })
            .eq("name", name.trim())
            .neq("id", categoryIdToUpdate);

        if (checkError) {
             console.error("Error checking existing category name for update:", checkError);
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


        // Perbarui kategori di database
        const { data, error } = await supabase
            .from("categories")
            .update({ name: name.trim() })
            .eq("id", categoryIdToUpdate)
            .select()
            .single();


        if (error) {
            console.error("Supabase error updating category:", error);
            return NextResponse.json(
                { error: error.message || "Gagal mengupdate kategori" },
                { status: 500 }
            );
        }
         if (!data) {
             return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
        }


        return NextResponse.json({ success: true, category: data });

    } catch (err) {
        console.error("API error updating category:", err);
        return NextResponse.json(
            { error: "Terjadi kesalahan server saat mengupdate kategori" },
            { status: 500 }
        );
    }
}

// DELETE: Hapus kategori (via API publik)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const categoryIdToDelete = params.id;

    try {
        // Hapus kategori dari database
        const { error } = await supabase.from("categories").delete().eq("id", categoryIdToDelete);

        if (error) {
             if (error.code === '23503') { // PostgreSQL foreign key violation error code
                  return NextResponse.json(
                      { error: "Kategori ini tidak dapat dihapus karena masih digunakan oleh beberapa produk." },
                      { status: 409 }
                  );
              }
            console.error("Supabase error deleting category:", error);
            return NextResponse.json(
                { error: error.message || "Gagal menghapus kategori" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error("API error deleting category:", err);
        return NextResponse.json(
            { error: "Terjadi kesalahan server saat menghapus kategori" },
            { status: 500 }
        );
    }
}