// src/components/UpdateForm.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearSelectedMediaItem } from '@/store/slices/selectedMediaItemSlice';
import { showModal } from '@/store/slices/modalSlice';
import useFormState from '@/hooks/useFormState';
import useFetchArt from '@/hooks/useFetchArt';
import FormField from '@/components/FormField';
import axios from 'axios';
import styles from './UpdateForm.module.css';

const UpdateForm = ({ onCancel }) => {
    const dispatch = useDispatch();
    const item = useSelector((state) => state.selectedMediaItem);
    const session = useSelector((state) => state.session);
    const readingSpeed = session?.user?.readingSpeed || 20; // pages per 30 minutes


    const {
        formData,
        mediaTypes,
        categories,
        incompleteMediaItems,
        selectedKeyParent,
        maxQueueNumber,
        handleSliderChange,
        handleChange,
        setFormData
    } = useFormState(item);

    const { backgroundArt, backdropArt } = useFetchArt(formData.mediaType, formData.title, formData.additionalFields);

    const [locked, setLocked] = useState(false);
    const [keyParent, setKeyParent] = useState('');
    const [goalTime, setGoalTime] = useState(0);
    const [goalPages, setGoalPages] = useState(0);
    const [goalEpisodes, setGoalEpisodes] = useState(0);
    const [isEditing, setIsEditing] = useState(false);

    const truncateDescription = (description) => {
        const maxLength = 100;
        return description.length > maxLength ?
            `${description.substring(0, maxLength)}...` : description;
    };

    const handleLockChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'locked') {
            setLocked(checked);
        } else if (name === 'keyParent') {
            const selectedItem = incompleteMediaItems.find(item => item._id === value);
            setKeyParent(selectedItem ? selectedItem.title : value);
            setGoalTime(selectedItem ? selectedItem.duration : 0);
            setGoalPages(selectedItem && selectedItem.mediaType === 'Book' ? selectedItem.additionalFields.pageCount : 0);
            setGoalEpisodes(selectedItem && selectedItem.mediaType === 'Show' ? selectedItem.additionalFields.episodes : 0);
        } else if (name === 'goalPages') {
            setGoalPages(Number(value));
            setGoalTime(Math.round((Number(value) / readingSpeed) * 30)); // Calculate time based on reading speed
        } else if (name === 'goalEpisodes') {
            setGoalEpisodes(Number(value));
            setGoalTime(selectedKeyParent ? Math.round((Number(value) / selectedKeyParent.additionalFields.episodes) * selectedKeyParent.duration) : goalTime);
        } else {
            setGoalTime(Number(value));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Calculate differences
            const differences = calculateDifferences(formData, item);

            // Update the main media item
            const updateResponse = await updateMediaItem(formData, differences);

            if (updateResponse.ok) {
                let lockedItems = [];

                if (locked) {
                    // Handle locked item update
                    const lockedItemData = await handleLockedItemUpdate(formData, differences);
                    lockedItems = lockedItemData ? [lockedItemData.lockedItem] : [];
                } else {
                    // First, update the locked items in the database
                    await checkAndUpdateDependentLockedItems(formData.id);

                    // Then, fetch the locked items to populate the modal
                    const lockedItemsResponse = await checkAndPopulateLockedItems(formData.id);
                    lockedItems = lockedItemsResponse.lockedItems || []; // Extract the array
                }

                // Fetch corresponding MediaItem data for each lockedItem
                const lockedItemsWithMediaData = await Promise.all(
                    lockedItems.map(async (lockedItem) => {
                        const mediaItemResponse = await fetch(`/api/getMediaItemById?id=${lockedItem.lockedItem}`);
                        const mediaItem = await mediaItemResponse.json();
                        return {
                            ...lockedItem,
                            mediaItem, // Attach the corresponding MediaItem data
                        };
                    })
                );

                // Log the lockedItems to verify the data
                console.log('Final Locked Items with Media Data:', lockedItemsWithMediaData);

                // Clear the selected media item and reset the form
                dispatch(clearSelectedMediaItem());
                setIsEditing(false);

                // Store the data in Redux state
                dispatch(showModal({
                    updatedItem: {
                        title: formData.title,
                        percentComplete: formData.percentComplete,
                    },
                    lockedItems: lockedItemsWithMediaData, // Pass the lockedItems with MediaItem data
                }));
            } else {
                const errorData = await updateResponse.json();
                console.error('Error updating media item:', errorData.message);
            }
        } catch (error) {
            console.error('Error updating media item:', error);
        }
    };






    const calculateDifferences = (formData, item) => {
        return {
            durationDiff: formData.completedDuration - item.completedDuration,
            percentCompleteDiff: formData.percentComplete - item.percentComplete,
            pagesCompleteDiff: (formData.additionalFields.pagesCompleted || 0) - (item.additionalFields.pagesCompleted || 0),
            episodesCompleteDiff: (formData.additionalFields.episodesCompleted || 0) - (item.additionalFields.episodesCompleted || 0),
        };
    };

    const updateMediaItem = async (formData, differences) => {
        return await fetch('/api/updateItem', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...formData,
                ...differences,
            }),
        });
    };

    const handleLockedItemUpdate = async (formData, differences) => {
        const lockedItemResponse = await fetch('/api/updateLockedItem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lockedItem: formData.id,
                lockedItemName: formData.title,
                keyParent,
                goalTime,
                goalPages,
                goalEpisodes,
                timeComplete: formData.completedDuration,
                percentComplete: (formData.completedDuration / goalTime) * 100,
                pagesComplete: formData.additionalFields.pagesCompleted || 0,
                episodesComplete: formData.additionalFields.episodesCompleted || 0,
            }),
        });

        if (lockedItemResponse.ok) {
            const lockedItemData = await lockedItemResponse.json();
            console.log('Locked item updated:', lockedItemData.lockedItem);
        } else {
            const errorData = await lockedItemResponse.json();
            console.error('Error creating locked item:', errorData.message);
        }
    };

    const checkAndUpdateDependentLockedItems = async (itemId) => {
        const lockedItemsResponse = await fetch(`/api/getLockedItems?keyParent=${itemId}`);
        if (lockedItemsResponse.ok) {
            const lockedItems = await lockedItemsResponse.json();
            if (lockedItems.length > 0) {
                console.log('Affected locked items:', lockedItems);
            }
        }
    };

    const checkAndPopulateLockedItems = async (itemId) => {
        try {
            // Fetch locked items that depend on the main item
            const lockedItemsResponse = await fetch(`/api/getLockedItems?keyParent=${itemId}`);
            if (lockedItemsResponse.ok) {
                const lockedItems = await lockedItemsResponse.json();
                return lockedItems;
            } else {
                console.error('Error fetching locked items:', await lockedItemsResponse.text());
                return [];
            }
        } catch (error) {
            console.error('Error fetching locked items:', error);
            return [];
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await axios.delete(`/api/deleteItem?id=${id}`);
            if (response.status === 200) {
                onCancel();
                dispatch(clearSelectedMediaItem());
                setFormData(getInitialFormData());
            } else {
                console.error('Failed to delete media item:', response.data.message);
            }
        } catch (error) {
            console.error('Error deleting media item:', error);
        }
    };

    const markAsComplete = async (id) => {
        try {
            const itemToUpdate = formData;

            if (!itemToUpdate) {
                console.error('Item not found');
                return;
            }

            // Calculate differences
            const durationDiff = itemToUpdate.duration - item.completedDuration;
            const percentCompleteDiff = 100 - item.percentComplete;
            const pagesCompleteDiff = (itemToUpdate.additionalFields.pagesCompleted || itemToUpdate.additionalFields.pageCount || 0) - (item.additionalFields.pagesCompleted || 0);
            const episodesCompleteDiff = (itemToUpdate.additionalFields.episodesCompleted || itemToUpdate.additionalFields.episodes || 0) - (item.additionalFields.episodesCompleted || 0);

            const updatedData = {
                ...itemToUpdate,
                percentComplete: 100,
                completedDuration: itemToUpdate.duration,
                complete: true,
            };

            console.log('Updating item:', updatedData);

            const response = await axios.put('/api/updateItem', {
                ...updatedData,
                durationDiff,
                percentCompleteDiff,
                pagesCompleteDiff,
                episodesCompleteDiff
            });

            if (response.status === 200) {
                console.log('Item marked as complete:', response.data.item);
                dispatch(clearSelectedMediaItem());
                setFormData(getInitialFormData());

                // Update locked items
                const lockedItemsResponse = await axios.get('/api/getLockedItems');
                const lockedItems = lockedItemsResponse.data.lockedItems;

                for (const lockedItem of lockedItems) {
                    if (lockedItem.keyParent === id || lockedItem.keyParent === itemToUpdate.mediaType || lockedItem.keyParent === itemToUpdate.category) {
                        lockedItem.timeComplete += durationDiff;
                        lockedItem.pagesComplete += pagesCompleteDiff;
                        lockedItem.episodesComplete += episodesCompleteDiff;
                        lockedItem.percentComplete = (lockedItem.timeComplete / lockedItem.goalTime) * 100;

                        await axios.put('/api/updateLockedItem', lockedItem);
                    }
                }
            } else {
                console.error('Failed to mark item as complete:', response.data.message);
            }
        } catch (error) {
            console.error('Error marking item as complete:', error);
        }
    };

    const formatCompletion = () => {
        const { mediaType, additionalFields, percentComplete, duration } = formData;
        let completed, total, unit;

        if (mediaType === 'Book') {
            completed = additionalFields.pagesCompleted || 0;
            total = additionalFields.pageCount || 0;
            unit = 'pages';
        } else if (mediaType === 'Show') {
            completed = additionalFields.episodesCompleted || 0;
            total = additionalFields.episodes || 0;
            unit = 'episodes';
        } else {
            completed = Math.round((percentComplete / 100) * duration);
            total = duration;
            unit = 'minutes';
        }

        const completedDuration = (percentComplete / 100) * duration;

        return `${completed} out of ${total} ${unit} (${percentComplete.toFixed(2)}%) - ${completedDuration.toFixed(2)} out of ${duration} minutes`;
    };

    const moveToTop = async () => {
        try {
            const updatedData = {
                ...formData,
                queueNumber: 1
            };

            console.log('Moving item to top:', updatedData);

            const response = await axios.put('/api/updateItem', updatedData);

            if (response.status === 200) {
                console.log('Item moved to top:', response.data.item);
                dispatch(clearSelectedMediaItem());
                setFormData(getInitialFormData());
            } else {
                console.error('Failed to move item to top:', response.data.message);
            }
        } catch (error) {
            console.error('Error moving item to top:', error);
        }
    };

    const moveToBottom = async () => {
        try {
            const updatedData = {
                ...formData,
                queueNumber: maxQueueNumber + 1
            };

            console.log('Moving item to bottom:', updatedData);

            const response = await axios.put('/api/updateItem', updatedData);

            if (response.status === 200) {
                console.log('Item moved to bottom:', response.data.item);
                dispatch(clearSelectedMediaItem());
                setFormData(getInitialFormData());
            } else {
                console.error('Failed to move item to bottom:', response.data.message);
            }
        } catch (error) {
            console.error('Error moving item to bottom:', error);
        }
    };


    if (!isEditing) {
        return (
            <div className={styles.container}>
                <div className="flex">
                    <img src={backgroundArt} alt={formData.title} className={styles.heroImage} />
                    <div className={styles.marginLeft}>
                        <h2 className={styles.textLarge}>{formData.title}</h2>
                        <p className={styles.textMedium}>{formData.duration} minutes</p>
                        <p className={styles.textMedium}>{formData.category}</p>
                    </div>
                </div>
                <p className={styles.description}>{formData.description}</p>
                <button onClick={() => setIsEditing(true)} className={styles.textBlue}>Edit</button>

            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Update Media Item</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                <FormField label="Title" name="title" value={formData.title} onChange={handleChange} />
                <FormField label="Duration" name="duration" value={formData.duration} onChange={handleChange} />
                <FormField label="Category" name="category" value={formData.category} onChange={handleChange} />
                <FormField label="Media Type" name="mediaType" value={formData.mediaType} onChange={handleChange} />
                <FormField label="Description" name="description" value={formData.description} onChange={handleChange} type="textarea" />
                <div>
                    <label className={styles.label}>Percent Complete:</label>
                    <input
                        type="range"
                        name="percentComplete"
                        min="0"
                        max={formData.mediaType === 'Book' ? formData.additionalFields.pageCount : formData.mediaType === 'Show' ? formData.additionalFields.episodes : 100}
                        step="1"
                        value={formData.mediaType === 'Book' ? formData.additionalFields.pagesCompleted : formData.mediaType === 'Show' ? formData.additionalFields.episodesCompleted : formData.percentComplete}
                        onChange={handleSliderChange}
                        className={styles.input}
                    />
                    <span>{formatCompletion()}</span>
                </div>
                <FormField label="Queue Number" name="queueNumber" value={formData.queueNumber} onChange={handleChange} type="number" min="1" max={maxQueueNumber} />
                <div>
                    <label className={styles.label}>Locked:</label>
                    <input
                        type="checkbox"
                        name="locked"
                        checked={locked}
                        onChange={handleLockChange}
                        className="mr-2"
                    />
                </div>
                {locked && (
                    <>
                        <div>
                            <label className={styles.label}>Key Parent:</label>
                            <select
                                name="keyParent"
                                value={keyParent}
                                onChange={handleLockChange}
                                className={`${styles.input} text-white-700 bg-[#222227] bg-opacity-20`}
                            >
                                <option value="">Select Key Parent</option>
                                <optgroup label="Media Types">
                                    {mediaTypes.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Categories">
                                    {categories.map((category) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Incomplete Media Items">
                                    {incompleteMediaItems.map((item) => (
                                        <option key={item._id} value={item._id}>{item.title}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        {selectedKeyParent && (
                            <div>
                                <label className={styles.label}>
                                    {selectedKeyParent.mediaType === 'Book' ? 'Goal Pages:' : 'Goal Time:'}
                                </label>
                                {selectedKeyParent.mediaType === 'Book' ? (
                                    <>
                                        <input
                                            type="number"
                                            name="goalPages"
                                            min="0"
                                            max={10000}
                                            value={goalPages}
                                            onChange={handleLockChange}
                                            className={`${styles.input} text-white-700 bg-[#222227] bg-opacity-20`}
                                        />
                                        <span>
                                            {goalPages} pages ({Math.round((goalPages / readingSpeed) * 30)} minutes)
                                        </span>
                                    </>
                                ) : selectedKeyParent.mediaType === 'Show' ? (
                                    <>
                                        <input
                                            type="range"
                                            name="goalEpisodes"
                                            min="0"
                                            max={selectedKeyParent.additionalFields.episodes}
                                            value={goalEpisodes}
                                            onChange={handleLockChange}
                                            className={styles.input}
                                        />
                                        <span>
                                            {goalEpisodes} episodes ({Math.round((goalEpisodes / selectedKeyParent.additionalFields.episodes) * selectedKeyParent.duration)} minutes)
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <input
                                            type="number"
                                            name="goalTime"
                                            value={goalTime}
                                            onChange={handleLockChange}
                                            className={styles.input}
                                        />
                                        <span>{goalTime} minutes</span>
                                    </>
                                )}
                            </div>
                        )}
                        {!selectedKeyParent && (
                            <div>
                                <label className={styles.label}>
                                    {keyParent === 'Book' ? 'Goal Pages & Time:' : 'Goal Time:'}
                                </label>
                                {keyParent === 'Book' ? (
                                    <>
                                        <input
                                            type="number"
                                            name="goalPages"
                                            min="0"
                                            max={10000}
                                            value={goalPages}
                                            onChange={handleLockChange}
                                            className={`${styles.input} text-white-700 bg-[#222227] bg-opacity-20`}
                                        />
                                        <span>
                                            {goalPages} pages ({Math.round((goalPages / readingSpeed) * 30)} minutes)
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <input
                                            type="number"
                                            name="goalTime"
                                            value={goalTime}
                                            onChange={handleLockChange}
                                            className={`${styles.input} text-white-700 bg-[#222227] bg-opacity-20`}
                                        />
                                        <span>{goalTime} minutes</span>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
                <div className={styles.buttons}>
                    <button type="submit" className={styles.button}>Update</button>
                    <button type="button" onClick={onCancel} className={`${styles.button} ${styles.buttonCancel}`}>Cancel</button>
                    <button type="button" onClick={() => handleDelete(formData.id)} className={`${styles.button} ${styles.buttonDelete}`}>Delete</button>
                    {!formData.complete && (
                        <button type="button" onClick={() => markAsComplete(formData.id)} className={`${styles.button} ${styles.buttonComplete}`}>Mark as Complete</button>
                    )}
                    <button type="button" onClick={moveToTop} className={`${styles.button} ${styles.buttonMove}`}>Move to Top</button>
                    <button type="button" onClick={moveToBottom} className={`${styles.button} ${styles.buttonMove}`}>Move to Bottom</button>
                </div>
            </form>
        </div>
    );
};

export default UpdateForm;
