import React, { useState } from 'react';
import MediaThumb from '@/components/media-gallery/MediaThumb';
import ExpandedMediaView from '@/components/media-gallery/ExpandedMediaView';
import styles from './MediaGallery.module.css';

const MediaRow = ({ title, items }) => {
    const [selectedItem, setSelectedItem] = useState(null);

    const handleThumbClick = (item) => {
        setSelectedItem(item);
    };

    const handleClose = () => {
        setSelectedItem(null);
    };

    return (
        <div className={styles.mediaRow}>
            <h2 className={styles.mediaRowTitle}>{title}</h2>
            {selectedItem ? (
                <ExpandedMediaView item={selectedItem} onClose={handleClose} />
            ) : (
                <div className={styles.mediaItems}>
                    {items.map((item) => (
                        <MediaThumb key={item._id} item={item} onClick={handleThumbClick} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MediaRow;