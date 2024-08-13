// pages/api/rawg.js
import axios from 'axios';

const RAWG_API_KEY = process.env.RAWG_API_KEY;

export default async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        // Step 1: Search for games
        const searchResponse = await axios.get(`https://api.rawg.io/api/games`, {
            params: {
                key: RAWG_API_KEY,
                search: query,
            },
        });

        const games = searchResponse.data.results;

        // Step 2: Fetch detailed information for each game
        const detailedGames = await Promise.all(
            games.map(async (game) => {
                const detailsResponse = await axios.get(`https://api.rawg.io/api/games/${game.id}`, {
                    params: {
                        key: RAWG_API_KEY,
                    },
                });
                return detailsResponse.data;
            })
        );

        res.status(200).json(detailedGames);
    } catch (error) {
        console.error('Error fetching data from RAWG:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch data from RAWG' });
    }
};