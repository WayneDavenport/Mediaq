// MediaItemsList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { isItemLocked } from '@/controllers/lockController';

const MediaItemsList = ({ newMediaItem, onEdit }) => {
    const [mediaItems, setMediaItems] = useState([]);
    const [groupBy, setGroupBy] = useState('mediaType'); // Default grouping by media type
    const [lockedItems, setLockedItems] = useState({});

    useEffect(() => {
        const fetchMediaItems = async () => {
            try {
                const response = await axios.get('/api/getMediaItems');
                setMediaItems(response.data.mediaItems);
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

    useEffect(() => {
        const checkLockedStatus = async () => {
            const lockedStatus = {};
            for (const item of mediaItems) {
                lockedStatus[item._id] = await isItemLocked(item, item.userId);
            }
            setLockedItems(lockedStatus);
        };

        checkLockedStatus();
    }, [mediaItems]);

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
                ...itemToUpdate,
                complete: true,
            };

            const response = await axios.put('/api/updateItem', updatedData);

            if (response.status === 200) {
                setMediaItems(prevItems =>
                    prevItems.map(item =>
                        item._id === id ? { ...item, complete: true } : item
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

    const groupedMediaItems = mediaItems.reduce((acc, item) => {
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

    return (
        <div className="media-items-list p-4">
            <div className="mb-4">
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
                <label>
                    <input
                        type="radio"
                        value="category"
                        checked={groupBy === 'category'}
                        onChange={handleGroupByChange}
                        className="mr-2"
                    />
                    Group by Category
                </label>
            </div>
            {Object.keys(activeMediaItems).map(group => (
                <div key={group} className="mb-6">
                    <h2 className="text-xl font-bold mb-2">{group}</h2>
                    {activeMediaItems[group].map(item => (
                        <div key={item._id} className="media-item-thumbnail border p-4 rounded shadow mb-4">
                            {/* Render item details */}
                            <h3 className="text-lg font-semibold">{item.title}</h3>
                            <p>Category: {item.category}</p>
                            <p>Type: {item.mediaType}</p>
                            <p>Duration: {item.duration}</p>
                            <p>Percent Complete: {item.percentComplete}%</p>
                            {lockedItems[item._id] ? (
                                <p className="text-red-500">Locked</p>
                            ) : (
                                <>
                                    <button onClick={() => handleDelete(item._id)} className="bg-red-500 text-white p-2 rounded mt-2">Remove</button>
                                    <button onClick={() => onEdit(item)} className="bg-yellow-500 text-white p-2 rounded mt-2 ml-2">Edit</button>
                                    {!item.complete && (
                                        <button onClick={() => markAsComplete(item._id)} className="bg-green-500 text-white p-2 rounded mt-2">Mark as Complete</button>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default MediaItemsList;
