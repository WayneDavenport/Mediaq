import { NextResponse } from 'next/server';
import { findAffiliateLink } from '@/lib/supabase-gmg';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');

    if (!title) {
        return NextResponse.json(
            { error: 'Game title is required' },
            { status: 400 }
        );
    }

    try {
        const link = await findAffiliateLink(title);

        return NextResponse.json({ link });
    } catch (error) {
        console.error('Error finding affiliate link:', error);
        return NextResponse.json(
            { error: 'Failed to find affiliate link' },
            { status: 500 }
        );
    }
} 