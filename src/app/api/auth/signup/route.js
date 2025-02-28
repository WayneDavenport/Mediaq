// src/app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/sendGrid';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const { email, password, firstName, lastName, username } = await request.json();

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${email},username.eq.${username}`)
            .single();

        if (existingUser) {
            if (existingUser.email === email) {
                return NextResponse.json({ message: "Email already in use" }, { status: 400 });
            }
            if (existingUser.username === username) {
                return NextResponse.json({ message: "Username already taken" }, { status: 400 });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Insert new user
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
                {
                    email,
                    password: hashedPassword,
                    first_name: firstName,
                    last_name: lastName,
                    username,
                    is_verified: false,
                    verification_token: verificationToken,
                }
            ])
            .select()
            .single();

        if (insertError) {
            console.error("Error inserting user:", insertError);
            return NextResponse.json({ message: "Error creating user" }, { status: 500 });
        }

        // Send verification email
        try {
            await sendVerificationEmail(email, verificationToken);
        } catch (emailError) {
            console.error('Error sending verification email:', emailError);

            // Delete the user if email sending fails
            await supabase
                .from('users')
                .delete()
                .eq('email', email);

            return NextResponse.json(
                { message: "Failed to send verification email. Please try again." },
                { status: 500 }
            );
        }

        // Return success with redirect URL to verification pending page
        return NextResponse.json({
            message: "User registered successfully. Please check your email to verify your account.",
            redirectUrl: `/auth-pages/verification-pending?email=${encodeURIComponent(email)}`
        });

    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json({ message: "An unexpected error occurred" }, { status: 500 });
    }
}