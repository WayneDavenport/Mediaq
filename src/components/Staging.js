// src/components/Staging.js
import { useState } from 'react';

const Staging = ({ item, onSubmit }) => {
    const [formData, setFormData] = useState({
        title: item.title || '',
        duration: item.duration || '',
        category: item.category || '',
        mediaType: item.mediaType || '',
        description: item.description || '',
        additionalFields: item.additionalFields || {},
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div>
            <h2>Review and Customize</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Title:</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label>Duration:</label>
                    <input
                        type="text"
                        name="duration"
                        value={formData.duration}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label>Category:</label>
                    <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label>Media Type:</label>
                    <input
                        type="text"
                        name="mediaType"
                        value={formData.mediaType}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label>Description:</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>
                {/* Add more fields as needed */}
                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default Staging;