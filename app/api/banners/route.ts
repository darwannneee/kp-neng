import { NextResponse } from "next/server";
import supabase from "@/utils/supabase/client";

export async function GET() {
  try {
    const { data: banners, error } = await supabase
      .from("banners")
      .select(`
        *,
        product:products (
          id,
          name,
          image_url,
          category:categories (
            id,
            name
          )
        )
      `)
      .order("position", { ascending: true });

    if (error) throw error;

    return NextResponse.json(banners);
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
} 