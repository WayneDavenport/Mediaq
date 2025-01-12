import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust the import path

export async function requireAuth(req) {
    const session = await getServerSession(req, authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Assuming the session object contains the username
    req.user = {
        id: session.user.id,
        email: session.user.email,
        username: session.user.username // Include username from session
    };

    console.log("User authenticated:", req.user); // Debug log

    return NextResponse.next();
}