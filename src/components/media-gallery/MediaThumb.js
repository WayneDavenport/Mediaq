import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './MediaGallery.module.css';

const MediaThumb = ({ item, onClick }) => {
    const [imageUrl, setImageUrl] = useState('');
    const [title, setTitle] = useState(item.title);

    useEffect(() => {
        const fetchImage = async () => {
            try {
                let url = '';
                if (item.mediaType === 'Book' && item.additionalFields.isbn) {
                    const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${item.additionalFields.isbn}-M.jpg`);
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
                } else if (item.mediaType === 'VideoGame' && item.additionalFields.coverArt) {
                    url = item.additionalFields.coverArt;
                }
                setImageUrl(url);
            } catch (error) {
                console.error("Failed to fetch image:", error);
            }
        };

        fetchImage();
    }, [item.title, item.mediaType, item.additionalFields]);

    return (
        <div className={styles.mediaThumb} onClick={() => onClick(item)}>
            {imageUrl ? (
                <img src={imageUrl} alt={title} className={styles.mediaThumbImage} />
            ) : (
                <div className={styles.mediaThumbPlaceholder}>
                    <span>{title}</span>
                </div>
            )}
        </div>
    );
};

export default MediaThumb;