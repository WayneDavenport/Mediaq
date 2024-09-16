import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CommentList from '../CommentList';
import styles from './MediaGallery.module.css';

const ExpandedMediaView = ({ item, onClose }) => {
    const [mediaItem, setMediaItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMediaItem = async () => {
            try {
                const response = await axios.get(`/api/getMediaItemById?id=${item._id}`);
                setMediaItem(response.data);
                setLoading(false);
            } catch (error) {
                setError(error);
                setLoading(false);
            }
        };

        fetchMediaItem();


    }, [item._id]);

    return (
        <div className={styles.expandedMediaView}>
            <button onClick={onClose} className={styles.backButton}>Back</button>
            {loading && <p>Loading...</p>}
            {error && <p>Error loading media item</p>}
            {mediaItem && (
                <>
                    <img src={mediaItem.posterPath} alt={mediaItem.title} className={styles.expandedImage} />
                    <div className={styles.details}>
                        <h2>{mediaItem.title}</h2>
                        <p className={styles.description}>{mediaItem.description}</p>
                        {/* Add more details as needed */}
                    </div>
                    <CommentList mediaItemId={mediaItem._id} />
                </>
            )}
        </div>
    );
};

export default ExpandedMediaView;