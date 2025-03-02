import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

// List of admin emails that can access this endpoint
const ADMIN_EMAILS = ['wayne86davenport@gmail.com'];

export async function GET(request) {
    try {
        // Check if user is authenticated and is an admin
        const session = await getServerSession(authOptions);

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch test users (users with @testmail.io email)
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, email, first_name, last_name')
            .ilike('email', '%@testmail.io')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching test users:', error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            users: users || []
        });

    } catch (error) {
        console.error('Error fetching test users:', error);
        return NextResponse.json({
            error: 'Failed to fetch test users',
            details: error.message
        }, { status: 500 });
    }
} 