// src/components/MediaItemsList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MediaItemsList = ({ newMediaItem }) => {
    const [mediaItems, setMediaItems] = useState([]);
    const [groupBy, setGroupBy] = useState('mediaType'); // Default grouping by media type

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

    return (
        <div className="media-items-list">
            <div>
                <label>
                    <input
                        type="radio"
                        value="mediaType"
                        checked={groupBy === 'mediaType'}
                        onChange={handleGroupByChange}
                    />
                    Group by Media Type
                </label>
                <label>
                    <input
                        type="radio"
                        value="category"
                        checked={groupBy === 'category'}
                        onChange={handleGroupByChange}
                    />
                    Group by Category
                </label>
            </div>
            <br />
            {Object.keys(groupedMediaItems).map(group => (
                <div key={group}>
                    <h2>{group}</h2>
                    <br />
                    {groupedMediaItems[group].map(item => (
                        <div key={item._id} className="media-item-thumbnail">
                            <h3>{item.title}</h3>
                            <p>Category: {item.category}</p>
                            <p>Type: {item.mediaType}</p>
                            <p>Duration: {item.duration}</p>
                            <button onClick={() => handleDelete(item._id)}>Remove</button>
                            <br />
                            <br />

                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default MediaItemsList;