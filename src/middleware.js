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

    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    });

    // If no token (not logged in), allow the request to proceed
    if (!token) {
        return NextResponse.next();
    }

    // Check if this is a new user that needs to complete their profile
    const isNewUser = token?.isNewUser === true;

    // Only redirect to complete-profile if:
    // 1. User is new (isNewUser is true)
    // 2. User is not already on the complete-profile page
    // 3. User is not accessing an API route
    if (
        isNewUser &&
        !request.nextUrl.pathname.startsWith('/auth-pages/complete-profile') &&
        !request.nextUrl.pathname.startsWith('/api')
    ) {
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