import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MediaThumb = ({ item }) => {
    const [imageUrl, setImageUrl] = useState('');
    const [title, setTitle] = useState(item.title);

    useEffect(() => {
        const fetchImage = async () => {
            try {
                let url = '';
                if (item.mediaType === 'Movie' || item.mediaType === 'Show') {
                    const response = await axios.get('/api/tmdb', {
                        params: {
                            query: item.title,
                            mediaType: item.mediaType.toLowerCase()
                        }
                    });
                    if (response.data.results.length > 0) {
                        url = `https://image.tmdb.org/t/p/original${response.data.results[0].backdrop_path}`;
                    }
                } else if (item.mediaType === 'Book') {
                    const response = await axios.get('/api/googleBooks', {
                        params: {
                            query: item.title
                        }
                    });
                    if (response.data.items.length > 0) {
                        url = response.data.items[0].volumeInfo.imageLinks.thumbnail;
                    }
                }
                setImageUrl(url);
            } catch (error) {
                console.error("Failed to fetch image:", error);
            }
        };

        fetchImage();
    }, [item.title, item.mediaType]);

    return (
        <div className="media-thumb w-48 h-72 bg-light-blue-500 text-white rounded-lg shadow-lg p-4 mb-4 transition-transform transform hover:scale-105">
            {imageUrl ? (
                <img src={imageUrl} alt={title} className="w-full h-full object-cover rounded-lg" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-light-blue-500 rounded-lg">
                    <span className="text-center">{title}</span>
                </div>
            )}
        </div>
    );
};

export default MediaThumb;