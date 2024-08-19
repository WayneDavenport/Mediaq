import React, { useEffect, useState } from 'react';
import styles from './MediaGallery.module.css';

const MediaThumb = ({ item, onClick }) => {
    const [imageUrl, setImageUrl] = useState('');
    const [title, setTitle] = useState(item.title);

    useEffect(() => {
        if (item.mediaType === 'Book' && item.additionalFields.isbn) {
            setImageUrl(`https://covers.openlibrary.org/b/isbn/${item.additionalFields.isbn}-M.jpg`);
        } else if (item.mediaType === 'Movie' || item.mediaType === 'Show') {
            setImageUrl(item.additionalFields.imageUrl);
        }
        else if (item.mediaType === 'VideoGame' && item.additionalFields.coverArt) {
            setImageUrl(item.additionalFields.coverArt);
        }
    }, [item]);

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