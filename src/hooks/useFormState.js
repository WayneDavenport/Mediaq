// src/hooks/useFormState.js
import { useState, useEffect, useCallback } from 'react';
import { fetchMediaItems } from '@/utils/formUtils';

const useFormState = (item) => {
    const [formData, setFormData] = useState({
        id: item?._id || '',
        title: item?.title || '',
        duration: item?.duration || '',
        category: item?.category || '',
        mediaType: item?.mediaType || '',
        description: item?.description || '',
        additionalFields: item?.additionalFields || {},
        percentComplete: item?.percentComplete || 0,
        completedDuration: item?.completedDuration || 0,
        queueNumber: item?.queueNumber || 0
    });

    const [mediaTypes, setMediaTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [incompleteMediaItems, setIncompleteMediaItems] = useState([]);
    const [selectedKeyParent, setSelectedKeyParent] = useState(null);
    const [maxQueueNumber, setMaxQueueNumber] = useState(0);

    useEffect(() => {
        if (item) {
            setFormData({
                id: item._id,
                title: item.title || '',
                duration: item.duration || '',
                category: item.category || '',
                mediaType: item.mediaType || '',
                description: item.description || '',
                additionalFields: item.additionalFields || {},
                percentComplete: item.percentComplete || 0,
                completedDuration: item.completedDuration || 0,
                queueNumber: item.queueNumber || 0
            });
        }
    }, [item]);

    useEffect(() => {
        const fetchData = async () => {
            const mediaItems = await fetchMediaItems();
            const uniqueMediaTypes = [...new Set(mediaItems.map(item => item.mediaType))];
            const uniqueCategories = [...new Set(mediaItems.map(item => item.category))];
            const incompleteItems = mediaItems.filter(item => !item.complete);
            const maxQueue = Math.max(...mediaItems.map(item => item.queueNumber));

            setMediaTypes(uniqueMediaTypes);
            setCategories(uniqueCategories);
            setIncompleteMediaItems(incompleteItems);
            setMaxQueueNumber(maxQueue);
        };

        fetchData();
    }, []);

    const handleSliderChange = (e) => {
        const value = Number(e.target.value);
        let percentComplete, completedDuration;
        let updatedAdditionalFields = { ...formData.additionalFields };
        delete updatedAdditionalFields.coverArt;
        delete updatedAdditionalFields.imageUrl;

        if (formData.mediaType === 'Book') {
            updatedAdditionalFields.pagesCompleted = value;
            percentComplete = (value / Number(formData.additionalFields.pageCount)) * 100;
        } else if (formData.mediaType === 'Show') {
            updatedAdditionalFields.episodesCompleted = value;
            percentComplete = (value / Number(formData.additionalFields.episodes)) * 100;
        } else {
            percentComplete = value;
        }

        completedDuration = (percentComplete / 100) * formData.duration;

        setFormData((prevData) => ({
            ...prevData,
            percentComplete,
            completedDuration,
            additionalFields: updatedAdditionalFields
        }));
    };


    const handleChange = async (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    return {
        formData,
        mediaTypes,
        categories,
        incompleteMediaItems,
        selectedKeyParent,
        maxQueueNumber,
        handleSliderChange,
        handleChange,
        setFormData
    };
};

export default useFormState;