import { useState } from 'react';

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
        lockCondition: item.lockCondition || { type: 'None', value: 'None', duration: 0 },
        goalCompletionTime: item.goalCompletionTime || 0,
        completedDuration: item.completedDuration || 0
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
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

    const handleLockConditionChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            lockCondition: {
                ...prevData.lockCondition,
                [name]: value
            }
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
                    <label className="block text-gray-700">Lock Condition Type:</label>
                    <select
                        name="type"
                        value={formData.lockCondition.type}
                        onChange={handleLockConditionChange}
                        className="border p-2 w-full rounded"
                    >
                        <option value="">None</option>
                        <option value="mediaItem">Media Item</option>
                        <option value="categoryTime">Category Time</option>
                        <option value="mediaTypeTime">Media Type Time</option>
                    </select>
                </div>
                {formData.lockCondition.type && (
                    <>
                        <div>
                            <label className="block text-gray-700">Lock Condition Value:</label>
                            <input
                                type="text"
                                name="value"
                                value={formData.lockCondition.value}
                                onChange={handleLockConditionChange}
                                className="border p-2 w-full rounded"
                            />
                        </div>
                        {formData.lockCondition.type !== 'mediaItem' && (
                            <div>
                                <label className="block text-gray-700">Lock Condition Duration (minutes):</label>
                                <input
                                    type="number"
                                    name="duration"
                                    value={formData.lockCondition.duration}
                                    onChange={handleLockConditionChange}
                                    className="border p-2 w-full rounded"
                                />
                            </div>
                        )}
                    </>
                )}
                <div className="flex space-x-4">
                    <button type="submit" className="bg-blue-500 text-white p-2 rounded mt-2">Update</button>
                    <button type="button" onClick={onCancel} className="bg-gray-500 text-white p-2 rounded mt-2">Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default UpdateForm;