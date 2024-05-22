// src/pages/search.js
import { useState } from 'react';
import MovieSearch from '@/components/MovieSearch';
import TvSearch from '@/components/TvSearch';
import Staging from '@/components/Staging';

const Search = () => {
    const [mediaType, setMediaType] = useState('movie');
    const [stagingItem, setStagingItem] = useState(null);

    const handleMediaTypeChange = (e) => {
        setMediaType(e.target.value);
    };

    const handleAdd = (item) => {
        const duration = mediaType === 'movie'
            ? item.runtime
            : item.number_of_episodes * (item.episode_run_time?.[0] || 0);

        const formData = {
            title: item.title || item.name,
            duration: duration || '',
            category: '', // Default category or let the user choose later
            mediaType: mediaType === 'movie' ? 'Movie' : 'Show',
            description: item.overview,
            additionalFields: {
                cast: item.credits?.cast?.slice(0, 3).map(cast => cast.name).join(', '),
                director: item.credits?.crew?.find(crew => crew.job === 'Director')?.name,
                network: item.networks?.map(network => network.name).join(', '),
                crew: item.credits?.crew?.slice(0, 3).map(crew => crew.name).join(', '),
                episodes: item.number_of_episodes,
            },
        };

        setStagingItem(formData);
    };

    const handleSubmit = async (formData) => {
        try {
            const response = await fetch('/api/newItem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                console.log('Media item added successfully');
                setStagingItem(null); // Clear staging item after successful submission
            } else {
                const errorData = await response.json();
                console.error('Error adding media item:', errorData.message);
            }
        } catch (error) {
            console.error('Error adding media item:', error);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Search</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <select value={mediaType} onChange={handleMediaTypeChange} className="border p-2 mb-4 w-full">
                        <option value="movie">Movie</option>
                        <option value="tv">TV Show</option>
                    </select>
                    {mediaType === 'movie' ? (
                        <MovieSearch onAdd={handleAdd} />
                    ) : (
                        <TvSearch onAdd={handleAdd} />
                    )}
                </div>
                {stagingItem && (
                    <div>
                        <Staging item={stagingItem} onSubmit={handleSubmit} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;