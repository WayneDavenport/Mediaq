import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setSelectedMediaItem } from '@/store/slices/selectedMediaItemSlice';
import styles from './MediaItemsList.module.css';
import Link from "next/link";

const MediaItemsList = ({ newMediaItem }) => {
    const [mediaItems, setMediaItems] = useState([]);
    const [groupBy, setGroupBy] = useState('mediaType');
    const [keyParentTitles, setKeyParentTitles] = useState({});
    const [lockedItems, setLockedItems] = useState({});
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchMediaItems = async () => {
            try {
                const response = await axios.get('/api/getMediaItems');
                const items = response.data.mediaItems;
                setMediaItems(items);

                // Fetch locked items
                const lockedResponse = await axios.get('/api/getLockedItems');
                const lockedItemsData = lockedResponse.data.lockedItems;
                const lockedItemsMap = lockedItemsData.reduce((acc, item) => {
                    acc[item.lockedItem] = item;
                    return acc;
                }, {});
                setLockedItems(lockedItemsMap);

                // Fetch key parent titles for item IDs
                const keyParentIds = items.map(item => item.keyParent).filter(id => id && !isCategoryOrMediaType(id));
                const uniqueKeyParentIds = [...new Set(keyParentIds)];
                const keyParentResponses = await Promise.all(uniqueKeyParentIds.map(id => axios.get(`/api/getMediaItems?id=${id}`)));
                const keyParentTitlesMap = keyParentResponses.reduce((acc, res) => {
                    acc[res.data.mediaItem._id] = res.data.mediaItem.title;
                    return acc;
                }, {});
                setKeyParentTitles(keyParentTitlesMap);
            } catch (error) {
                console.error("Failed to fetch media items:", error);
            }
        };

        fetchMediaItems();
    }, []);

    useEffect(() => {
        if (newMediaItem) {
            console.log("Adding new media item:", newMediaItem);
            setMediaItems(prevItems => [newMediaItem, ...prevItems]);
        }
    }, [newMediaItem]);

    const handleDelete = async (id) => {
        try {
            const response = await axios.delete(`/api/deleteItem?id=${id}`);
            if (response.status === 200) {
                setMediaItems(prevItems => prevItems.filter(item => item._id !== id));
            } else {
                console.error('Failed to delete media item:', response.data.message);
            }
        } catch (error) {
            console.error('Error deleting media item:', error);
        }
    };

    const markAsComplete = async (id) => {
        try {
            const itemToUpdate = mediaItems.find(item => item._id === id);

            if (!itemToUpdate) {
                console.error('Item not found');
                return;
            }

            const updatedData = {
                id: itemToUpdate._id,
                title: itemToUpdate.title,
                queueNumber: itemToUpdate.queueNumber,
                duration: itemToUpdate.duration,
                category: itemToUpdate.category,
                mediaType: itemToUpdate.mediaType,
                description: itemToUpdate.description,
                additionalFields: {
                    ...itemToUpdate.additionalFields,
                    ...(itemToUpdate.mediaType === 'Book' && { pagesCompleted: itemToUpdate.additionalFields.pageCount }),
                    ...(itemToUpdate.mediaType === 'Show' && { episodesCompleted: itemToUpdate.additionalFields.episodes })
                },
                percentComplete: 100,
                completedDuration: itemToUpdate.duration,
                complete: true,
            };

            console.log('Updating item:', updatedData);

            const response = await axios.put('/api/updateItem', updatedData);

            if (response.status === 200) {
                console.log('Item marked as complete:', response.data.item);
                setMediaItems(prevItems =>
                    prevItems.map(item =>
                        item._id === id ? { ...item, complete: true, percentComplete: 100, completedDuration: item.duration } : item
                    )
                );
            } else {
                console.error('Failed to mark item as complete:', response.data.message);
            }
        } catch (error) {
            console.error('Error marking item as complete:', error);
        }
    };

    const handleGroupByChange = (event) => {
        setGroupBy(event.target.value);
    };

    const isCategoryOrMediaType = (keyParent) => {
        return typeof keyParent === 'string' && !keyParent.match(/^[0-9a-fA-F]{24}$/);
    };

    const getKeyParentTitle = (keyParent) => {
        if (isCategoryOrMediaType(keyParent)) {
            return keyParent;
        }
        return keyParentTitles[keyParent] || 'Unknown';
    };

    const getProgressWidth = (item) => {
        if (lockedItems[item._id]) {
            return lockedItems[item._id].percentComplete;
        }
        return item.percentComplete;
    };

    const sortedMediaItems = groupBy === 'queueOrder'
        ? [...mediaItems].sort((a, b) => a.queueNumber - b.queueNumber)
        : mediaItems;

    const groupedMediaItems = sortedMediaItems.reduce((acc, item) => {
        const key = item[groupBy];
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(item);
        return acc;
    }, {});

    const activeMediaItems = Object.entries(groupedMediaItems).reduce((acc, [key, items]) => {
        acc[key] = items.filter(item => !item.complete);
        return acc;
    }, {});

    const formatDuration = (duration) => {
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className={styles.mediaItemsList}>
            <div className={styles.header}>
                <h2>Click to Edit</h2>
                <div className={styles.search}><Link href="/search">+</Link></div>
            </div>
            <div className={styles.groupByOptions}>
                <label className="mr-4">
                    <input
                        type="radio"
                        value="mediaType"
                        checked={groupBy === 'mediaType'}
                        onChange={handleGroupByChange}
                        className="mr-2"
                    />
                    Group by Media Type
                </label>
                <label className="mr-4">
                    <input
                        type="radio"
                        value="category"
                        checked={groupBy === 'category'}
                        onChange={handleGroupByChange}
                        className="mr-2"
                    />
                    Group by Category
                </label>
                <label>
                    <input
                        type="radio"
                        value="queueOrder"
                        checked={groupBy === 'queueOrder'}
                        onChange={handleGroupByChange}
                        className="queueOrder"
                    />
                    Queue Order
                </label>
            </div>
            <div className={styles.mediaItemsGrid}>
                {Object.keys(activeMediaItems).map(group => (
                    <div key={group} className={styles.mediaItemGroup}>
                        <h2 className={styles.groupTitle}>{group}</h2>
                        {activeMediaItems[group].map(item => (
                            <div
                                onClick={() => dispatch(setSelectedMediaItem(item))}
                                key={item._id}
                                className={styles.mediaItemThumbnail}
                            >
                                <div className={styles.titleContainer}>
                                    <MarqueeTitle title={item.title} />
                                </div>
                                <p className={styles.duration}>{formatDuration(item.duration)}</p>
                                {lockedItems[item._id] && (
                                    <p className={styles.lockedBehind}>Locked Behind: {getKeyParentTitle(lockedItems[item._id].keyParent)}</p>
                                )}
                                <div className={styles.progressBar}>
                                    <div
                                        className={`${styles.progressFill} ${lockedItems[item._id] ? styles.lockedProgressFill : styles.unlockedProgressFill}`}
                                        style={{ width: `${getProgressWidth(item)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

const MarqueeTitle = ({ title }) => {
    const titleRef = useRef(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (titleRef.current) {
                setIsOverflowing(titleRef.current.scrollWidth > titleRef.current.clientWidth);
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);

        return () => {
            window.removeEventListener('resize', checkOverflow);
        };
    }, [title]);

    return (
        <div className="marquee-container" ref={titleRef}>
            <h3 className={`font-semibold ${isOverflowing ? 'marquee' : ''}`}>{title}</h3>
        </div>
    );
};

export default MediaItemsList;