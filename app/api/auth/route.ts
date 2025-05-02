import { NextRequest } from "next/server"
import supabase from "@/utils/supabase/client"

export async function POST(request: { json: () => PromiseLike<{ email: any; password: any }> | { email: any; password: any } }) {
  const { email, password } = await request.json()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) return Response.json({ error }, { status: 401 })
  return Response.json(data)
}