import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { sendVerificationEmail } from '@/lib/nodemailer';
import supabase from '@/lib/supabaseClient';

export async function POST(request) {
    try {
        const { email } = await request.json();

        // Get user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (user.is_verified) {
            return NextResponse.json(
                { error: 'Email is already verified' },
                { status: 400 }
            );
        }

        // Generate new verification token
        const verificationToken = nanoid();

        // Update user with new token
        const { error: updateError } = await supabase
            .from('users')
            .update({ verification_token: verificationToken })
            .eq('email', email);

        if (updateError) throw updateError;

        // Send new verification email
        await sendVerificationEmail(email, verificationToken);

        return NextResponse.json({
            message: 'Verification email sent successfully'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        return NextResponse.json(
            { error: 'Failed to resend verification email' },
            { status: 500 }
        );
    }
} 