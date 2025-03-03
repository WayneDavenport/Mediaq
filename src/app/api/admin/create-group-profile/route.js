import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@vercel/postgres';

export async function POST(request) {
    try {
        // Verify admin authorization
        const session = await getServerSession(authOptions);
        if (!session?.user?.isAdmin) {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            );
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
        const usernameCheck = await sql`
            SELECT id FROM users WHERE username = ${username}
        `;

        if (usernameCheck.rowCount > 0) {
            return NextResponse.json(
                { error: 'Username already exists.' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const emailCheck = await sql`
            SELECT id FROM users WHERE email = ${email}
        `;

        if (emailCheck.rowCount > 0) {
            return NextResponse.json(
                { error: 'Email already exists.' },
                { status: 400 }
            );
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Current timestamp for verified_at
        const now = new Date();

        // Create the user in the database with pre-verified status
        const result = await sql`
            INSERT INTO users (
                email, 
                password, 
                username, 
                reading_speed, 
                is_verified, 
                verified_at,
                first_name,
                last_name
            )
            VALUES (
                ${email}, 
                ${hashedPassword}, 
                ${username}, 
                ${reading_speed || 0.666}, 
                ${true}, 
                ${now},
                ${first_name || null},
                ${last_name || null}
            )
            RETURNING id, username, email
        `;

        // Return success response
        return NextResponse.json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating group profile:', error);
        return NextResponse.json(
            { error: 'Failed to create group profile: ' + error.message },
            { status: 500 }
        );
    }
} 