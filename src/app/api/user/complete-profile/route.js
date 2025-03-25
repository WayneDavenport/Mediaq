import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import supabase from "@/lib/supabaseClient";

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { username, reading_speed } = await request.json();

        // Validate the data
        if (!username || !reading_speed) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Update user profile in Supabase
        const { error } = await supabase
            .from('users')
            .update({
                username,
                reading_speed,
            })
            .eq('email', session.user.email);

        if (error) {
            console.error("Supabase update error:", error);
            return NextResponse.json(
                { error: "Failed to update profile" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "Profile updated successfully"
        });
    } catch (error) {
        console.error("Profile completion error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 