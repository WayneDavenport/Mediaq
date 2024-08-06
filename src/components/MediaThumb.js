// src/components/MediaThumb.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MediaThumb = ({ item }) => {
    const [imageUrl, setImageUrl] = useState('');
    const [title, setTitle] = useState(item.title);

    useEffect(() => {
        const fetchImage = async () => {
            try {
                let url = '';
                if (item.mediaType === 'Book' && item.additionalFields.isbn) {
                    const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${item.additionalFields.isbn}-M.jpg`, {

                    });
                    if (response.status === 200) {
                        url = response.config.url;
                    }
                } else if (item.mediaType === 'Movie' || item.mediaType === 'Show') {
                    const response = await axios.get('/api/tmdb', {
                        params: {
                            query: item.title,
                            mediaType: item.mediaType.toLowerCase()
                        }
                    });
                    if (response.data.results.length > 0) {
                        url = `https://image.tmdb.org/t/p/w500${response.data.results[0].poster_path}`;
                    }
                }
                setImageUrl(url);
            } catch (error) {
                console.error("Failed to fetch image:", error);
            }
        };

        fetchImage();
    }, [item.title, item.mediaType, item.additionalFields.isbn]);

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