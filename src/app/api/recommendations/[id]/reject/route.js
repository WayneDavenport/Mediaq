import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function POST(request, { params }) {
    try {
        const { id } = params;
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Update recommendation status
        const { error } = await supabase
            .from('user_recommendations')
            .update({ status: 'rejected' })
            .eq('id', id)
            .eq('receiver_id', session.user.id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'Recommendation rejected'
        });

    } catch (error) {
        console.error('Error rejecting recommendation:', error);
        return NextResponse.json({
            error: error.message,
            details: error.details || 'No additional details'
        }, { status: 500 });
    }
} 