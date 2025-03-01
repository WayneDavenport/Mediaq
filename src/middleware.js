import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(request) {
    // Skip middleware for API routes and static assets
    if (
        request.nextUrl.pathname.startsWith('/api') ||
        request.nextUrl.pathname.startsWith('/_next')
    ) {
        return NextResponse.next();
    }

    // Get the token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    });

    // If no token (not logged in), allow the request to proceed
    if (!token) {
        return NextResponse.next();
    }

    // Check if this is a new user that needs to complete their profile
    // Only redirect if isNewUser is explicitly true (not undefined or null)
    if (
        token.isNewUser === true &&
        request.nextUrl.pathname.startsWith('/user-pages') &&
        !request.nextUrl.pathname.startsWith('/auth-pages/complete-profile')
    ) {
        console.log("Redirecting new user to complete profile page");
        return NextResponse.redirect(new URL("/auth-pages/complete-profile", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
        '/user-pages/:path*'
    ]
}; 