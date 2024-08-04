import { useState, useEffect } from 'react';
import axios from 'axios';
import _ from 'lodash';

const UpdateForm = ({ item, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        id: item._id,
        title: item.title || '',
        duration: item.duration || '',
        category: item.category || '',
        mediaType: item.mediaType || '',
        description: item.description || '',
        additionalFields: item.additionalFields || {},
        percentComplete: item.percentComplete || 0,
        goalCompletionTime: item.goalCompletionTime || 0,
        completedDuration: item.completedDuration || 0,
        locked: item.locked || false,
        keyParent: item.keyParent || '',
        goalDuration: item.goalDuration || 0,
        queueNumber: item.queueNumber || 0
    });
    useEffect(() => {
        setFormData({
            id: item._id,
            title: item.title || '',
            duration: item.duration || '',
            category: item.category || '',
            mediaType: item.mediaType || '',
            description: item.description || '',
            additionalFields: item.additionalFields || {},
            percentComplete: item.percentComplete || 0,
            goalCompletionTime: item.goalCompletionTime || 0,
            completedDuration: item.completedDuration || 0,
            locked: item.locked || false,
            keyParent: item.keyParent || '',
            goalDuration: item.goalDuration || 0,
            queueNumber: item.queueNumber || 0
        });
    }, [item]);
    const [mediaTypes, setMediaTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [incompleteMediaItems, setIncompleteMediaItems] = useState([]);
    const [selectedKeyParent, setSelectedKeyParent] = useState(null);
    const [backgroundArt, setBackgroundArt] = useState('');
    const [maxQueueNumber, setMaxQueueNumber] = useState(0);

    useEffect(() => {
        const fetchMediaItems = async () => {
            try {
                const response = await axios.get('/api/getMediaItems');
                const mediaItems = response.data.mediaItems;

                // Extract unique media types and categories
                const uniqueMediaTypes = [...new Set(mediaItems.map(item => item.mediaType))];
                const uniqueCategories = [...new Set(mediaItems.map(item => item.category))];

                setMediaTypes(uniqueMediaTypes);
                setCategories(uniqueCategories);

                // Extract incomplete media items
                const incompleteItems = mediaItems.filter(item => !item.complete);
                setIncompleteMediaItems(incompleteItems);

                // Set max queue number
                const maxQueue = Math.max(...mediaItems.map(item => item.queueNumber));
                setMaxQueueNumber(maxQueue);
            } catch (error) {
                console.error("Failed to fetch media items:", error);
            }
        };

        fetchMediaItems();
    }, []);

    useEffect(() => {
        const fetchBackgroundArt = async () => {
            if (formData.mediaType && formData.title) {
                try {
                    const response = await axios.get('/api/tmdb', {
                        params: {
                            query: formData.title,
                            mediaType: formData.mediaType.toLowerCase()
                        }
                    });
                    const results = response.data.results;
                    if (results.length > 0) {
                        const backdropPath = results[0].backdrop_path;
                        if (backdropPath) {
                            setBackgroundArt(`https://image.tmdb.org/t/p/original${backdropPath}`);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch background art:", error);
                }
            }
        };

        fetchBackgroundArt();
    }, [formData.mediaType, formData.title]);

    const handleGoalDurationChange = (e) => {
        const goalDuration = Number(e.target.value);
        setFormData((prevData) => ({
            ...prevData,
            goalDuration
        }));
    };

    const handleSliderChange = (e) => {
        const value = Number(e.target.value);
        let percentComplete, completedDuration;
        let updatedAdditionalFields = { ...formData.additionalFields };

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

        if (name === 'keyParent') {
            const selectedItem = incompleteMediaItems.find(item => item._id === value);
            setSelectedKeyParent(selectedItem);
            setFormData((prevData) => ({
                ...prevData,
                goalDuration: selectedItem ? selectedItem.duration : 0,
                keyParent: selectedItem ? selectedItem.title : value // Save title if media item is selected
            }));
        } else if (name === 'category' || name === 'mediaType') {
            const totalCompletedTime = await fetchTotalCompletedTime(value);
            setFormData((prevData) => ({
                ...prevData,
                goalDuration: totalCompletedTime + formData.goalDuration
            }));
        }
    };

    const fetchTotalCompletedTime = async (keyParent) => {
        try {
            const response = await axios.get('/api/getMediaItems');
            const mediaItems = response.data.mediaItems;
            const totalCompletedTime = mediaItems
                .filter(item => item[keyParent] === keyParent)
                .reduce((acc, item) => acc + (item.complete ? item.duration : item.completedDuration), 0);
            return totalCompletedTime;
        } catch (error) {
            console.error("Failed to fetch total completed time:", error);
            return 0;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleDelete = async (id) => {
        try {
            const response = await axios.delete(`/api/deleteItem?id=${id}`);
            if (response.status === 200) {
                onCancel(); // Close the form after deletion
            } else {
                console.error('Failed to delete media item:', response.data.message);
            }
        } catch (error) {
            console.error('Error deleting media item:', error);
        }
    };

    const markAsComplete = async (id) => {
        try {
            const updatedData = {
                ...formData,
                percentComplete: 100,
                completedDuration: formData.duration,
                complete: true,
            };

            console.log('Updating item:', updatedData);

            const response = await axios.put('/api/updateItem', updatedData);

            if (response.status === 200) {
                console.log('Item marked as complete:', response.data.item);
                onSubmit(updatedData); // Update the parent component
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
                onSubmit(updatedData); // Update the parent component
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
                onSubmit(updatedData); // Update the parent component
            } else {
                console.error('Failed to move item to bottom:', response.data.message);
            }
        } catch (error) {
            console.error('Error moving item to bottom:', error);
        }
    };

    return (
        <div className="p-4 border rounded shadow" style={{ backgroundImage: `url(${backgroundArt})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <h2 className="text-xl font-bold mb-4">Update Media Item</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields */}
                <div>
                    <label className="block text-gray-700">Title:</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="border p-2 w-full rounded text-white-700 bg-[#222227] bg-opacity-20"
                    />
                </div>
                <div>
                    <label className="block text-gray-700">Duration:</label>
                    <input
                        type="text"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        className="border p-2 w-full rounded text-white-700 bg-opacity-20 bg-[#222227]"
                    />
                </div>
                <div>
                    <label className="block text-gray-700">Category:</label>
                    <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="border p-2 w-full rounded text-white-700  bg-[#222227] bg-opacity-20"
                    />
                </div>
                <div>
                    <label className="block text-gray-700">Media Type:</label>
                    <input
                        type="text"
                        name="mediaType"
                        value={formData.mediaType}
                        onChange={handleChange}
                        className="border p-2 w-full rounded text-white-700 bg-opacity-20 bg-[#222227]"
                    />
                </div>
                <div>
                    <label className="block text-gray-700">Description:</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="border p-2 w-full rounded text-white-700 bg-opacity-50 bg-[#222227]"
                    />
                </div>
                <div>
                    <label className="block text-gray-700">Percent Complete:</label>
                    <input
                        type="range"
                        name="percentComplete"
                        min="0"
                        max={formData.mediaType === 'Book' ? formData.additionalFields.pageCount : formData.mediaType === 'Show' ? formData.additionalFields.episodes : 100}
                        step="1"
                        value={formData.mediaType === 'Book' ? formData.additionalFields.pagesCompleted : formData.mediaType === 'Show' ? formData.additionalFields.episodesCompleted : formData.percentComplete}
                        onChange={handleSliderChange}
                        className="w-full"
                    />
                    <span>{formatCompletion()}</span>
                </div>
                <div>
                    <label className="block text-gray-700">Queue Number:</label>
                    <input
                        type="number"
                        name="queueNumber"
                        value={formData.queueNumber}
                        onChange={handleChange}
                        min="1"
                        max={maxQueueNumber}
                        className="border p-2 w-full rounded text-white-700 bg-opacity-20 bg-[#222227]"
                    />
                </div>
                <div>
                    <label className="block text-white-700">Locked:</label>
                    <input
                        type="checkbox"
                        name="locked"
                        checked={formData.locked}
                        onChange={handleChange}
                        className="mr-2"
                    />
                </div>
                {formData.locked && (
                    <>
                        <div>
                            <label className="block text-white-700">Key Parent:</label>
                            <select
                                name="keyParent"
                                value={formData.keyParent}
                                onChange={handleChange}
                                className="border p-2 w-full rounded text-white-700 bg-[#222227]"
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
                        {selectedKeyParent ? (
                            <div>
                                <label className="block text-gray-700">Goal Duration:</label>
                                <input
                                    type="range"
                                    name="goalDuration"
                                    min="0"
                                    max={selectedKeyParent.duration}
                                    value={formData.goalDuration}
                                    onChange={handleChange}
                                    className="w-full text-white-700 bg-[#222227]"
                                />
                                <span>{formData.goalDuration} minutes</span>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-white-700 ">Goal Duration:</label>
                                <input
                                    type="number"
                                    name="goalDuration"
                                    value={formData.goalDuration}
                                    onChange={handleGoalDurationChange}
                                    className="border p-2 w-full rounded text-white-700 bg-[#222227] opacity-20"
                                />
                                <span>{formData.goalDuration} minutes</span>
                            </div>
                        )}
                    </>
                )}
                <div className="flex space-x-4">
                    <button type="submit" className="bg-blue-500 text-white p-2 rounded mt-2">Update</button>
                    <button type="button" onClick={onCancel} className="bg-gray-500 text-white p-2 rounded mt-2">Cancel</button>
                    <button type="button" onClick={() => handleDelete(formData.id)} className="bg-red-500 text-white p-2 rounded mt-2">Delete</button>
                    {!formData.complete && (
                        <button type="button" onClick={() => markAsComplete(formData.id)} className="bg-green-500 text-white p-2 rounded mt-2">Mark as Complete</button>
                    )}
                    <button type="button" onClick={moveToTop} className="bg-yellow-500 text-white p-2 rounded mt-2">Move to Top</button>
                    <button type="button" onClick={moveToBottom} className="bg-yellow-500 text-white p-2 rounded mt-2">Move to Bottom</button>
                </div>
            </form>
        </div>
    );
};

export default UpdateForm;