import React, { useEffect, useState } from 'react';
import styles from './MediaGallery.module.css';

const MediaThumb = ({ item, onClick }) => {
    const [imageUrl, setImageUrl] = useState('');
    const [title, setTitle] = useState(item.title);

    useEffect(() => {
        // Use the posterPath directly from the item
        setImageUrl(item.posterPath);
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