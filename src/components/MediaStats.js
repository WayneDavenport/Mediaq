import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MediaStats = () => {
    const [mediaItems, setMediaItems] = useState([]);
    const [totalDuration, setTotalDuration] = useState({ incomplete: 0, complete: 0 });
    const [categoryDurations, setCategoryDurations] = useState({ incomplete: {}, complete: {} });
    const [mediaTypeDurations, setMediaTypeDurations] = useState({ incomplete: {}, complete: {} });

    useEffect(() => {
        const fetchMediaItems = async () => {
            try {
                const response = await axios.get('/api/getMediaItems');
                const items = response.data.mediaItems;
                setMediaItems(items);
                calculateDurations(items);
            } catch (error) {
                console.error("Failed to fetch media items:", error);
            }
        };

        fetchMediaItems();
    }, []);

    const calculateDurations = (items) => {
        let totalIncomplete = 0;
        let totalComplete = 0;
        const categoryDurationsIncomplete = {};
        const categoryDurationsComplete = {};
        const mediaTypeDurationsIncomplete = {};
        const mediaTypeDurationsComplete = {};

        items.forEach(item => {
            if (item.complete) {
                totalComplete += item.duration;
                if (categoryDurationsComplete[item.category]) {
                    categoryDurationsComplete[item.category] += item.duration;
                } else {
                    categoryDurationsComplete[item.category] = item.duration;
                }
                if (mediaTypeDurationsComplete[item.mediaType]) {
                    mediaTypeDurationsComplete[item.mediaType] += item.duration;
                } else {
                    mediaTypeDurationsComplete[item.mediaType] = item.duration;
                }
            } else {
                totalIncomplete += item.duration;
                if (categoryDurationsIncomplete[item.category]) {
                    categoryDurationsIncomplete[item.category] += item.duration;
                } else {
                    categoryDurationsIncomplete[item.category] = item.duration;
                }
                if (mediaTypeDurationsIncomplete[item.mediaType]) {
                    mediaTypeDurationsIncomplete[item.mediaType] += item.duration;
                } else {
                    mediaTypeDurationsIncomplete[item.mediaType] = item.duration;
                }
            }
        });

        setTotalDuration({ incomplete: totalIncomplete, complete: totalComplete });
        setCategoryDurations({ incomplete: categoryDurationsIncomplete, complete: categoryDurationsComplete });
        setMediaTypeDurations({ incomplete: mediaTypeDurationsIncomplete, complete: mediaTypeDurationsComplete });
    };

    return (
        <div className="media-stats p-4 border rounded shadow">
            <h2 className="text-xl font-bold mb-4">Media Statistics</h2>
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Total Incomplete Duration: {totalDuration.incomplete} minutes</h3>
                <h3 className="text-lg font-semibold">Total Complete Duration: {totalDuration.complete} minutes</h3>
            </div>
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Duration by Category (Incomplete):</h3>
                <ul>
                    {Object.keys(categoryDurations.incomplete).map(category => (
                        <li key={category}>
                            {category}: {categoryDurations.incomplete[category]} minutes
                        </li>
                    ))}
                </ul>
                <h3 className="text-lg font-semibold">Duration by Category (Complete):</h3>
                <ul>
                    {Object.keys(categoryDurations.complete).map(category => (
                        <li key={category}>
                            {category}: {categoryDurations.complete[category]} minutes
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Duration by Media Type (Incomplete):</h3>
                <ul>
                    {Object.keys(mediaTypeDurations.incomplete).map(mediaType => (
                        <li key={mediaType}>
                            {mediaType}: {mediaTypeDurations.incomplete[mediaType]} minutes
                        </li>
                    ))}
                </ul>
                <h3 className="text-lg font-semibold">Duration by Media Type (Complete):</h3>
                <ul>
                    {Object.keys(mediaTypeDurations.complete).map(mediaType => (
                        <li key={mediaType}>
                            {mediaType}: {mediaTypeDurations.complete[mediaType]} minutes
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default MediaStats;