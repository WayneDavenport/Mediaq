import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMediaItem } from '@/store/slices/mediaItemSlice';
import CommentList from '../CommentList';
import styles from './MediaGallery.module.css';

const ExpandedMediaView = ({ item, onClose }) => {
    const dispatch = useDispatch();
    const mediaItem = useSelector((state) => state.mediaItem);

    useEffect(() => {
        dispatch(fetchMediaItem(item._id));
    }, [dispatch, item._id]);

    return (
        <div className={styles.expandedMediaView}>
            <button onClick={onClose} className={styles.backButton}>Back</button>
            {mediaItem.loading && <p>Loading...</p>}
            {mediaItem.error && <p>Error loading media item</p>}
            {mediaItem.data && (
                <>
                    <img src={mediaItem.data.imageUrl} alt={mediaItem.data.title} className={styles.expandedImage} />
                    <div className={styles.details}>
                        <h2>{mediaItem.data.title}</h2>
                        <p>{mediaItem.data.description}</p>
                        {/* Add more details as needed */}
                    </div>
                    <CommentList comments={mediaItem.data.comments} mediaItemId={mediaItem.data._id} />
                </>
            )}
        </div>
    );
};

export default ExpandedMediaView;