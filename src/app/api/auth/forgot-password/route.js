import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/sendGrid'; // Import the new email function

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key for elevated privileges
);

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ message: "Email is required" }, { status: 400 });
        }

        // Find the user by email
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('id, email') // Only select necessary fields
            .eq('email', email)
            .single();

        // If user not found OR there was an error (excluding specific expected errors if any),
        // return a generic success message to prevent email enumeration attacks.
        // Log the error internally if it's unexpected.
        if (findError && findError.code !== 'PGRST116') { // PGRST116: No rows found
            console.error("Error finding user for password reset:", findError);
            // Still return success to the client
            return NextResponse.json({ message: "If an account with this email exists, a password reset link has been sent." });
        }

        if (!user) {
            console.log(`Password reset requested for non-existent email: ${email}`);
            // Still return success to the client
            return NextResponse.json({ message: "If an account with this email exists, a password reset link has been sent." });
        }

        // Generate a secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex'); // Hash the token before storing

        // Set token expiry (e.g., 1 hour from now)
        const passwordResetExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

        // Update the user record with the hashed token and expiry
        // IMPORTANT: Ensure your 'users' table has 'password_reset_token' (TEXT) and 'password_reset_expires' (TIMESTAMPTZ) columns
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password_reset_token: passwordResetToken,
                password_reset_expires: passwordResetExpires
            })
            .eq('id', user.id);

        if (updateError) {
            console.error("Error updating user with reset token:", updateError);
            return NextResponse.json({ message: "Failed to initiate password reset. Please try again." }, { status: 500 });
        }

        // Send the password reset email (use the unhashed token in the link)
        try {
            await sendPasswordResetEmail(user.email, resetToken);
            return NextResponse.json({ message: "If an account with this email exists, a password reset link has been sent." });
        } catch (emailError) {
            console.error('Error sending password reset email:', emailError);
            // Optionally: Consider reverting the token update if email fails critically
            // await supabase.from('users').update({ password_reset_token: null, password_reset_expires: null }).eq('id', user.id);
            return NextResponse.json({ message: "Failed to send password reset email. Please try again." }, { status: 500 });
        }

    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ message: "An unexpected error occurred" }, { status: 500 });
    }
} 