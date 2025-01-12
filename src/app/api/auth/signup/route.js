// src/app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import { hashPassword } from "@/lib/auth";
import supabase from "@/lib/supabaseClient";

export async function POST(request) {
    try {
        // Parse the request body
        const body = await request.json();
        const { email, password, username, reading_speed } = body;

        if (!email || !email.includes('@') || !password || password.trim().length < 7 || !username) {
            return NextResponse.json(
                { message: 'Invalid input - password should be at least 7 characters long, and username is required.' },
                { status: 422 }
            );
        }

        // Basic validation for username
        const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
        if (!usernameRegex.test(username)) {
            return NextResponse.json(
                { message: 'Invalid username - must be 3-15 characters long and can only contain letters, numbers, and underscores.' },
                { status: 422 }
            );
        }

        const hashedPassword = await hashPassword(password);

        // First check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { message: 'User already exists' },
                { status: 400 }
            );
        }

        // Create the user
        const { data: user, error } = await supabase
            .from('users')
            .insert([
                {
                    email,
                    password: hashedPassword,
                    username,
                    reading_speed: reading_speed || 20,
                }
            ])
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json(
            { message: 'Created user!' },
            { status: 201 }
        );

    } catch (error) {
        console.error("Failed to create user:", error);
        return NextResponse.json(
            { message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}