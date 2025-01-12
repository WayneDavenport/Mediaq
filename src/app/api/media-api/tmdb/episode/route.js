import { NextResponse } from 'next/server';
import axios from 'axios';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const showId = searchParams.get('showId');
    const seasonNumber = searchParams.get('seasonNumber');
    const episodeNumber = searchParams.get('episodeNumber');

    if (!TMDB_API_KEY) {
        return NextResponse.json({ error: 'TMDB API key is not defined' }, { status: 500 });
    }

    try {
        const response = await axios.get(
            `${TMDB_BASE_URL}/tv/${showId}/season/${seasonNumber}/episode/${episodeNumber}`,
            {
                params: {
                    api_key: TMDB_API_KEY,
                }
            }
        );

        return NextResponse.json({
            runtime: response.data.runtime || 0
        });

    } catch (error) {
        console.error('Error fetching episode data from TMDB:', error);
        return NextResponse.json(
            { error: 'Error fetching episode data from TMDB' },
            { status: 500 }
        );
    }
}