import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';
import { hashPassword } from '@/lib/auth';
import { getRandomCharacters } from '@/lib/nintendo-characters';

export async function POST(request) {
    try {
        // Check if user is authenticated and is an admin
        const session = await getServerSession(authOptions);

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { count = 5, prefix = 'nintendo' } = body;

        console.log('Creating test users with:', { count, prefix });

        // Validate input
        if (count < 1 || count > 20) {
            return NextResponse.json({ error: 'Count must be between 1 and 20' }, { status: 400 });
        }

        // Default password for all test users
        const password = 'Test123!';
        const hashedPassword = await hashPassword(password);

        // Get random Nintendo characters
        const characters = getRandomCharacters(count);
        console.log('Selected Nintendo characters:', characters);

        if (!characters || characters.length === 0) {
            console.error('No Nintendo characters returned');
            return NextResponse.json({ error: 'Failed to get Nintendo characters' }, { status: 500 });
        }

        // Create users
        const users = [];

        for (let i = 0; i < count; i++) {
            if (!characters[i]) {
                console.error(`No character at index ${i}`);
                continue;
            }

            const character = characters[i];
            // Create a username based on character name (remove spaces and special chars)
            const characterName = character.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
            const username = `${characterName}`;
            // Still use the prefix for email to keep them identifiable as test users
            const email = `${prefix}${i + 1}@testmail.io`;

            users.push({
                username,
                email,
                password: hashedPassword,
                is_verified: true, // Auto-verify test users
                first_name: character.name, // Use character name as first_name
                last_name: `(${character.franchise})`, // Use franchise as last_name
                reading_speed: 250 // Default reading speed
                // No bio field as it doesn't exist in the schema
            });
        }

        console.log('Users to be created:', users);

        if (users.length === 0) {
            return NextResponse.json({ error: 'No valid users to create' }, { status: 400 });
        }

        // Insert users in batches to avoid hitting limits
        const batchSize = 5;

        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);

            const { data, error } = await supabase
                .from('users')
                .upsert(batch, {
                    onConflict: 'email',
                    returning: 'minimal'
                });

            if (error) {
                console.error('Error creating test users batch:', error);
                throw error;
            }
        }

        // Fetch the created users to return their IDs
        const { data: createdUserData, error: fetchError } = await supabase
            .from('users')
            .select('id, username, email, first_name, last_name')
            .in('email', users.map(u => u.email));

        if (fetchError) {
            console.error('Error fetching created users:', fetchError);
            throw fetchError;
        }

        console.log('Created users:', createdUserData);

        return NextResponse.json({
            success: true,
            users: createdUserData || []
        });

    } catch (error) {
        console.error('Error creating test users:', error);
        return NextResponse.json({
            error: 'Failed to create test users',
            details: error.message
        }, { status: 500 });
    }
}