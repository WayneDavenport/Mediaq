import { useState, useEffect } from 'react';
import axios from 'axios';

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
        locked: item.locked || false, // Add locked field
        keyParent: item.keyParent || '', // Add keyParent field
        goalDuration: item.goalDuration || 0 // Add goalDuration field
    });

    const [mediaTypes, setMediaTypes] = useState([]);
    const [categories, setCategories] = useState([]);

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
    };

    const handleSliderChange = (e) => {
        const percentComplete = Number(e.target.value);
        const completedDuration = (percentComplete / 100) * formData.duration;
        setFormData((prevData) => ({
            ...prevData,
            percentComplete,
            completedDuration
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const calculateCompleted = () => {
        if (formData.mediaType === 'Book') {
            return Math.ceil((formData.percentComplete / 100) * formData.additionalFields.pageCount);
        } else if (formData.mediaType === 'Show') {
            return Math.ceil((formData.percentComplete / 100) * formData.additionalFields.episodes);
        }
        return formData.percentComplete;
    };

    return (
        <div className="p-4 border rounded shadow">
            <h2 className="text-xl font-bold mb-4">Update Media Item</h2>
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
                    <label className="block text-gray-700">Percent Complete:</label>
                    <input
                        type="range"
                        name="percentComplete"
                        min="0"
                        max="100"
                        value={formData.percentComplete}
                        onChange={handleSliderChange}
                        className="w-full"
                    />
                    <span>{formData.percentComplete}%</span>
                    {formData.mediaType === 'Book' && (
                        <p>{calculateCompleted()} pages completed</p>
                    )}
                    {formData.mediaType === 'Show' && (
                        <p>{calculateCompleted()} episodes completed</p>
                    )}
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
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700">Goal Duration:</label>
                    <input
                        type="number"
                        name="goalDuration"
                        value={formData.goalDuration}
                        onChange={handleChange}
                        className="border p-2 w-full rounded"
                    />
                </div>
                <div className="flex space-x-4">
                    <button type="submit" className="bg-blue-500 text-white p-2 rounded mt-2">Update</button>
                    <button type="button" onClick={onCancel} className="bg-gray-500 text-white p-2 rounded mt-2">Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default UpdateForm;