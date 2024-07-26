import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MediaItemsList = ({ newMediaItem, onEdit }) => {
    const [mediaItems, setMediaItems] = useState([]);
    const [groupBy, setGroupBy] = useState('mediaType'); // Default grouping by media type
    const [keyParentTitles, setKeyParentTitles] = useState({}); // State to store key parent titles

    useEffect(() => {
        const fetchMediaItems = async () => {
            try {
                const response = await axios.get('/api/getMediaItems');
                const items = response.data.mediaItems;
                setMediaItems(items);

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

            console.log('Updating item:', updatedData); // Log the updated data

            const response = await axios.put('/api/updateItem', updatedData);

            if (response.status === 200) {
                console.log('Item marked as complete:', response.data.item); // Log the response
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
        // Assuming categories and media types are strings and item IDs are ObjectIds
        return typeof keyParent === 'string' && !keyParent.match(/^[0-9a-fA-F]{24}$/);
    };

    const getKeyParentTitle = (keyParent) => {
        if (isCategoryOrMediaType(keyParent)) {
            return keyParent;
        }
        return keyParentTitles[keyParent] || 'Unknown';
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
                        <div
                            key={item._id}
                            className={`media-item-thumbnail border p-4 rounded shadow mb-4 ${item.locked ? 'border-red-500' : ''}`}
                        >
                            {/* Render item details */}
                            <h3 className="text-lg font-semibold">{item.title}</h3>
                            <p>Category: {item.category}</p>
                            <p>Type: {item.mediaType}</p>
                            <p>Duration: {item.duration}</p>
                            <p>Percent Complete: {item.percentComplete}%</p>
                            {item.locked && item.keyParent && (
                                <p className="text-red-500">Locked Behind: {getKeyParentTitle(item.keyParent)}</p>
                            )}
                            <button onClick={() => handleDelete(item._id)} className="bg-red-500 text-white p-2 rounded mt-2">Remove</button>
                            <button onClick={() => onEdit(item)} className="bg-yellow-500 text-white p-2 rounded mt-2 ml-2">Edit</button>
                            {!item.complete && (
                                <button
                                    onClick={() => markAsComplete(item._id)}
                                    className={`p-2 rounded mt-2 ${item.locked ? 'bg-gray-500 text-white' : 'bg-green-500 text-white'}`}
                                    disabled={item.locked}
                                >
                                    Mark as Complete
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};


////
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MediaItemsList = ({ newMediaItem, onEdit }) => {
    const [mediaItems, setMediaItems] = useState([]);
    const [groupBy, setGroupBy] = useState('mediaType'); // Default grouping by media type
    const [keyParentTitles, setKeyParentTitles] = useState({}); // State to store key parent titles

    useEffect(() => {
        const fetchMediaItems = async () => {
            try {
                const response = await axios.get('/api/getMediaItems');
                const items = response.data.mediaItems;
                setMediaItems(items);

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
            console.log('Marking item as complete:', id);
            const itemToUpdate = mediaItems.find(item => item._id === id);

            if (!itemToUpdate) {
                console.error('Item not found');
                return;
            }

            console.log('Item to update:', itemToUpdate);

            const updatedData = {
                id: itemToUpdate._id,
                title: itemToUpdate.title,
                duration: itemToUpdate.duration,
                category: itemToUpdate.category,
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

            console.log('Updating item:', updatedData); // Log the updated data

            const response = await axios.put('/api/updateItem', updatedData);

            if (response.status === 200) {
                console.log('Item marked as complete:', response.data.item); // Log the response
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
        // Assuming categories and media types are strings and item IDs are ObjectIds
        return typeof keyParent === 'string' && !keyParent.match(/^[0-9a-fA-F]{24}$/);
    };

    const getKeyParentTitle = (keyParent) => {
        if (isCategoryOrMediaType(keyParent)) {
            return keyParent;
        }
        return keyParentTitles[keyParent] || 'Unknown';
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