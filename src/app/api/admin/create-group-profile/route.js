import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
    try {
        // Check if user is authenticated and is an admin
        const session = await getServerSession(authOptions);

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get group profile data from request
        const { username, email, password, first_name, last_name, reading_speed } = await request.json();

        // Validate input
        if (!username || !email || !password) {
            return NextResponse.json(
                { error: 'Username, email, and password are required.' },
                { status: 400 }
            );
        }

        // Check if username already exists
        const { data: existingUsername, error: usernameError } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single();

        if (existingUsername) {
            return NextResponse.json({ error: "Username already taken" }, { status: 400 });
        }

        // Check if email already exists
        const { data: existingEmail, error: emailError } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();

        if (existingEmail) {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }

        // Hash password using your existing hashPassword function
        const hashedPassword = await hashPassword(password);

        // Current timestamp for verified_at
        const now = new Date().toISOString();

        // Insert group profile into the database
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
                {
                    email,
                    password: hashedPassword,
                    username,
                    reading_speed: reading_speed || 0.666,
                    is_verified: true,
                    verified_at: now,
                    first_name: first_name || null,
                    last_name: last_name || null
                }
            ])
            .select()
            .single();

        if (insertError) {
            console.error("Error inserting group profile:", insertError);
            return NextResponse.json({ error: "Error creating group profile" }, { status: 500 });
        }

        // Return success response
        return NextResponse.json({
            success: true,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error('Error creating group profile:', error);
        return NextResponse.json(
            { error: 'Failed to create group profile: ' + error.message },
            { status: 500 }
        );
    }
}