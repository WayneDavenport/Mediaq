// src/app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { hashPassword } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/nodemailer';
import supabase from '@/lib/supabaseClient';

export async function POST(request) {
    try {
        const { email, password, username, reading_speed } = await request.json();

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            );
        }

        // Generate verification token and hash password
        const verificationToken = nanoid();
        const hashedPassword = await hashPassword(password);

        // Create user
        const { error: createError } = await supabase
            .from('users')
            .insert([
                {
                    email,
                    password: hashedPassword,
                    username,
                    reading_speed,
                    verification_token: verificationToken,
                    is_verified: false
                }
            ]);

        if (createError) {
            console.error('Error creating user:', createError);
            throw createError;
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

            throw new Error('Failed to send verification email');
        }

        return NextResponse.json({
            message: 'User created successfully. Please check your email to verify your account.'
        });

    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create user' },
            { status: 500 }
        );
    }
}