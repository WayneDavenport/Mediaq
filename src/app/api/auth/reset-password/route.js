import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key
);

// Simple password complexity check (mirror frontend validation)
const isPasswordValid = (password) => {
    if (!password || password.length < 8) return false;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return hasUppercase && hasLowercase && hasNumber && hasSpecial;
};

export async function POST(request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ message: "Token and password are required", error: "Missing input" }, { status: 400 });
        }

        // Validate password complexity on the server-side as well
        if (!isPasswordValid(password)) {
            return NextResponse.json({
                message: "Password does not meet complexity requirements (min 8 chars, upper, lower, number, special).",
                error: "Password validation failed"
            }, { status: 400 });
        }

        // Hash the token received from the client to match the stored token
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find the user by the hashed reset token
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('id, password_reset_expires')
            .eq('password_reset_token', hashedToken)
            // Ensure the token hasn't expired
            .gte('password_reset_expires', new Date().toISOString())
            .single();

        if (findError || !user) {
            console.error("Error finding user by reset token or token invalid/expired:", findError);
            return NextResponse.json({ message: "Invalid or expired password reset link.", error: "Invalid or expired token" }, { status: 400 });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password and clear the reset token fields
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password: hashedPassword,
                password_reset_token: null, // Clear the token
                password_reset_expires: null // Clear the expiry
            })
            .eq('id', user.id);

        if (updateError) {
            console.error("Error updating user password:", updateError);
            return NextResponse.json({ message: "Failed to update password. Please try again.", error: "Database update error" }, { status: 500 });
        }

        // Password successfully reset
        return NextResponse.json({ message: "Password has been reset successfully." });

    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ message: "An unexpected error occurred", error: "Server error" }, { status: 500 });
    }
} 