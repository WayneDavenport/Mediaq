// pages/api/igdb.js
import axios from 'axios';

const IGDB_API_KEY = process.env.IGDB_API_KEY;
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID;

const getAccessToken = async () => {
    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: IGDB_CLIENT_ID,
                client_secret: IGDB_API_KEY,
                grant_type: 'client_credentials',
            },
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error obtaining access token:', error);
        throw error;
    }
};

export default async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const accessToken = await getAccessToken();

        const response = await axios.post(
            'https://api.igdb.com/v4/games',
            `search "${query}*"; fields name,summary,cover.url,first_release_date,genres.name,involved_companies.company.name,platforms.name,aggregated_rating,aggregated_rating_count; limit 10;`,
            {
                headers: {
                    'Client-ID': IGDB_CLIENT_ID,
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (response.data && response.data.length > 0) {
            res.status(200).json(response.data);
        } else {
            res.status(404).json({ error: 'No games found for the given query' });
        }
    } catch (error) {
        console.error('Error fetching data from IGDB:', error);
        res.status(500).json({ error: 'Failed to fetch data from IGDB' });
    }
};
