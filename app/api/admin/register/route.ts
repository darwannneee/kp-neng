import { NextRequest } from 'next/server';
import supabase from '@/utils/supabase/client';
import { hash } from 'bcryptjs';

export async function PUT(request: NextRequest) {

  // Pastikan server bisa membaca request body
  try {
    const { adminId, newPassword } = await request.json();

    console.log("Updating password for adminId:", adminId);

    // Untuk keamanan, pastikan adminId dan password tersedia
    if (!adminId || !newPassword) {
      return Response.json({ error: "adminId dan newPassword diperlukan." }, { status: 400 });
    }

    // Hash password baru
    const hashedPassword = await hash(newPassword, 10);

    // Update password admin di database
    const { error } = await supabase
      .from("admins")
      .update({ password: hashedPassword })
      .eq("id", adminId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: "Tidak dapat memparsing data JSON" }, { status: 400 });
  }
}