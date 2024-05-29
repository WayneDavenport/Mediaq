import { useState, useEffect } from 'react';
import axios from 'axios';

const Staging = ({ item, onSubmit }) => {
    const [formData, setFormData] = useState({
        title: item.title || '',
        duration: item.duration || '',
        category: item.category || '',
        mediaType: item.mediaType || '',
        description: item.description || '',
        additionalFields: item.additionalFields || {},
        locked: item.locked || false, // New field
        keyParent: '', // New field for key parent
        goalDuration: 0 // New field for goal duration
    });

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

    const handleChange = (e) => {
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
                goalDuration: selectedItem ? selectedItem.duration : 0
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        onSubmit(formData);
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
                        {selectedKeyParent && (
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
                        )}
                    </>
                )}
                <button type="submit" className="bg-blue-500 text-white p-2 rounded mt-2">Submit</button>
            </form>
        </div>
    );
};

export default Staging;