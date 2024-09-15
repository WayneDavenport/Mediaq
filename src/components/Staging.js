// src/components/Staging.js
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearSearchItem } from '@/store/slices/searchSlice';
import axios from 'axios';

const Staging = ({ onSubmit }) => {
    const stagingItem = useSelector((state) => state.search.stagingItem);
    const session = useSelector((state) => state.session);
    const readingSpeed = session?.user?.readingSpeed || 20; // pages per 30 minutes
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        title: '',
        queueNumber: 0,
        duration: '',
        completedDuration: 0,
        percentComplete: 0,
        category: '',
        mediaType: '',
        description: '',
        posterPath: '',
        backdropPath: '',
        additionalFields: {},
        locked: false,
        keyParent: '',
        goalTime: 0,
        goalPages: 0,
        goalEpisodes: 0
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
                posterPath: stagingItem.posterPath || '',
                backdropPath: stagingItem.backdropPath || '',
                additionalFields: stagingItem.additionalFields || {},
                locked: false,
                lockedItemName: stagingItem.title,
                keyParent: '',
                goalTime: 0,
                goalPages: 0,
                goalEpisodes: 0
            });
        }
    }, [stagingItem]);

    const [categories, setCategories] = useState([]);
    const [incompleteMediaItems, setIncompleteMediaItems] = useState([]);
    const [selectedKeyParent, setSelectedKeyParent] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/api/getMediaItems');
                const mediaItems = response.data.mediaItems;

                // Extract unique categories
                const uniqueCategories = [...new Set(mediaItems.map(item => item.category))];
                setCategories(uniqueCategories);
                setIncompleteMediaItems(mediaItems.filter(item => !item.complete));
            } catch (error) {
                console.error("Failed to fetch media items:", error);
            }
        };

        fetchCategories();
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
                keyParent: selectedItem ? selectedItem.title : value,
                goalTime: selectedItem ? selectedItem.duration : 0,
                goalPages: selectedItem && selectedItem.mediaType === 'Book' ? selectedItem.additionalFields.pageCount : 0,
                goalEpisodes: selectedItem && selectedItem.mediaType === 'Show' ? selectedItem.additionalFields.episodes : 0
            }));
        }
    };

    const handleGoalChange = (e) => {
        const { name, value } = e.target;
        const goalValue = Number(value);

        if (name === 'goalPages') {
            setFormData((prevData) => ({
                ...prevData,
                goalPages: goalValue,
                goalTime: Math.round((goalValue / readingSpeed) * 30) // Calculate time based on reading speed
            }));
        } else if (name === 'goalEpisodes') {
            setFormData((prevData) => ({
                ...prevData,
                goalEpisodes: goalValue,
                goalTime: selectedKeyParent ? Math.round((goalValue / selectedKeyParent.additionalFields.episodes) * selectedKeyParent.duration) : prevData.goalTime
            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                goalTime: goalValue
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        dispatch(clearSearchItem()); // Clear the staging item after submission
    };
    const handleClear = () => {
        dispatch(clearSearchItem());
    }

    if (!stagingItem) {
        return null; // If there's no staging item, don't render the component
    }
    const mediaTypes = ['Book', 'Movie', 'Show', 'VideoGame']
    const presetCategories = ['fun', 'learning', 'hobby', 'productivity', 'general'];

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
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="border p-2 w-full rounded"
                    >
                        <option value="">Select Category</option>
                        {presetCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-gray-700">Media Type:</label>
                    <input
                        type="text"
                        name="mediaType"
                        value={formData.mediaType}
                        readOnly
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
                    <label className="block text-gray-700">Additional Fields:</label>
                    <textarea
                        name="additionalFields"
                        value={JSON.stringify(formData.additionalFields)}
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
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Categories">
                                    {categories.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Your Media Items">
                                    {incompleteMediaItems.map((item) => (
                                        <option key={item._id} value={item._id}>
                                            {item.title}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        {selectedKeyParent && (
                            <div>
                                <label className="block text-gray-700">
                                    {selectedKeyParent.mediaType === 'Book' ? 'Goal Pages:' : 'Goal Time:'}
                                </label>
                                {selectedKeyParent.mediaType === 'Book' ? (
                                    <>
                                        <input
                                            type="number"
                                            name="goalPages"
                                            min="0"
                                            max={10000}
                                            value={formData.goalPages}
                                            onChange={handleGoalChange}
                                            className="w-full"
                                        />
                                        <span>
                                            {formData.goalPages} pages (
                                            {Math.round((formData.goalPages / readingSpeed) * 30)} minutes)
                                        </span>
                                    </>
                                ) : selectedKeyParent.mediaType === 'Show' ? (
                                    <>
                                        <input
                                            type="range"
                                            name="goalEpisodes"
                                            min="0"
                                            max={selectedKeyParent.additionalFields.episodes}
                                            value={formData.goalEpisodes}
                                            onChange={handleGoalChange}
                                            className="w-full"
                                        />
                                        <span>
                                            {formData.goalEpisodes} episodes (
                                            {Math.round(
                                                (formData.goalEpisodes /
                                                    selectedKeyParent.additionalFields.episodes) *
                                                selectedKeyParent.duration
                                            )}{' '}
                                            minutes)
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <input
                                            type="number"
                                            name="goalTime"
                                            value={formData.goalTime}
                                            onChange={handleGoalChange}
                                            className="border p-2 w-full rounded"
                                        />
                                        <span>{formData.goalTime} minutes</span>
                                    </>
                                )}
                            </div>
                        )}
                        {!selectedKeyParent && (
                            <div>
                                <label className="block text-gray-700">
                                    {formData.keyParent === 'Book'
                                        ? 'Goal Pages & Time:'
                                        : 'Goal Time:'}
                                </label>
                                {formData.keyParent === 'Book' ? (
                                    <>
                                        <input
                                            type="number"
                                            name="goalPages"
                                            min="0"
                                            max={10000}
                                            value={formData.goalPages}
                                            onChange={handleGoalChange}
                                            className="w-full"
                                        />
                                        <span>
                                            {formData.goalPages} pages (
                                            {Math.round((formData.goalPages / readingSpeed) * 30)} minutes)
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <input
                                            type="number"
                                            name="goalTime"
                                            value={formData.goalTime}
                                            onChange={handleGoalChange}
                                            className="border p-2 w-full rounded"
                                        />
                                        <span>{formData.goalTime} minutes</span>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}

                <div className="flex space-x-4">
                    <button type="submit" className="bg-blue-500 text-white p-2 rounded mt-2">Submit</button>
                </div>
                <div className="flex space-x-4">
                    <button type="button" onClick={handleClear} className="bg-blue-500 text-white p-2 rounded mt-2">Clear</button>
                </div>
            </form>
        </div>
    );
};

export default Staging;