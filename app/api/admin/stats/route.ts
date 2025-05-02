// src/app/api/admin/stats/route.ts
// (Kode ini sama persis dengan yang diberikan di jawaban sebelumnya)

import { NextRequest, NextResponse } from "next/server";
import { validateSuperadmin } from "../validateSuperadmin"; // Digunakan untuk validasi jumlah admin

import supabase from "@/utils/supabase/client";

export async function GET(req: NextRequest) {
     const adminId = req.headers.get("x-admin-id"); // Ambil admin ID dari header

    try {
        // Fetch jumlah produk
        const { count: productCount, error: productError } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true });

        if (productError) {
            console.error("Error counting products:", productError);
             // Catat error tapi lanjutkan
        }

        // Fetch jumlah kategori
        const { count: categoryCount, error: categoryError } = await supabase
            .from("categories")
            .select("*", { count: "exact", head: true });

         if (categoryError) {
            console.error("Error counting categories:", categoryError);
         }

        let adminCount: number | null = null;
        //let isAdminSuperadmin = false; // Tidak perlu di response, cek di frontend menggunakan admin state

        // Cek apakah admin yang request adalah superadmin untuk menghitung jumlah admin
        if (adminId) {
            const validationResponse = await validateSuperadmin(req); // Panggil fungsi validasi
             if (validationResponse === null) { // validateSuperadmin mengembalikan null jika superadmin
                 //isAdminSuperadmin = true;
                  const { count: fetchedAdminCount, error: adminError } = await supabase
                      .from("admins")
                      .select("*", { count: "exact", head: true });

                  if (adminError) {
                      console.error("Error counting admins:", adminError);
                  } else {
                      adminCount = fetchedAdminCount;
                  }
             } else {
                // Jika error validasi, artinya bukan superadmin
                adminCount = null; // Jangan sertakan jumlah admin
                console.log(`Admin ${adminId} is not superadmin, admin count omitted.`);
             }
        } else {
             // Jika tidak ada adminId sama sekali
             adminCount = null;
             console.log("No admin ID provided, admin count omitted.");
        }


        const stats = {
            productCount: productCount, // Bisa null jika error
            categoryCount: categoryCount, // Bisa null jika error
            adminCount: adminCount, // Null jika bukan superadmin
        };

        return NextResponse.json(stats);

    } catch (err) {
        console.error("API error fetching dashboard stats:", err);
        return NextResponse.json(
            { error: "Terjadi kesalahan server saat mengambil statistik" },
            { status: 500 }
        );
    }
}