import { NextResponse } from 'next/server';
import axios from 'axios';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const RAWG_API_KEY = process.env.RAWG_API_KEY;
const RAWG_BASE_URL = 'https://api.rawg.io/api';

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
        // Search for games
        const searchResponse = await axios.get(`${RAWG_BASE_URL}/games`, {
            params: {
                key: RAWG_API_KEY,
                search: query,
                page: page,
                page_size: 20,
            },
        });

        // Get detailed information for each game
        const detailedGames = await Promise.all(
            searchResponse.data.results.map(async (game) => {
                try {
                    const detailsResponse = await axios.get(
                        `${RAWG_BASE_URL}/games/${game.id}`,
                        {
                            params: {
                                key: RAWG_API_KEY,
                            },
                        }
                    );

                    const gameData = detailsResponse.data;

                    return {
                        title: gameData.name,
                        media_type: 'game',
                        category: 'General',
                        description: gameData.description_raw || gameData.description,
                        poster_path: gameData.background_image,
                        backdrop_path: gameData.background_image_additional,
                        duration: gameData.playtime || 0,
                        completed_duration: 0,
                        percent_complete: 0,
                        completed: false,
                        additional: {
                            rawg_id: gameData.id,
                            release_date: gameData.released,
                            developers: gameData.developers?.map(dev => dev.name) || [],
                            publishers: gameData.publishers?.map(pub => pub.name) || [],
                            genres: gameData.genres?.map(genre => genre.name) || [],
                            platforms: gameData.platforms?.map(p => p.platform.name) || [],
                            metacritic: gameData.metacritic,
                            esrb_rating: gameData.esrb_rating?.name || null,
                            website: gameData.website,
                            average_playtime: gameData.playtime || 0,
                            achievements_count: gameData.achievements_count || 0,
                            rating: gameData.rating,
                            rating_count: gameData.ratings_count,
                        }
                    };
                } catch (error) {
                    console.error(`Error fetching details for game ${game.id}:`, error);
                    return null;
                }
            })
        );

        // Filter out any failed requests
        const filteredGames = detailedGames.filter(game => game !== null);

        return NextResponse.json({
            results: filteredGames,
            total_results: searchResponse.data.count,
            total_pages: Math.ceil(searchResponse.data.count / 20),
            current_page: parseInt(page),
        });

    } catch (error) {
        console.error('Error fetching data from RAWG:', error);
        return NextResponse.json(
            { error: 'Failed to fetch data from RAWG' },
            { status: 500 }
        );
    }
}