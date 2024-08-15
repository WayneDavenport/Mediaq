// src/components/UpdateForm.js
import { useDispatch, useSelector } from 'react-redux';
import { clearSelectedMediaItem } from '@/store/slices/selectedMediaItemSlice';
import useFormState from '@/hooks/useFormState';
import FormField from '@/components/FormField';

const UpdateForm = ({ onCancel }) => {
    const dispatch = useDispatch();
    const item = useSelector((state) => state.selectedMediaItem);
    const {
        formData,
        mediaTypes,
        categories,
        incompleteMediaItems,
        selectedKeyParent,
        backgroundArt,
        maxQueueNumber,
        handleSliderChange,
        handleChange,
        setFormData
    } = useFormState(item);

    const getInitialFormData = () => ({
        id: '',
        title: '',
        duration: '',
        category: '',
        mediaType: '',
        description: '',
        additionalFields: {},
        percentComplete: 0,
        completedDuration: 0,
        queueNumber: 0
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/updateItem', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                console.log('Media item updated successfully');
                dispatch(clearSelectedMediaItem());
                setFormData(getInitialFormData());
            } else {
                const errorData = await response.json();
                console.error('Error updating media item:', errorData.message);
            }
        } catch (error) {
            console.error('Error updating media item:', error);
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
                dispatch(clearSelectedMediaItem());
                setFormData(getInitialFormData());
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

    return (
        <div className="p-4 border rounded shadow background-image-container" style={{ '--background-image-url': `url(${backgroundArt})` }}>
            <h2 className="text-xl font-bold mb-4">Update Media Item</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Title" name="title" value={formData.title} onChange={handleChange} />
                <FormField label="Duration" name="duration" value={formData.duration} onChange={handleChange} />
                <FormField label="Category" name="category" value={formData.category} onChange={handleChange} />
                <FormField label="Media Type" name="mediaType" value={formData.mediaType} onChange={handleChange} />
                <FormField label="Description" name="description" value={formData.description} onChange={handleChange} type="textarea" />
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
                <FormField label="Queue Number" name="queueNumber" value={formData.queueNumber} onChange={handleChange} type="number" min="1" max={maxQueueNumber} />
                {/* Inert fields for goal completion time, key parent, and locking */}
                <div style={{ display: 'none' }}>
                    <label className="block text-gray-700">Locked:</label>
                    <input
                        type="checkbox"
                        name="locked"
                        checked={false}
                        onChange={() => { }}
                        className="mr-2"
                    />
                </div>
                <div style={{ display: 'none' }}>
                    <label className="block text-gray-700">Key Parent:</label>
                    <select
                        name="keyParent"
                        value=""
                        onChange={() => { }}
                        className="border p-2 w-full rounded"
                    >
                        <option value="">Select Key Parent</option>
                    </select>
                </div>
                <div style={{ display: 'none' }}>
                    <label className="block text-gray-700">Goal Duration:</label>
                    <input
                        type="number"
                        name="goalDuration"
                        value={0}
                        onChange={() => { }}
                        className="border p-2 w-full rounded"
                    />
                </div>
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