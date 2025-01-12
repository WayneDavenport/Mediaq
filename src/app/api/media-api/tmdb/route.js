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
    const query = searchParams.get('query');
    const mediaType = searchParams.get('mediaType');
    const language = searchParams.get('language') || 'en-US';
    const page = searchParams.get('page') || 1;

    if (!TMDB_API_KEY) {
        return NextResponse.json({ error: 'TMDB API key is not defined' }, { status: 500 });
    }

    try {
        // Initial search
        const searchUrl = `${TMDB_BASE_URL}/search/multi`;
        const searchResponse = await axios.get(searchUrl, {
            params: {
                api_key: TMDB_API_KEY,
                query,
                language,
                page,
                include_adult: false,
            }
        });
        const searchData = searchResponse.data;

        // Transform the results to match your schema
        const transformedResults = await Promise.all(
            searchData.results.map(async (item) => {
                if (item.media_type === 'person') return null;

                // Fetch additional details based on media type
                const detailsUrl = `${TMDB_BASE_URL}/${item.media_type}/${item.id}`;
                const detailsResponse = await axios.get(detailsUrl, {
                    params: {
                        api_key: TMDB_API_KEY,
                        append_to_response: 'credits'
                    }
                });
                const details = detailsResponse.data;

                // Transform based on media type
                if (item.media_type === 'tv') {
                    // Calculate average episode duration if there are multiple values
                    const episodeRunTimes = details.episode_run_time || [];
                    const averageRuntime = episodeRunTimes.length > 0
                        ? Math.round(episodeRunTimes.reduce((a, b) => a + b, 0) / episodeRunTimes.length)
                        : 0;

                    return {
                        title: item.name,
                        media_type: 'tv',
                        description: item.overview,
                        poster_path: item.poster_path,
                        backdrop_path: item.backdrop_path,
                        duration: averageRuntime,  // Use the average runtime
                        additional: {
                            tmdb_id: item.id,
                            release_date: item.first_air_date,
                            total_episodes: details.number_of_episodes,
                            seasons: details.number_of_seasons,
                            vote_average: item.vote_average,
                            original_language: item.original_language,
                            episode_run_times: episodeRunTimes,  // Store all run times in additional
                            average_runtime: averageRuntime      // Also store the average
                        }
                    };
                } else if (item.media_type === 'movie') {
                    return {
                        title: item.title,
                        media_type: 'movie',
                        description: item.overview,
                        poster_path: item.poster_path,
                        backdrop_path: item.backdrop_path,
                        duration: details.runtime || 0,
                        additional: {
                            tmdb_id: item.id,
                            release_date: item.release_date,
                            director: details.credits?.crew?.find(c => c.job === 'Director')?.name,
                            vote_average: item.vote_average,
                            original_language: item.original_language,
                        }
                    };
                }
                return null;
            })
        );

        // Filter out null results (people) and invalid entries
        const filteredResults = transformedResults.filter(item => item !== null);

        return NextResponse.json({ results: filteredResults });

    } catch (error) {
        console.error('Error fetching data from TMDB:', error);
        return NextResponse.json(
            { error: 'Error fetching data from TMDB' },
            { status: 500 }
        );
    }
}