import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MediaQueueStats = () => {
    const [mediaItems, setMediaItems] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const [mediaTypeStats, setMediaTypeStats] = useState({});

    useEffect(() => {
        const fetchMediaItems = async () => {
            try {
                const response = await axios.get('/api/getMediaItems');
                const items = response.data.mediaItems;
                setMediaItems(items);
                calculateStats(items);
            } catch (error) {
                console.error("Failed to fetch media items:", error);
            }
        };

        fetchMediaItems();
    }, []);

    const calculateStats = (items) => {
        let totalItemsCount = 0;
        let totalDurationCount = 0;
        const mediaTypeDurations = {};

        items.forEach(item => {
            if (!item.complete) {
                totalItemsCount += 1;
                const remainingDuration = item.duration - item.completedDuration;
                totalDurationCount += remainingDuration;

                if (!mediaTypeDurations[item.mediaType]) {
                    mediaTypeDurations[item.mediaType] = {
                        totalDuration: 0,
                        units: item.mediaType === 'Book' ? 'pages' : item.mediaType === 'Show' ? 'episodes' : 'minutes'
                    };
                }

                mediaTypeDurations[item.mediaType].totalDuration += remainingDuration;
            }
        });

        setTotalItems(totalItemsCount);
        setTotalDuration(totalDurationCount);
        setMediaTypeStats(mediaTypeDurations);
    };

    const convertToHours = (minutes) => {
        return (minutes / 60).toFixed(2);
    };

    return (
        <div className="media-queue-stats p-4 border rounded shadow">
            <h2 className="text-xl font-bold mb-4">Media Queue Statistics</h2>
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Total Media Items: {totalItems}</h3>
                <h3 className="text-lg font-semibold">Total Duration Left: {totalDuration} minutes ({convertToHours(totalDuration)} hours)</h3>
            </div>
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Duration by Media Type:</h3>
                <ul>
                    {Object.keys(mediaTypeStats).map(mediaType => (
                        <li key={mediaType}>
                            {mediaType}: {mediaTypeStats[mediaType].totalDuration} {mediaTypeStats[mediaType].units} ({convertToHours(mediaTypeStats[mediaType].totalDuration)} hours)
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default MediaQueueStats;