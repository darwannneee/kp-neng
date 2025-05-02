import { NextRequest } from "next/server"
import supabase from "@/utils/supabase/client"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const formData = await request.formData()
  
  const name = formData.get("name") as string
  const colours = parseInt(formData.get("colours") as string)
  const price = formData.get("price") as string
  const description = formData.get("description") as string
  const image = formData.get("image") as File | null
  const existingImage = formData.get("existingImage") as string

  let imageUrl = existingImage

  if (image) {
    const fileName = `${Date.now()}-${image.name}`
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, image, { contentType: image.type })

    if (uploadError) return Response.json({ error: uploadError }, { status: 500 })

    imageUrl = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName).data.publicUrl
  }

  const { data, error } = await supabase
    .from("products")
    .update({ name, colours, price, description, image_url: imageUrl })
    .eq("id", params.id)
    .select("*, admin:admins(username)")
    .single()

  if (error) return Response.json({ error }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", params.id)

  if (error) return Response.json({ error }, { status: 500 })
  return Response.json({ success: true })
}