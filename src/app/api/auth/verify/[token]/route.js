import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function GET(request, { params }) {
    const { token } = params;

    try {
        // Update user verification status
        const { data, error } = await supabase
            .from('users')
            .update({
                is_verified: true,
                verified_at: new Date().toISOString(),
                verification_token: null  // Clear the token after use
            })
            .eq('verification_token', token)
            .select()
            .single();

        if (error) {
            console.error('Verification error:', error);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-pages/signin?error=invalid_token`);
        }

        if (!data) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-pages/signin?error=token_not_found`);
        }

        // Redirect to signin with success message
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-pages/signin?verificationSuccess=true`);
    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth-pages/signin?error=server_error`);
    }
} 