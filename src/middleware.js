import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(request) {
    const path = request.nextUrl.pathname;

    // Only apply www redirects to the homepage and non-auth pages
    if (path === '/' || (!path.includes('/api/') && !path.includes('/auth-pages/'))) {
        const hostname = request.headers.get('host') || '';
        const isProd = process.env.NODE_ENV === 'production';

        // Force www in production for SEO
        if (isProd && hostname === 'mediaq.io') {
            const url = request.nextUrl.clone();
            url.protocol = 'https';
            url.host = 'www.mediaq.io';
            return NextResponse.redirect(url);
        }
    }

    // Only apply auth checks to user pages (as in your original code)
    if (path.startsWith('/user-pages/')) {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET
        });

        const isNewGoogleUser = token?.google_id && !token?.reading_speed;

        if (isNewGoogleUser && !request.nextUrl.pathname.startsWith('/auth-pages/complete-profile')) {
            return NextResponse.redirect(new URL("/auth-pages/complete-profile", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Homepage for www redirects
        '/',
        // Public pages for www redirects (excluding auth and static assets)
        '/((?!api/|auth-pages/|_next/static|_next/image|favicon.ico).*)',
        // User pages for auth check (exactly as in your original code)
        '/user-pages/:path*'
    ]
}; 