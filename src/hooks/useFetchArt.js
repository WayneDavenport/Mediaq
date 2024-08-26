// src/hooks/useFetchArt.js
import { useState, useEffect, useCallback } from 'react';
import { fetchBackgroundArt } from '@/utils/formUtils';

const useFetchArt = (mediaType, title, additionalFields) => {
    const [backgroundArt, setBackgroundArt] = useState('');
    const [backdropArt, setBackdropArt] = useState('');

    const fetchArt = useCallback(async () => {
        const { posterPath, backdropPath } = await fetchBackgroundArt(mediaType, title, {
            gameId: additionalFields.gameId,
            isbn: additionalFields.isbn
        });
        setBackgroundArt(posterPath);
        setBackdropArt(backdropPath);
    }, [mediaType, title, additionalFields.gameId, additionalFields.isbn]);

    useEffect(() => {
        fetchArt();
    }, [fetchArt]);

    return { backgroundArt, backdropArt };
};

export default useFetchArt;