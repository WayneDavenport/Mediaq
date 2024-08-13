// src/pages/media-gallery.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MediaRow from '@/components/media-gallery/MediaRow';
import Link from "next/link";
import FriendZone from '@/components/FriendZone';

const MediaGallery = () => {
    const [mediaItems, setMediaItems] = useState([]);
    const [categories, setCategories] = useState({});
    const [friendsMediaQueues, setFriendsMediaQueues] = useState([]);

    useEffect(() => {
        const fetchMediaItems = async () => {
            try {
                const response = await axios.get('/api/getMediaItems');
                const items = response.data.mediaItems;

                // Organize items by category
                const categorizedItems = items.reduce((acc, item) => {
                    if (!acc['Queue']) {
                        acc['Queue'] = [];
                    }
                    acc['Queue'].push(item);

                    if (!acc[item.mediaType]) {
                        acc[item.mediaType] = [];
                    }
                    acc[item.mediaType].push(item);

                    return acc;
                }, {});

                setMediaItems(items);
                setCategories(categorizedItems);
            } catch (error) {
                console.error("Failed to fetch media items:", error);
            }
        };

        const fetchFriendsMediaQueues = async () => {
            try {
                const response = await axios.get('/api/friends/media-queues');
                setFriendsMediaQueues(response.data.friendsMediaQueues);
            } catch (error) {
                console.error("Failed to fetch friends' media queues:", error);
            }
        };

        fetchMediaItems();
        fetchFriendsMediaQueues();
    }, []);

    return (
        <div className="media-gallery p-4">
            {Object.keys(categories).map((category) => (
                <MediaRow key={category} title={category} items={categories[category]} />
            ))}
            <FriendZone friendsMediaQueues={friendsMediaQueues} />
            <Link className="px-4 py-2 bg-green-500 text-white rounded" href='/user-main'>Dashboard</Link>
        </div>
    );
};

export default MediaGallery;