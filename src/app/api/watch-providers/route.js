import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request) {
    if (!TMDB_API_KEY) {
        console.error('TMDB API key not configured');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const tmdbId = searchParams.get('id');
    const mediaType = searchParams.get('type');
    // Defaulting country to US, make this dynamic if needed
    const country = searchParams.get('country') || 'US';

    if (!tmdbId || !mediaType) {
        return NextResponse.json({ error: 'Missing id or type parameter' }, { status: 400 });
    }
    if (mediaType !== 'movie' && mediaType !== 'tv') {
        return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }

    const url = `${TMDB_BASE_URL}/${mediaType}/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`;

    try {
        const tmdbResponse = await fetch(url);
        if (!tmdbResponse.ok) {
            console.error(`TMDB API error fetching providers: ${tmdbResponse.status} ${tmdbResponse.statusText}`);
            try {
                const errorBody = await tmdbResponse.json();
                console.error("TMDB Error Body:", errorBody);
            } catch (e) { /* Ignore parsing error */ }
            return NextResponse.json({ error: 'Could not retrieve provider information' }, { status: tmdbResponse.status === 404 ? 404 : 502 });
        }

        const data = await tmdbResponse.json();
        const countryData = data?.results?.[country.toUpperCase()];

        if (!countryData) {
            console.log(`No provider data found for country ${country} for ${mediaType} ${tmdbId}`);
            // Return empty arrays and null link if no country data
            return NextResponse.json({
                link: null,
                flatrate: [],
                rent: [],
                buy: [],
                allProviders: [] // Add combined list
            });
        }

        // --- Combine and Deduplicate Providers ---
        const allProviderData = [
            ...(countryData.flatrate || []),
            ...(countryData.rent || []),
            ...(countryData.buy || [])
        ];

        const uniqueProvidersMap = new Map();
        allProviderData.forEach(provider => {
            if (provider.logo_path && !uniqueProvidersMap.has(provider.provider_id)) {
                uniqueProvidersMap.set(provider.provider_id, provider);
            }
        });
        const allUniqueProviders = Array.from(uniqueProvidersMap.values());
        // --- End Combining ---


        const result = {
            link: countryData.link || null, // Main JustWatch/TMDB link
            // Keep original categories if needed frontend, but also send combined
            flatrate: countryData.flatrate || [],
            rent: countryData.rent || [],
            buy: countryData.buy || [],
            // Send the combined, unique list
            allProviders: allUniqueProviders
        };

        console.log(`Watch Provider API: Data for ${mediaType} ${tmdbId} in ${country}:`, result);

        return NextResponse.json(result); // Return the more detailed structure

    } catch (error) {
        console.error('Error in /api/watch-providers:', {
            id: tmdbId,
            type: mediaType,
            errorMessage: error.message,
            errorStack: error.stack
        });

        return NextResponse.json({ error: 'Failed to fetch watch providers', details: error.message }, { status: 500 });
    }
}