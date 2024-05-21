import { useState } from 'react';

const MediaForm = ({ onSubmit }) => {
    const initialFormData = {
        title: '',
        duration: '',
        category: '',
        mediaType: '',
        description: '',
        additionalFields: {},
    };

    const [formData, setFormData] = useState(initialFormData);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleAdditionalFieldsChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            additionalFields: { ...formData.additionalFields, [name]: value },
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
        resetForm();
    };

    const resetForm = () => {
        setFormData(initialFormData);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded shadow">
            <input type="text" name="title" placeholder="Title" onChange={handleChange} value={formData.title} required className="border p-2 mb-2 w-full" />
            <input type="text" name="duration" placeholder="Duration" onChange={handleChange} value={formData.duration} required className="border p-2 mb-2 w-full" />
            <select name="category" onChange={handleChange} value={formData.category} required className="border p-2 mb-2 w-full">
                <option value="">Select Category</option>
                <option value="Fun">Fun</option>
                <option value="Learning">Learning</option>
                <option value="Work">Work</option>
                <option value="General">General</option>
            </select>
            <select name="mediaType" onChange={handleChange} value={formData.mediaType} required className="border p-2 mb-2 w-full">
                <option value="">Select Media Type</option>
                <option value="Movie">Movie</option>
                <option value="Show">Show</option>
                <option value="Book">Book</option>
                <option value="VideoGame">Video Game</option>
                <option value="MusicAlbum">Music Album</option>
            </select>
            <input type="text" name="description" placeholder="Description" onChange={handleChange} value={formData.description} className="border p-2 mb-2 w-full" />

            {formData.mediaType === 'Movie' && (
                <>
                    <input type="text" name="cast" placeholder="Cast" onChange={handleAdditionalFieldsChange} value={formData.additionalFields.cast || ''} className="border p-2 mb-2 w-full" />
                    <input type="text" name="director" placeholder="Director" onChange={handleAdditionalFieldsChange} value={formData.additionalFields.director || ''} className="border p-2 mb-2 w-full" />
                    <input type="text" name="crew" placeholder="Crew" onChange={handleAdditionalFieldsChange} value={formData.additionalFields.crew || ''} className="border p-2 mb-2 w-full" />
                </>
            )}
            {formData.mediaType === 'Show' && (
                <>
                    <input type="text" name="network" placeholder="Network" onChange={handleAdditionalFieldsChange} value={formData.additionalFields.network || ''} className="border p-2 mb-2 w-full" />
                    <input type="text" name="crew" placeholder="Crew" onChange={handleAdditionalFieldsChange} value={formData.additionalFields.crew || ''} className="border p-2 mb-2 w-full" />
                    <input type="text" name="cast" placeholder="Cast" onChange={handleAdditionalFieldsChange} value={formData.additionalFields.cast || ''} className="border p-2 mb-2 w-full" />
                    <input type="text" name="episodes" placeholder="Episodes" onChange={handleAdditionalFieldsChange} value={formData.additionalFields.episodes || ''} className="border p-2 mb-2 w-full" /> {/* number of episodes */}
                </>
            )}
            {formData.mediaType === 'Book' && (
                <>
                    <input type="text" name="author" placeholder="Author" onChange={handleAdditionalFieldsChange} value={formData.additionalFields.author || ''} className="border p-2 mb-2 w-full" />
                    <input type="text" name="publisher" placeholder="Publisher" onChange={handleAdditionalFieldsChange} value={formData.additionalFields.publisher || ''} className="border p-2 mb-2 w-full" />
                </>
            )}
            {/* Add more conditions for other media types as needed */}
            <button type="submit" className="bg-blue-500 text-white p-2 rounded mt-2">Add Media Item</button>
        </form>
    );
};

export default MediaForm;