import { NextRequest } from "next/server";
import supabase from "@/utils/supabase/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET: Get all banners
export async function GET() {
  try {
    const { data, error } = await supabase
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

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

// POST: Add a new banner
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { type, position, productId, title, subtitle, custom_text } = body;

    if (!type || !productId) {
      return NextResponse.json(
        { error: "Type and productId are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("banners")
      .insert([
        {
          type,
          position,
          product_id: productId,
          title,
          subtitle,
          custom_text,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { error: "Failed to create banner" },
      { status: 500 }
    );
  }
}

// PUT: Update a banner
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const { id, type, position, productId, title, subtitle, custom_text } = body;

    if (!id || !type || !productId) {
      return NextResponse.json(
        { error: "Id, type, and productId are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("banners")
      .update({
        type,
        position,
        product_id: productId,
        title,
        subtitle,
        custom_text,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { error: "Failed to update banner" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a banner
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Id is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("banners")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      { error: "Failed to delete banner" },
      { status: 500 }
    );
  }
} 