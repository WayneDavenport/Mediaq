// pages/api/rawg.js
import axios from 'axios';

const RAWG_API_KEY = process.env.RAWG_API_KEY;
const RAWG_BASE_URL = 'https://api.rawg.io/api/games';

export default async function handler(req, res) {
    const { query } = req.query;

    if (!RAWG_API_KEY) {
        return res.status(500).json({ error: 'RAWG API key is not defined' });
    }

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    const params = {
        key: RAWG_API_KEY,
        search: query,
    };

    try {
        const response = await axios.get(RAWG_BASE_URL, { params });
        const games = response.data.results.map(item => {
            return {
                title: item.name,
                publisher: item.publishers?.map(publisher => publisher.name).join(', '),
                playtime: item.playtime, // Playtime in hours
            };
        });
        return res.status(200).json({ games });
    } catch (error) {
        console.error('Error fetching data from RAWG API:', error);
        return res.status(500).json({ error: 'Error fetching data from RAWG API' });
    }
}