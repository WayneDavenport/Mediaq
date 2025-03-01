import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(request) {
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
    matcher: ['/user-pages/:path*']
}; 