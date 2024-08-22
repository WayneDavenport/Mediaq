// src/utils/formUtils.js
import axios from 'axios';

export const fetchMediaItems = async () => {
    try {
        const response = await axios.get('/api/getMediaItems');
        return response.data.mediaItems;
    } catch (error) {
        console.error("Failed to fetch media items:", error);
        return [];
    }
};

export const fetchBackgroundArt = async (mediaType, title, additionalFields) => {
    try {
        if (mediaType === 'Book' && additionalFields.isbn) {
            const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${additionalFields.isbn}-L.jpg`);
            if (response.status === 200) {
                return { posterPath: response.config.url, backdropPath: '' };
            }
        } else if (mediaType === 'Movie' || mediaType === 'Show') {
            const response = await axios.get('/api/tmdb', {
                params: {
                    query: title,
                    mediaType: mediaType.toLowerCase()
                }
            });
            const results = response.data.results;
            if (results.length > 0) {
                const posterPath = results[0].poster_path ? `https://image.tmdb.org/t/p/w500${results[0].poster_path}` : '';
                const backdropPath = results[0].backdrop_path ? `https://image.tmdb.org/t/p/w1280${results[0].backdrop_path}` : '';
                return { posterPath, backdropPath };
            }
        } else if (mediaType === 'VideoGame' && additionalFields.gameId) {
            const response = await axios.get(`/api/rawgImages?gameId=${additionalFields.gameId}`);
            const { posterPath, backdropPath } = response.data;
            return { posterPath, backdropPath };
        }
    } catch (error) {
        console.error("Failed to fetch background art:", error);
    }
    return { posterPath: '', backdropPath: '' };
};