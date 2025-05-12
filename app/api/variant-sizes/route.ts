import { NextRequest } from 'next/server';
import supabase from '@/utils/supabase/client';

// Get all sizes
export async function GET() {
  const { data, error } = await supabase
    .from('variant_sizes')
    .select('id, size_id')
    .order('size_id');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Transform to match expected format
  const sizes = data.map(item => ({
    id: item.id,
    name: item.size_id
  }));

  return Response.json(sizes);
}

// Add a new size
export async function POST(request: NextRequest) {
  const { name } = await request.json();

  if (!name) {
    return Response.json({ error: 'Size name is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('variant_sizes')
    .insert({ size_id: name })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    id: data.id,
    name: data.size
  });
}

// Update a size
export async function PUT(request: NextRequest) {
  const { id, name } = await request.json();

  if (!id || !name) {
    return Response.json({ error: 'ID and size name are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('variant_sizes')
    .update({ size_id: name })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    id: data.id,
    name: data.size
  });
}

// Delete a size
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return Response.json({ error: 'ID is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('variant_sizes')
    .delete()
    .eq('id', id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
} 