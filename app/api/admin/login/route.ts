import { NextRequest } from "next/server"
import supabase from "@/utils/supabase/client";
import { compare } from "bcryptjs"

export async function POST(request: NextRequest) {
  const { username, email, password } = await request.json();

  // Cari admin berdasarkan username atau email
  const { data: admin, error } = await supabase
    .from("admins")
    .select("*")
    .or(`username.eq.${username},email.eq.${email}`)
    .single();

  // Tangani kesalahan jika admin tidak ditemukan
  if (error) {
    return Response.json({ error: "Invalid credentials or user not found" }, { status: 401 });
  }

  // Bandingkan password
  const passwordMatch = await compare(password, admin.password);
  if (!passwordMatch) {
    return Response.json({ error: "Invalid credentials or password wrong" }, { status: 401 });
  }

  // Simpan session admin (gunakan cookies atau localStorage)
  return Response.json({ success: true, adminId: admin.id });
}