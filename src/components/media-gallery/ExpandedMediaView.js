import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
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

        const socket = io(); // Connect to the same port as the Next.js server

        socket.on('commentsUpdated', (data) => {
            const newComments = JSON.parse(data);
            setMediaItem((prevMediaItem) => ({
                ...prevMediaItem,
                comments: newComments
            }));
        });

        return () => {
            socket.disconnect();
        };
    }, [item._id]);

    return (
        <div className={styles.expandedMediaView}>
            <button onClick={onClose} className={styles.backButton}>Back</button>
            {loading && <p>Loading...</p>}
            {error && <p>Error loading media item</p>}
            {mediaItem && (
                <>
                    <img src={mediaItem.imageUrl} alt={mediaItem.title} className={styles.expandedImage} />
                    <div className={styles.details}>
                        <h2>{mediaItem.title}</h2>
                        <p>{mediaItem.description}</p>
                        {/* Add more details as needed */}
                    </div>
                    <CommentList comments={mediaItem.comments} mediaItemId={mediaItem._id} />
                </>
            )}
        </div>
    );
};

export default ExpandedMediaView;