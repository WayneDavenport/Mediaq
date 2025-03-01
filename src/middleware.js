import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(request) {
    // Log the current path to help debug
    console.log("Middleware processing path:", request.nextUrl.pathname);

    // Make sure we're not interfering with the auth callback
    if (request.nextUrl.pathname.startsWith('/api/auth')) {
        console.log("Auth API route - passing through");
        return NextResponse.next();
    }

    // Auth check for user pages
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    });

    // Check if this is a new Google user that needs to complete their profile
    const isNewGoogleUser = token?.google_id && !token?.reading_speed;

    if (isNewGoogleUser && !request.nextUrl.pathname.startsWith('/auth-pages/complete-profile')) {
        return NextResponse.redirect(new URL("/auth-pages/complete-profile", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Make sure we're excluding auth API routes from middleware processing
        '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
        '/user-pages/:path*'
    ]
}; 