import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(request) {
    // Log the request for debugging
    console.log('Middleware Request:', {
        path: request.nextUrl.pathname,
        hasSessionCookie: !!request.cookies.get('next-auth.session-token'),
        hasSecureSessionCookie: !!request.cookies.get('__Secure-next-auth.session-token')
    });

    // Protected routes that require authentication
    const protectedPaths = [
        '/user-pages',
        '/api/media-items'
    ];

    const isProtectedPath = protectedPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
    );

    // Get the token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    });

    console.log('Token in middleware:', {
        exists: !!token,
        email: token?.email,
        isNewUser: token?.isNewUser
    });

    // Handle protected routes
    if (isProtectedPath && !token) {
        console.log('Unauthorized access attempt:', request.nextUrl.pathname);

        // If it's an API route, return 401
        if (request.nextUrl.pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // For page routes, redirect to login
        return NextResponse.redirect(new URL('/auth-pages/signin', request.url));
    }

    // Handle new user flow
    if (token?.isNewUser === true &&
        request.nextUrl.pathname.startsWith('/user-pages') &&
        !request.nextUrl.pathname.startsWith('/auth-pages/complete-profile')
    ) {
        console.log("Redirecting new user to complete profile");
        return NextResponse.redirect(new URL("/auth-pages/complete-profile", request.url));
    }

    // Allow verification routes
    if (request.nextUrl.pathname.startsWith('/api/auth/verify') ||
        request.nextUrl.pathname.startsWith('/auth-pages/verification-pending')
    ) {
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all paths except static files and images
        '/((?!_next/static|_next/image|favicon.ico).*)',
        // Match specific paths that need protection
        '/user-pages/:path*',
        '/api/media-items/:path*'
    ]
}; 