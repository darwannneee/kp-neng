import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/utils/supabase/client';

// Get all sizes
export async function GET(request: NextRequest) {
  try {
    // Optional: Validate admin role if needed for fetching list
    // const adminId = request.headers.get('x-admin-id');
    // if (!adminId) {
    //    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    // // Add logic here to check if adminId is valid or is superadmin if access control is needed

    // Select from the 'sizes' table and include the creator's info via relationship
    const { data: sizes, error } = await supabase
      .from('sizes')
      .select(`
        id,
        name,
        created_at,
        created_by:admins!created_by_id(id, username, image_url) // Include profile image
      `)
      .order('name'); // Order alphabetically

    if (error) {
      console.error('Error fetching sizes from sizes table:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Fetched sizes from sizes table:', sizes);
    return NextResponse.json(sizes);

  } catch (error) {
    console.error('Unexpected error in GET /api/variant-sizes:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add a new size
export async function POST(request: NextRequest) {
  try {
    // Get admin ID from header for created_by_id
    const adminId = request.headers.get('x-admin-id');
     if (!adminId) {
       return NextResponse.json({ error: 'Unauthorized: Admin ID missing' }, { status: 401 });
    }
    // Optional: Add logic here to check if adminId is valid or is superadmin

    const { name } = await request.json(); // Expect 'name' in the body

    // Validate the input
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Size name is required and must be a non-empty string' }, { status: 400 });
    }

    // Check if a size with this name already exists (unique constraint check)
     const { count, error: countError } = await supabase
       .from('sizes')
       .select('id', { count: 'exact' })
       .eq('name', name.trim());

     if (countError) {
        console.error('Error checking existing size name:', countError);
        return NextResponse.json({ error: 'Failed to check existing size name' }, { status: 500 });
     }

     if (count && count > 0) {
        return NextResponse.json({ error: `Ukuran dengan nama '${name.trim()}' sudah ada.` }, { status: 409 }); // Conflict
     }


    // Insert the new size into the 'sizes' table
    const { data, error } = await supabase
      .from('sizes')
      .insert({
        name: name.trim(), // Insert the validated name
        created_by_id: adminId // Set the creator ID
      })
      .select(`
         id,
         name,
         created_at,
         created_by:admins!created_by_id(id, username, image_url) // Include profile image
      `)
      .single(); // Expecting a single row back

    if (error) {
      console.error('Error inserting size into sizes table:', error);
       // Check for unique constraint violation error specifically if not caught before insert
       if (error.code === '23505') { // PostgreSQL unique violation error code
           return NextResponse.json({ error: `Ukuran dengan nama '${name.trim()}' sudah ada.` }, { status: 409 }); // Conflict
       }
      return NextResponse.json({ error: error.message || 'Gagal menambahkan ukuran' }, { status: 500 });
    }

    console.log('Size added successfully:', data);
    return NextResponse.json(data, { status: 201 }); // Return the created size object

  } catch (error) {
    console.error('Unexpected error in POST /api/variant-sizes:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update a size
export async function PUT(request: NextRequest) {
  try {
    // Optional: Validate admin role if needed
     const adminId = request.headers.get('x-admin-id');
     if (!adminId) {
       return NextResponse.json({ error: 'Unauthorized: Admin ID missing' }, { status: 401 });
    }
    // Optional: Add logic here to check if adminId is valid or is superadmin

    const { id, name } = await request.json(); // Expect 'id' and 'name' in the body

    // Validate the inputs
    if (!id || typeof id !== 'string' || !name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'ID and a valid size name are required' }, { status: 400 });
    }

     // Optional: Check if a size with this name already exists, excluding the current size being updated
     const { count, error: countError } = await supabase
       .from('sizes')
       .select('id', { count: 'exact' })
       .eq('name', name.trim())
       .neq('id', id); // Exclude the current size ID

     if (countError) {
        console.error('Error checking existing size name for update:', countError);
        return NextResponse.json({ error: 'Failed to check existing size name' }, { status: 500 });
     }

     if (count && count > 0) {
        return NextResponse.json({ error: `Ukuran dengan nama '${name.trim()}' sudah ada.` }, { status: 409 }); // Conflict
     }


    // Update the size in the 'sizes' table
    const { data, error } = await supabase
      .from('sizes')
      .update({ name: name.trim() }) // Update the 'name' column
      .eq('id', id) // Where id matches
      .select(`
        id,
        name,
        created_at,
        created_by:admins!created_by_id(id, username, image_url) // Include profile image
      `)
      .single(); // Expecting the updated row back

    if (error) {
      console.error('Error updating size in sizes table:', error);
      // Check for unique constraint violation error specifically if not caught before update
       if (error.code === '23505') { // PostgreSQL unique violation error code
           return NextResponse.json({ error: `Ukuran dengan nama '${name.trim()}' sudah ada.` }, { status: 409 }); // Conflict
       }
      return NextResponse.json({ error: error.message || 'Gagal memperbarui ukuran' }, { status: 500 });
    }

    // Handle case where no row was found with the given ID
    if (!data) {
         return NextResponse.json({ error: 'Ukuran tidak ditemukan.' }, { status: 404 });
    }

    console.log('Size updated successfully:', data);
    return NextResponse.json(data); // Return the updated size object

  } catch (error) {
    console.error('Unexpected error in PUT /api/variant-sizes:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete a size
export async function DELETE(request: NextRequest) {
  try {
    // Optional: Validate admin role if needed
     const adminId = request.headers.get('x-admin-id');
     if (!adminId) {
       return NextResponse.json({ error: 'Unauthorized: Admin ID missing' }, { status: 401 });
    }
    // Optional: Add logic here to check if adminId is valid or is superadmin


    // Get ID from request body (matching frontend expectation)
    const { id } = await request.json();
    console.log('Extracted ID from body for DELETE:', id);

    if (!id || typeof id !== 'string') { // Validate ID
      console.log('Invalid or no ID provided in DELETE request body');
      return NextResponse.json({ error: 'A valid ID is required for deletion' }, { status: 400 });
    }

    // Log the ID for debugging
    console.log('Attempting to delete size with ID:', id);

    // Delete the size from the 'sizes' table
    const { error } = await supabase
      .from('sizes')
      .delete()
      .eq('id', id); // Where id matches

    if (error) {
      console.error('Error deleting size from sizes table:', error);
      // Check for foreign key constraint error specifically
      if (error.code === '23503') { // PostgreSQL FK violation error code
         return NextResponse.json({ error: 'Ukuran ini tidak dapat dihapus karena masih digunakan oleh varian produk lain. Harap hapus varian produk yang menggunakan ukuran ini terlebih dahulu.' }, { status: 409 }); // Conflict
      }
      return NextResponse.json({ error: error.message || 'Gagal menghapus ukuran' }, { status: 500 }); // Generic error
    }

    console.log('Size deleted successfully:', id);
    return NextResponse.json({ success: true, id: id }); // Return success and deleted ID

  } catch (error) {
    console.error('Unexpected error in DELETE /api/variant-sizes:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 