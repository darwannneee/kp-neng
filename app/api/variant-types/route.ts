import { NextRequest } from 'next/server';
import supabase from '@/utils/supabase/client';

// Get all variant types (unique names from product_variants)
export async function GET() {
  const { data, error } = await supabase
    .from('product_variants')
    .select('name')
    .order('name');

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Get unique variant names
  const uniqueVariants = [...new Set(data.map(v => v.name))].map(name => ({
    id: name, // Use name as ID since we don't have a separate types table
    name: name
  }));

  return Response.json(uniqueVariants);
}

// Create a new variant type (will be added when creating product variants)
export async function POST(request: NextRequest) {
  const { name } = await request.json();

  if (!name) {
    return Response.json({ error: 'Name is required' }, { status: 400 });
  }

  // Since we don't have a separate variant_types table,
  // we'll just validate the name and return a success response
  // The actual variant will be created when adding product variants
  return Response.json({ id: name, name });
}

// Update is not needed since variants are managed with products

// Delete is not needed since variants are managed with products 