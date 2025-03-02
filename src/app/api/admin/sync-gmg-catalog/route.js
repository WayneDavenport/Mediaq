import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { syncGmgCatalogToSupabase } from '@/lib/supabase-gmg';

export async function POST(request) {
    try {
        // Check if user is authenticated and is an admin
        const session = await getServerSession(authOptions);

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Trigger the catalog sync
        const count = await syncGmgCatalogToSupabase();

        return NextResponse.json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error syncing GMG catalog:', error);
        return NextResponse.json({
            error: 'Failed to sync GMG catalog',
            details: error.message
        }, { status: 500 });
    }
} 