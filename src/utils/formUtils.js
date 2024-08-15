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
                return response.config.url;
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
                const backdropPath = results[0].backdrop_path;
                if (backdropPath) {
                    return `https://image.tmdb.org/t/p/w500${response.data.results[0].poster_path}`;
                }
            }
        } else if (mediaType === 'VideoGame' && additionalFields.coverArt) {
            return additionalFields.coverArt;
        }
    } catch (error) {
        console.error("Failed to fetch background art:", error);
    }
    return '';
};

