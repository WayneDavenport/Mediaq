import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Use user_id instead of user_email for more reliable filtering
        const { data, error } = await supabase
            .from('media_items')
            .select('category')
            .eq('user_id', session.user.id)
            .not('category', 'is', null);

        if (error) throw error;

        // Get unique user categories
        const userCategories = [...new Set(data.map(item => item.category))];

        // Add default categories
        const defaultCategories = ['General', 'Learning', 'Work', 'Fun'];

        // Combine default and user categories, ensuring no duplicates
        const allCategories = [...defaultCategories];
        userCategories.forEach(category => {
            if (!defaultCategories.includes(category)) {
                allCategories.push(category);
            }
        });

        return NextResponse.json({ categories: allCategories });

    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}