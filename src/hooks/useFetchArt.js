import { useState, useEffect } from 'react';

const useFetchArt = (posterPath, backdropPath) => {
    const [backgroundArt, setBackgroundArt] = useState('');
    const [backdropArt, setBackdropArt] = useState('');

    useEffect(() => {
        // Set the art paths directly from the provided paths
        setBackgroundArt(posterPath);
        setBackdropArt(backdropPath);
    }, [posterPath, backdropPath]);

    return { backgroundArt, backdropArt };
};

export default useFetchArt;