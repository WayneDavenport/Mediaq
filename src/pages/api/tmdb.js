// pages/api/tmdb.js
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export default async function handler(req, res) {
    const { mediaType, query, language, include_adult, showId, seasonNumber, episodeNumber } = req.query;

    if (!TMDB_API_KEY) {
        return res.status(500).json({ error: 'TMDB API key is not defined' });
    }

    if (showId && seasonNumber && episodeNumber) {
        // Fetch episode details
        const url = `${TMDB_BASE_URL}/tv/${showId}/season/${seasonNumber}/episode/${episodeNumber}`;
        const params = {
            api_key: TMDB_API_KEY,
            language: language || 'en-US',
        };

        try {
            const response = await axios.get(url, { params });
            const data = response.data;
            return res.status(200).json({ runtime: data.runtime });
        } catch (error) {
            console.error('Error fetching episode data from TMDB:', error);
            return res.status(500).json({ error: 'Error fetching episode data from TMDB' });
        }
    } else {
        // Fetch search results
        const url = `${TMDB_BASE_URL}/search/multi`;
        const params = {
            api_key: TMDB_API_KEY,
            query: query,
            language: language || 'en-US',
            include_adult: include_adult === 'true',
        };

        try {
            const searchResponse = await axios.get(url, { params });
            const searchData = searchResponse.data;

            const detailedResults = await Promise.all(
                searchData.results.map(async (item) => {
                    if (item.media_type === 'person') {
                        return item;
                    }
                    const detailsUrl = `${TMDB_BASE_URL}/${item.media_type}/${item.id}?api_key=${TMDB_API_KEY}&language=${language || 'en-US'}&append_to_response=credits`;
                    const detailsResponse = await axios.get(detailsUrl);
                    const detailsData = detailsResponse.data;
                    return {
                        ...item,
                        credits: detailsData.credits,
                        runtime: detailsData.runtime, // Add runtime to the response
                        number_of_episodes: detailsData.number_of_episodes, // Add number of episodes to the response
                        episode_run_time: detailsData.episode_run_time, // Add episode runtime to the response
                        backdrop_path: detailsData.backdrop_path, // Add backdrop path to the response
                    };
                })
            );

            return res.status(200).json({ results: detailedResults });
        } catch (error) {
            console.error('Error fetching data from TMDB:', error);
            return res.status(500).json({ error: 'Error fetching data from TMDB' });
        }
    }
}