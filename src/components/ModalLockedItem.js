import React, { useEffect, useState } from 'react';
import styles from './Modal.module.css';

const ModalLockedItem = ({ mediaItem, lockedItemName, percentComplete }) => {
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        if (mediaItem.mediaType === 'Book' && mediaItem.additionalFields.isbn) {
            setImageUrl(`https://covers.openlibrary.org/b/isbn/${mediaItem.additionalFields.isbn}-M.jpg`);
        } else if (mediaItem.mediaType === 'Movie' || mediaItem.mediaType === 'Show') {
            setImageUrl(mediaItem.additionalFields.imageUrl);
        } else if (mediaItem.mediaType === 'VideoGame' && mediaItem.additionalFields.coverArt) {
            setImageUrl(mediaItem.additionalFields.coverArt);
        }
    }, [mediaItem]);

    return (
        <div className={styles.item}>
            <img src={imageUrl} alt={lockedItemName} className={styles.thumbnail} />
            <p><strong>{lockedItemName}</strong></p>
            <p><strong>Unlocked:</strong> {percentComplete.toFixed(2)}%</p>
        </div>
    );
};

export default ModalLockedItem;