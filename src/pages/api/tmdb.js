// pages/api/tmdb.js
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export default async function handler(req, res) {
    const { mediaType, title, genre, year } = req.query;

    if (!TMDB_API_KEY) {
        return res.status(500).json({ error: 'TMDB API key is not defined' });
    }

    let url = '';
    let params = {
        api_key: TMDB_API_KEY,
        query: title,
    };

    switch (mediaType) {
        case 'movie':
            url = `${TMDB_BASE_URL}/search/movie`;
            if (year) {
                params.year = year;
            }
            break;
        case 'show':
            url = `${TMDB_BASE_URL}/search/tv`;
            break;
        // Add cases for other media types and APIs here
        default:
            return res.status(400).json({ error: 'Unsupported media type' });
    }

    try {
        const response = await axios.get(url, { params });
        return res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching data from TMDB:', error);
        return res.status(500).json({ error: 'Error fetching data from TMDB' });
    }
}
