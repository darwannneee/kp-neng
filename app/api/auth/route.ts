// import { NextRequest } from "next/server"
import { NextRequest } from "next/server"
import supabase from "@/utils/supabase/client"

interface AuthCredentials {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  const { email, password } = await request.json() as AuthCredentials
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) return Response.json({ error }, { status: 401 })
  return Response.json(data)
}