import { useState } from 'react';

const MediaForm = ({ onSubmit }) => {
    const initialFormData = {
        title: '',
        duration: '',
        category: '',
        mediaType: '',
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
        <form onSubmit={handleSubmit}>
            <input type="text" name="title" placeholder="Title" onChange={handleChange} value={formData.title} required />
            <input type="text" name="duration" placeholder="Duration" onChange={handleChange} value={formData.duration} required />
            <select name="category" onChange={handleChange} value={formData.category} required>
                <option value="">Select Category</option>
                <option value="Fun">Fun</option>
                <option value="Learning">Learning</option>
                <option value="Work">Work</option>
                <option value="General">General</option>
            </select>
            <select name="mediaType" onChange={handleChange} value={formData.mediaType} required>
                <option value="">Select Media Type</option>
                <option value="Movie">Movie</option>
                <option value="Show">Show</option>
                <option value="Book">Book</option>
                <option value="VideoGame">Video Game</option>
                <option value="MusicAlbum">Music Album</option>
            </select>

            {formData.mediaType === 'Movie' && (
                <>
                    <input type="text" name="actors" placeholder="Actors" onChange={handleAdditionalFieldsChange} value={formData.additionalFields.actors || ''} />
                    <input type="text" name="director" placeholder="Director" onChange={handleAdditionalFieldsChange} value={formData.additionalFields.director || ''} />
                </>
            )}
            {formData.mediaType === 'Show' && (
                <>
                    <input type="text" name="network" placeholder="Network" onChange={handleAdditionalFieldsChange} value={formData.additionalFields.network || ''} />
                    <input type="text" name="producer" placeholder="Producer" onChange={handleAdditionalFieldsChange} value={formData.additionalFields.producer || ''} />
                </>
            )}
            {formData.mediaType === 'Book' && (
                <>
                    <input type="text" name="author" placeholder="Author" onChange={handleAdditionalFieldsChange} value={formData.additionalFields.author || ''} />
                    <input type="text" name="publisher" placeholder="Publisher" onChange={handleAdditionalFieldsChange} value={formData.additionalFields.publisher || ''} />
                </>
            )}
            {/* Add more conditions for other media types as needed */}
            <button type="submit">Add Media Item</button>
        </form>
    );
};

export default MediaForm;