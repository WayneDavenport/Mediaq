// src/components/StagingOld.js
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const Staging = ({ onSubmit }) => {
    const stagingItem = useSelector((state) => state.search.stagingItem);
    const [formData, setFormData] = useState({
        title: '',
        queueNumber: 0,
        duration: '',
        completedDuration: 0,
        percentComplete: 0,
        category: '',
        mediaType: '',
        description: '',
        additionalFields: {},
        locked: false,
        keyParent: '',
        goalDuration: 0,
        keyParentProgress: 0 // Add keyParentProgress to the form data
    });

    useEffect(() => {
        if (stagingItem) {
            setFormData({
                title: stagingItem.title || '',
                queueNumber: stagingItem.queueNumber || 0,
                duration: stagingItem.duration || '',
                completedDuration: 0,
                percentComplete: 0,
                category: stagingItem.category || '',
                mediaType: stagingItem.mediaType || '',
                description: stagingItem.description || '',
                additionalFields: stagingItem.additionalFields || {},
                locked: stagingItem.locked || false,
                keyParent: '',
                goalDuration: 0,
                keyParentProgress: 0
            });
        }
    }, [stagingItem]);

    const [mediaTypes, setMediaTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [incompleteMediaItems, setIncompleteMediaItems] = useState([]);
    const [selectedKeyParent, setSelectedKeyParent] = useState(null);

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
            } catch (error) {
                console.error("Failed to fetch media items:", error);
            }
        };

        fetchMediaItems();
    }, []);

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

    const handleSliderChange = (e) => {
        const goalDuration = Number(e.target.value);
        setFormData((prevData) => ({
            ...prevData,
            goalDuration
        }));
    };

    const handleGoalDurationChange = (e) => {
        const goalDuration = Number(e.target.value);
        setFormData((prevData) => ({
            ...prevData,
            goalDuration
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isCategoryOrMediaType(formData.keyParent)) {
            const totalCompletedTime = await fetchTotalCompletedTime(formData.keyParent);
            const updatedGoalDuration = totalCompletedTime + formData.goalDuration;
            setFormData((prevData) => ({
                ...prevData,
                goalDuration: updatedGoalDuration
            }));
        }

        onSubmit(formData);
    };

    const isCategoryOrMediaType = (keyParent) => {
        // Assuming categories and media types are strings and item IDs are ObjectIds
        return typeof keyParent === 'string' && !keyParent.match(/^[0-9a-fA-F]{24}$/);
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



    return (
        <div className="p-4 border rounded shadow">
            <h2 className="text-xl font-bold mb-4">Review and Customize</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700">Title:</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="border p-2 w-full rounded"
                    />
                </div>
                <div>
                    <label className="block text-gray-700">Duration:</label>
                    <input
                        type="text"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        className="border p-2 w-full rounded"
                    />
                </div>
                <div>
                    <label className="block text-gray-700">Category:</label>
                    <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="border p-2 w-full rounded"
                    />
                </div>
                <div>
                    <label className="block text-gray-700">Media Type:</label>
                    <input
                        type="text"
                        name="mediaType"
                        value={formData.mediaType}
                        onChange={handleChange}
                        className="border p-2 w-full rounded"
                    />
                </div>
                <div>
                    <label className="block text-gray-700">Description:</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="border p-2 w-full rounded"
                    />
                </div>
                <div>
                    <label className="block text-gray-700">Locked:</label>
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
                            <label className="block text-gray-700">Key Parent:</label>
                            <select
                                name="keyParent"
                                value={formData.keyParent}
                                onChange={handleChange}
                                className="border p-2 w-full rounded"
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
                                    onChange={handleSliderChange}
                                    className="w-full"
                                />
                                <span>{formData.goalDuration} minutes</span>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-gray-700">Goal Duration:</label>
                                <input
                                    type="number"
                                    name="goalDuration"
                                    value={formData.goalDuration}
                                    onChange={handleGoalDurationChange}
                                    className="border p-2 w-full rounded"
                                />
                                <span>{formData.goalDuration} minutes</span>
                            </div>
                        )}
                    </>
                )}
                <div className="flex space-x-4">
                    <button type="submit" className="bg-blue-500 text-white p-2 rounded mt-2">Submit</button>
                </div>
            </form>
        </div>
    );
};

export default StagingOld;