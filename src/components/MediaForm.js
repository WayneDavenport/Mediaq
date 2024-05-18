import { useState } from 'react';

const MediaForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
        title: '',
        duration: '',
        category: '',
        mediaType: '', // Add mediaType to formData
        additionalFields: {},
    });

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
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" name="title" placeholder="Title" onChange={handleChange} required />
            <input type="text" name="duration" placeholder="Duration" onChange={handleChange} required />
            <select name="category" onChange={handleChange} required>
                <option value="">Select Category</option>
                <option value="Fun">Fun</option>
                <option value="Learning">Learning</option>
                <option value="Work">Work</option>
                <option value="General">General</option>
            </select>
            <select name="mediaType" onChange={handleChange} required>
                <option value="">Select Media Type</option>
                <option value="Movie">Movie</option>
                <option value="Show">Show</option>
                <option value="Book">Book</option>
                <option value="VideoGame">Video Game</option>
                <option value="MusicAlbum">Music Album</option>
            </select>

            {formData.mediaType === 'Movie' && (
                <>
                    <input type="text" name="actors" placeholder="Actors" onChange={handleAdditionalFieldsChange} />
                    <input type="text" name="director" placeholder="Director" onChange={handleAdditionalFieldsChange} />
                </>
            )}
            {formData.mediaType === 'Show' && (
                <>
                    <input type="text" name="network" placeholder="Network" onChange={handleAdditionalFieldsChange} />
                    <input type="text" name="producer" placeholder="Producer" onChange={handleAdditionalFieldsChange} />
                </>
            )}
            {formData.mediaType === 'Book' && (
                <>
                    <input type="text" name="author" placeholder="Author" onChange={handleAdditionalFieldsChange} />
                    <input type="text" name="publisher" placeholder="Publisher" onChange={handleAdditionalFieldsChange} />
                </>
            )}
            {/* Add more conditions for other media types as needed */}
            <button type="submit">Add Media Item</button>
        </form>
    );
};

export default MediaForm;