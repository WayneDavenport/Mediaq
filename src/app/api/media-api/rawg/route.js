import { NextResponse } from 'next/server';
import axios from 'axios';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { findGmgGameByTitle } from '@/lib/supabase-gmg';

const RAWG_API_KEY = process.env.RAWG_API_KEY;
const RAWG_BASE_URL = 'https://api.rawg.io/api';

// Helper function to parse dates for safe comparison
const parseDate = (dateString) => {
    try {
        return dateString ? new Date(dateString) : null;
    } catch (e) {
        return null;
    }
};

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const page = searchParams.get('page') || 1;

    if (!RAWG_API_KEY) {
        return NextResponse.json(
            { error: 'RAWG API key is not defined' },
            { status: 500 }
        );
    }

    if (!query) {
        return NextResponse.json(
            { error: 'Query parameter is required' },
            { status: 400 }
        );
    }

    try {
        // 1. Fetch RAWG Data (Search)
        const searchResponse = await axios.get(`${RAWG_BASE_URL}/games`, {
            params: {
                key: RAWG_API_KEY,
                search: query,
                page: page,
                page_size: 20,
            },
        });

        // 2. & 3. Fetch Details (RAWG) and Query GMG Data
        const combinedGamePromises = searchResponse.data.results.map(async (rawgGame) => {
            try {
                // Fetch RAWG Details
                const detailsResponse = await axios.get(
                    `${RAWG_BASE_URL}/games/${rawgGame.id}`,
                    { params: { key: RAWG_API_KEY } }
                );
                const gameData = detailsResponse.data;

                // Query GMG Data using the title from RAWG details
                const gmgData = await findGmgGameByTitle(gameData.name);

                // 4. Combine Data & Format
                const mediaItem = {
                    title: gameData.name,
                    media_type: 'game',
                    category: 'General',
                    description: gameData.description_raw || gameData.description,
                    poster_path: gameData.background_image,
                    backdrop_path: gameData.background_image_additional,
                    genres: gameData.genres?.map(genre => genre.name) || [],
                };

                const gameDetails = {
                    achievements_count: gameData.achievements_count || 0,
                    average_playtime: gameData.playtime || 0,
                    esrb_rating: gameData.esrb_rating?.name || null,
                    metacritic: gameData.metacritic || 0,
                    platforms: gameData.platforms?.map(p => p.platform.name).join(', ') || '',
                    publishers: gameData.publishers?.map(pub => pub.name).join(', ') || '',
                    rating: gameData.rating || 0,
                    rating_count: gameData.ratings_count || 0,
                    rawg_id: gameData.id,
                    release_date: gameData.released || '',
                    website: gameData.website || '',
                    gmg_price: gmgData?.price || null,
                    gmg_url: gmgData?.affiliate_link || null,
                };

                // Ensure duration is a number, default to 0 if playtime is 0 or null
                const playtimeHours = gameData.playtime || 0;
                const durationMinutes = playtimeHours > 0 ? playtimeHours * 60 : 0;

                const progressDetails = {
                    duration: durationMinutes,
                    completed_duration: 0,
                    completed: false,
                    queue_number: null,
                };

                return {
                    ...mediaItem,
                    game_details: gameDetails,
                    progress: progressDetails,
                    hasGmgData: !!gmgData,
                    _sort_release_date: parseDate(gameData.released),
                    _sort_rating: gameData.rating || 0,
                };
            } catch (error) {
                console.error(`Error processing game ${rawgGame.id} (${rawgGame.name}):`, error.message);
                return null;
            }
        });

        const combinedGames = (await Promise.all(combinedGamePromises)).filter(game => game !== null);

        // 5. Sort Results
        combinedGames.sort((a, b) => {
            // Priority 1: GMG Data Presence
            if (a.hasGmgData && !b.hasGmgData) return -1;
            if (!a.hasGmgData && b.hasGmgData) return 1;

            // Priority 2: Release Date (Newer First)
            const dateA = a._sort_release_date;
            const dateB = b._sort_release_date;
            if (dateA && dateB) {
                if (dateB.getTime() !== dateA.getTime()) {
                    return dateB.getTime() - dateA.getTime();
                }
            } else if (dateA && !dateB) {
                return -1;
            } else if (!dateA && dateB) {
                return 1;
            }

            // Priority 3: Rating (Higher First)
            if (b._sort_rating !== a._sort_rating) {
                return b._sort_rating - a._sort_rating;
            }

            return a.title.localeCompare(b.title);
        });

        // 6. Return Sorted Data
        return NextResponse.json({
            results: combinedGames,
            total_results: searchResponse.data.count,
            total_pages: Math.ceil(searchResponse.data.count / 20),
            current_page: parseInt(page),
        });

    } catch (error) {
        console.error('Error in RAWG API route:', error);
        const status = error.response?.status === 404 ? 404 : 500;
        return NextResponse.json(
            { error: `Failed to fetch data: ${error.message}` },
            { status: status }
        );
    }
}