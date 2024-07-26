// pages/api/updateItem.js
import { connectToMongoose } from '@/lib/db';
import MediaItem from '@/models/MediaItem';
import { requireAuth } from '@/middleware/auth';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    await requireAuth(req, res, async () => {
        const { id, title, duration, category, mediaType, description, additionalFields, percentComplete, completedDuration, complete, locked, keyParent, goalDuration } = req.body;

        if (!id || !title || !duration || !category || !mediaType) {
            return res.status(422).json({
                message: 'Invalid input - id, title, duration, category, and mediaType are required.',
            });
        }

        try {
            console.log("Connecting to Mongoose...");
            await connectToMongoose();
            console.log("Connected to Mongoose");

            const mediaItem = await MediaItem.findById(id);

            if (!mediaItem) {
                return res.status(404).json({ message: 'Media item not found' });
            }

            mediaItem.title = title;
            mediaItem.duration = duration;
            mediaItem.category = category;
            mediaItem.mediaType = mediaType;
            mediaItem.description = description;
            mediaItem.additionalFields = additionalFields;
            mediaItem.percentComplete = percentComplete;
            mediaItem.completedDuration = completedDuration;
            mediaItem.complete = complete;
            mediaItem.locked = locked; // Add locked field
            mediaItem.keyParent = keyParent; // Add keyParent field
            mediaItem.goalDuration = goalDuration; // Add goalDuration field

            // Calculate the total completed duration for the key parent
            let totalCompletedDuration = 0;
            if (keyParent) {
                const filter = { userId: req.user.id, [keyParent]: req.body[keyParent] };
                const items = await MediaItem.find(filter);
                totalCompletedDuration = items.reduce((acc, item) => acc + (item.complete ? item.duration : item.completedDuration), 0);
            }

            // Ensure goalDuration is a valid number
            const validGoalDuration = isNaN(goalDuration) ? 0 : goalDuration;
            mediaItem.goalCompletionTime = totalCompletedDuration + validGoalDuration; // Calculate goalCompletionTime

            console.log(`Total Completed Duration: ${totalCompletedDuration}`);
            console.log(`Goal Duration: ${validGoalDuration}`);
            console.log(`Goal Completion Time: ${mediaItem.goalCompletionTime}`);

            mediaItem.updatedAt = new Date();

            console.log("Updating item in database...");
            const result = await mediaItem.save();
            console.log("Item updated:", result);

            // Calculate the total completed duration for the key parent
            const filter = {
                userId: req.user.id,
                locked: true,
                $or: [
                    { keyParent: mediaType },
                    { keyParent: category },
                    { keyParent: title } // Include media items by their title
                ]
            };
            console.log(`Filter: ${JSON.stringify(filter)}`);
            const lockedItems = await MediaItem.find(filter);
            console.log(`Locked items found: ${lockedItems.length}`);

            for (const lockedItem of lockedItems) {
                const keyParentFilter = {
                    userId: req.user.id,
                    $or: [
                        { mediaType: lockedItem.keyParent },
                        { category: lockedItem.keyParent },
                        { title: lockedItem.keyParent } // Include media items by their title
                    ]
                };
                const items = await MediaItem.find(keyParentFilter);
                const totalCompletedDuration = items.reduce((acc, item) => acc + (item.complete ? item.duration : item.completedDuration), 0);

                console.log(`Total Completed Duration for ${lockedItem.keyParent}: ${totalCompletedDuration}`);
                console.log(`Goal Completion Time for ${lockedItem.keyParent}: ${lockedItem.goalCompletionTime}`);

                // Check if the total completed duration is greater than or equal to the goal completion time
                if (totalCompletedDuration >= lockedItem.goalCompletionTime) {
                    lockedItem.locked = false;
                    console.log(`Unlocking item ${lockedItem._id} as total completed duration meets or exceeds goal completion time.`);
                    await lockedItem.save();
                }
            }

            res.status(200).json({ message: 'Updated item!', item: result });
        } catch (error) {
            console.error("Failed to update item:", error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}




////////////////////////

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

/* export default UpdateForm; */