import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function GET(request) {
    try {
        // Check if user is authenticated and is an admin
        const session = await getServerSession(authOptions);

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get query parameters
        const url = new URL(request.url);
        const search = url.searchParams.get('search') || '';
        const sortBy = url.searchParams.get('sortBy') || 'created_at';
        const sortOrder = url.searchParams.get('sortOrder') || 'desc';
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');

        // Calculate offset
        const offset = (page - 1) * limit;

        // Build query
        let query = supabase
            .from('users')
            .select('id, username, email, first_name, last_name, created_at, is_verified, is_admin, reading_speed', { count: 'exact' });

        // Add search filter if provided
        if (search) {
            query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
        }

        // Add sorting
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // Add pagination
        query = query.range(offset, offset + limit - 1);

        // Execute query
        const { data: users, error, count } = await query;

        if (error) {
            console.error('Error fetching users:', error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            users: users || [],
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({
            error: 'Failed to fetch users',
            details: error.message
        }, { status: 500 });
    }
} 