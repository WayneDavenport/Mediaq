import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT handler to update notes for a specific media item
export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params; // Get the item ID from the URL path
    if (!id) {
        return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    try {
        const { notes } = await request.json();

        // Validate that notes exist in the body, even if it's an empty string
        if (notes === undefined || notes === null) {
            // Allow empty string, but not missing key
            return NextResponse.json({ error: 'Notes content is required in the request body' }, { status: 400 });
        }

        // Update the notes in the user_media_progress table
        // Ensure the update only happens for the correct user and item ID
        const { data, error } = await supabase
            .from('user_media_progress')
            .update({ notes: notes })
            .eq('id', id) // Match the media item ID
            .eq('user_id', session.user.id) // Match the logged-in user
            .select() // Optionally select the updated row to confirm
            .single(); // Expecting only one row to be updated

        if (error) {
            // Check if the error is because the item wasn't found for this user
            if (error.code === 'PGRST116') { // PostgREST error code for "No rows found"
                console.error(`Error updating notes: Item ID ${id} not found for user ${session.user.id}`);
                return NextResponse.json({ error: 'Media item not found or access denied' }, { status: 404 });
            }
            // Log other Supabase errors
            console.error('Supabase error updating notes:', error);
            throw error; // Re-throw other errors
        }

        // Check if data is returned (meaning the update was successful)
        if (!data) {
            console.warn(`No data returned after updating notes for Item ID ${id} and user ${session.user.id}, but no error was thrown. This might indicate the item didn't exist or didn't belong to the user.`);
            // Consider returning 404 even if no explicit error, as the condition wasn't met
            return NextResponse.json({ error: 'Media item not found or update failed' }, { status: 404 });
        }


        console.log(`Notes updated successfully for item ${id}`);
        return NextResponse.json({ success: true, updatedNotes: data.notes });

    } catch (error) {
        // Catch errors from request.json() or re-thrown Supabase errors
        console.error('Error processing PUT request for notes:', error);
        return NextResponse.json(
            { error: 'Failed to update notes' },
            { status: 500 }
        );
    }
} 