// src/components/MediaItemsList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MediaItemsList = () => {
    const [mediaItems, setMediaItems] = useState([]);

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

    return (
        <div className="media-items-list">
            {mediaItems.map(item => (
                <div key={item._id} className="media-item-thumbnail">
                    <h3>{item.title}</h3>
                    <p>Category: {item.category}</p>
                    <p>Type: {item.mediaType}</p>
                    <p>Duration: {item.duration}</p>
                    <br />
                </div>
            ))}
        </div>
    );
};

export default MediaItemsList;