// src/app/api/validateSuperadmin.ts
import { NextRequest, NextResponse } from "next/server";
import supabase from "@/utils/supabase/client";

export async function validateSuperadmin(req: NextRequest): Promise<NextResponse | null> {
    const adminId = req.headers.get("x-admin-id"); // Asumsikan ID admin dikirim via header

    if (!adminId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from("admins")
            .select("is_superadmin")
            .eq("id", adminId)
            .single();

        if (error || !data || !data.is_superadmin) {
             // Jika data tidak ada, ada error, atau is_superadmin false
            return NextResponse.json({ error: "Forbidden: Not a superadmin" }, { status: 403 });
        }

        // Lewatkan ke route handler jika validasi sukses
        return null;

    } catch (err) {
        console.error("Error validating superadmin:", err);
        return NextResponse.json({ error: "Internal Server Error during validation" }, { status: 500 });
    }
}