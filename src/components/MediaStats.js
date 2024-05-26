import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MediaStats = () => {
    const [mediaItems, setMediaItems] = useState([]);
    const [totalDuration, setTotalDuration] = useState({ readyToStart: 0, inProgress: 0, completed: 0 });
    const [categoryDurations, setCategoryDurations] = useState({ readyToStart: {}, inProgress: {}, completed: {} });
    const [mediaTypeDurations, setMediaTypeDurations] = useState({ readyToStart: {}, inProgress: {}, completed: {} });

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
        let totalReadyToStart = 0;
        let totalInProgress = 0;
        let totalCompleted = 0;
        const categoryDurationsReadyToStart = {};
        const categoryDurationsInProgress = {};
        const categoryDurationsCompleted = {};
        const mediaTypeDurationsReadyToStart = {};
        const mediaTypeDurationsInProgress = {};
        const mediaTypeDurationsCompleted = {};

        items.forEach(item => {
            if (item.complete) {
                totalCompleted += item.duration;
                if (categoryDurationsCompleted[item.category]) {
                    categoryDurationsCompleted[item.category] += item.duration;
                } else {
                    categoryDurationsCompleted[item.category] = item.duration;
                }
                if (mediaTypeDurationsCompleted[item.mediaType]) {
                    mediaTypeDurationsCompleted[item.mediaType] += item.duration;
                } else {
                    mediaTypeDurationsCompleted[item.mediaType] = item.duration;
                }
            } else {
                if (item.percentComplete === 0) {
                    totalReadyToStart += item.duration;
                    if (categoryDurationsReadyToStart[item.category]) {
                        categoryDurationsReadyToStart[item.category] += item.duration;
                    } else {
                        categoryDurationsReadyToStart[item.category] = item.duration;
                    }
                    if (mediaTypeDurationsReadyToStart[item.mediaType]) {
                        mediaTypeDurationsReadyToStart[item.mediaType] += item.duration;
                    } else {
                        mediaTypeDurationsReadyToStart[item.mediaType] = item.duration;
                    }
                } else {
                    totalInProgress += item.completedDuration;
                    if (categoryDurationsInProgress[item.category]) {
                        categoryDurationsInProgress[item.category] += item.completedDuration;
                    } else {
                        categoryDurationsInProgress[item.category] = item.completedDuration;
                    }
                    if (mediaTypeDurationsInProgress[item.mediaType]) {
                        mediaTypeDurationsInProgress[item.mediaType] += item.completedDuration;
                    } else {
                        mediaTypeDurationsInProgress[item.mediaType] = item.completedDuration;
                    }
                }
            }
        });

        setTotalDuration({ readyToStart: totalReadyToStart, inProgress: totalInProgress, completed: totalCompleted });
        setCategoryDurations({ readyToStart: categoryDurationsReadyToStart, inProgress: categoryDurationsInProgress, completed: categoryDurationsCompleted });
        setMediaTypeDurations({ readyToStart: mediaTypeDurationsReadyToStart, inProgress: mediaTypeDurationsInProgress, completed: mediaTypeDurationsCompleted });
    };

    return (
        <div className="media-stats p-4 border rounded shadow">
            <h2 className="text-xl font-bold mb-4">Media Statistics</h2>
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Ready to Start: {totalDuration.readyToStart} minutes</h3>
                <h3 className="text-lg font-semibold">In Progress: {totalDuration.inProgress} minutes</h3>
                <h3 className="text-lg font-semibold">Completed: {totalDuration.completed} minutes</h3>
            </div>
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Duration by Category (Ready to Start):</h3>
                <ul>
                    {Object.keys(categoryDurations.readyToStart).map(category => (
                        <li key={category}>
                            {category}: {categoryDurations.readyToStart[category]} minutes
                        </li>
                    ))}
                </ul>
                <h3 className="text-lg font-semibold">Duration by Category (In Progress):</h3>
                <ul>
                    {Object.keys(categoryDurations.inProgress).map(category => (
                        <li key={category}>
                            {category}: {categoryDurations.inProgress[category]} minutes
                        </li>
                    ))}
                </ul>
                <h3 className="text-lg font-semibold">Duration by Category (Completed):</h3>
                <ul>
                    {Object.keys(categoryDurations.completed).map(category => (
                        <li key={category}>
                            {category}: {categoryDurations.completed[category]} minutes
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Duration by Media Type (Ready to Start):</h3>
                <ul>
                    {Object.keys(mediaTypeDurations.readyToStart).map(mediaType => (
                        <li key={mediaType}>
                            {mediaType}: {mediaTypeDurations.readyToStart[mediaType]} minutes
                        </li>
                    ))}
                </ul>
                <h3 className="text-lg font-semibold">Duration by Media Type (In Progress):</h3>
                <ul>
                    {Object.keys(mediaTypeDurations.inProgress).map(mediaType => (
                        <li key={mediaType}>
                            {mediaType}: {mediaTypeDurations.inProgress[mediaType]} minutes
                        </li>
                    ))}
                </ul>
                <h3 className="text-lg font-semibold">Duration by Media Type (Completed):</h3>
                <ul>
                    {Object.keys(mediaTypeDurations.completed).map(mediaType => (
                        <li key={mediaType}>
                            {mediaType}: {mediaTypeDurations.completed[mediaType]} minutes
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default MediaStats;