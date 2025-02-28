import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(request) {
    // Handle www vs non-www redirects (canonical domain)
    const url = request.nextUrl.clone();
    const hostname = request.headers.get('host') || '';
    const isProd = process.env.NODE_ENV === 'production';

    // Force www in production (assuming www.mediaq.io is your preferred domain)
    if (isProd && hostname === 'mediaq.io') {
        url.protocol = 'https';
        url.host = 'www.mediaq.io';
        return NextResponse.redirect(url);
    }

    // Auth check for user pages
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    });

    const isNewGoogleUser = token?.google_id && !token?.reading_speed;

    if (isNewGoogleUser && !request.nextUrl.pathname.startsWith('/auth-pages/complete-profile')) {
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