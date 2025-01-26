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
        // Fetch genres
        const genresUrl = `${TMDB_BASE_URL}/genre/${mediaType}/list`;
        const genresResponse = await axios.get(genresUrl, {
            params: {
                api_key: TMDB_API_KEY,
                language,
            }
        });
        const genresData = genresResponse.data.genres;
        const genresMap = genresData.reduce((acc, genre) => {
            acc[genre.id] = genre.name;
            return acc;
        }, {});

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

                // Base media item properties for all types
                const mediaItem = {
                    title: item.media_type === 'tv' ? item.name : item.title,
                    media_type: item.media_type,
                    category: 'General',
                    description: item.overview,
                    poster_path: item.poster_path,
                    backdrop_path: item.backdrop_path,
                    genres: item.genre_ids.map(id => genresMap[id] || 'Unknown'), // Map genre IDs to names
                };

                // Progress tracking properties
                const progressDetails = {
                    completed_duration: 0,
                    completed: false,
                    queue_number: null,
                };

                // Transform based on media type
                if (item.media_type === 'tv') {
                    // Calculate average episode duration
                    const episodeRunTimes = details.episode_run_time || [];
                    const averageRuntime = episodeRunTimes.length > 0
                        ? Math.round(episodeRunTimes.reduce((a, b) => a + b, 0) / episodeRunTimes.length)
                        : 0;

                    const tvDetails = {
                        average_runtime: averageRuntime,
                        episode_run_times: episodeRunTimes[0] || 0, // Store first runtime as reference
                        original_language: item.original_language,
                        release_date: item.first_air_date,
                        seasons: details.number_of_seasons,
                        tmdb_id: item.id,
                        total_episodes: details.number_of_episodes,
                        vote_average: Math.round(item.vote_average),
                    };

                    progressDetails.duration = averageRuntime * details.number_of_episodes;

                    return {
                        ...mediaItem,
                        tv_details: tvDetails,
                        progress: progressDetails,
                    };

                } else if (item.media_type === 'movie') {
                    const movieDetails = {
                        director: details.credits?.crew?.find(c => c.job === 'Director')?.name || '',
                        original_language: item.original_language,
                        release_date: item.release_date,
                        tmdb_id: item.id,
                        vote_average: Math.round(item.vote_average),
                        runtime: details.runtime || 120,
                    };

                    progressDetails.duration = details.runtime || 120;

                    return {
                        ...mediaItem,
                        ...movieDetails,
                        movie_details: movieDetails,
                        progress: progressDetails,
                        duration: details.runtime || 120,
                    };
                }
                return null;
            })
        );

        // Filter out null results (people) and invalid entries
        const filteredResults = transformedResults.filter(item => item !== null);

        return NextResponse.json({
            results: filteredResults,
            total_results: searchData.total_results,
            total_pages: searchData.total_pages,
            current_page: parseInt(page),
        });

    } catch (error) {
        console.error('Error fetching data from TMDB:', error);
        return NextResponse.json(
            { error: 'Error fetching data from TMDB' },
            { status: 500 }
        );
    }
}