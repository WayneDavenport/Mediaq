import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';
import { sendWelcomeEmail } from '@/lib/sendGrid';

export async function GET(request, { params }) {
    try {
        const token = params.token;

        if (!token) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-pages/signin?error=invalid_token`);
        }

        // Find user with this verification token
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('verification_token', token)
            .single();

        if (error || !user) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-pages/signin?error=invalid_token`);
        }

        if (user.is_verified) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-pages/signin?message=already_verified`);
        }

        // Update user as verified
        const { error: updateError } = await supabase
            .from('users')
            .update({
                is_verified: true,
                verification_token: null,
                verified_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            console.error("Error verifying user:", updateError);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-pages/signin?error=verification_failed`);
        }

        // Send welcome email
        try {
            await sendWelcomeEmail(user.email, user.username || user.first_name);
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // Continue even if welcome email fails
        }

        // Redirect to signin with success message
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-pages/signin?message=verification_success`);
    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-pages/signin?error=server_error`);
    }
} 