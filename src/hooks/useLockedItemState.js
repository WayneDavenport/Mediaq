// src/hooks/useLockedItemState.js
import { useState, useEffect } from 'react';
import axios from 'axios';

const useLockedItemState = (itemId) => {
    const [lockedItemData, setLockedItemData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLockedItemData = async () => {
            try {
                const response = await axios.get(`/api/getLockedItem?itemId=${itemId}`);
                setLockedItemData(response.data.lockedItem);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    // If no locked item is found, set lockedItemData to an empty state
                    setLockedItemData({
                        locked: false,
                        keyParent: '',
                        goalTime: 0,
                        goalPages: 0,
                        goalEpisodes: 0
                    });
                } else {
                    setError(err);
                }
            } finally {
                setLoading(false);
            }
        };

        if (itemId) {
            fetchLockedItemData();
        } else {
            // Reset locked item data if no itemId is provided
            setLockedItemData({
                locked: false,
                keyParent: '',
                goalTime: 0,
                goalPages: 0,
                goalEpisodes: 0
            });
            setLoading(false);
        }
    }, [itemId]);

    return { lockedItemData, loading, error };
};

export default useLockedItemState;