// pages/api/rawgImages.js
import axios from 'axios';

const RAWG_API_KEY = process.env.RAWG_API_KEY;

export default async (req, res) => {
    const { gameId } = req.query;

    if (!gameId) {
        return res.status(400).json({ error: 'Game ID parameter is required' });
    }

    try {
        const response = await axios.get(`https://api.rawg.io/api/games/${gameId}`, {
            params: {
                key: RAWG_API_KEY,
            },
        });

        const game = response.data;
        const posterPath = game.background_image || '';
        const backdropPath = game.background_image_additional || '';

        res.status(200).json({ posterPath, backdropPath });
    } catch (error) {
        console.error('Error fetching data from RAWG:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch data from RAWG' });
    }
};