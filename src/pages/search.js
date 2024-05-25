// src/pages/search.js
import { useState } from 'react';
import MovieSearch from '@/components/MovieSearch';
import TvSearch from '@/components/TvSearch';
import Staging from '@/components/Staging';
import BookSearch from '@/components/BookSearch';
import VideoGameSearch from '@/components/VideoGameSearch';
import { useSession } from 'next-auth/react';

const Search = () => {
    const [mediaType, setMediaType] = useState('movie');
    const [stagingItem, setStagingItem] = useState(null);
    const { data: session } = useSession();

    const handleMediaTypeChange = (e) => {
        setMediaType(e.target.value);
    };

    const handleAdd = (item) => {
        let duration;
        let additionalFields = {};

        if (mediaType === 'movie') {
            duration = item.runtime;
            additionalFields = {
                cast: item.credits?.cast?.slice(0, 3).map(cast => cast.name).join(', '),
                director: item.credits?.crew?.find(crew => crew.job === 'Director')?.name,
            };
        } else if (mediaType === 'tv') {
            duration = item.number_of_episodes * (item.episode_run_time?.[0] || 0);
            additionalFields = {
                cast: item.credits?.cast?.slice(0, 3).map(cast => cast.name).join(', '),
                network: item.networks?.map(network => network.name).join(', '),
                crew: item.credits?.crew?.slice(0, 3).map(crew => crew.name).join(', '),
                episodes: item.number_of_episodes,
            };
        } else if (mediaType === 'book') {
            const readingSpeed = session?.user?.readingSpeed || 20; // Default to 20 if not provided
            duration = Math.ceil(item.pageCount / readingSpeed * 30); // Calculate duration in minutes
            additionalFields = {
                authors: item.authors?.join(', '),
                publisher: item.publisher,
                pageCount: item.pageCount,
            };
        } else if (mediaType === 'videoGame') {
            duration = item.playtime * 60; // Convert playtime from hours to minutes
            additionalFields = {
                publisher: item.publisher,
            };
        }

        const formData = {
            title: item.title || item.name,
            duration: duration || '',
            category: '', // Default category or let the user choose later
            mediaType: mediaType === 'movie' ? 'Movie' : mediaType === 'tv' ? 'Show' : mediaType === 'book' ? 'Book' : 'VideoGame',
            description: item.description || item.overview,
            additionalFields: additionalFields,
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
                        <option value="book">Book</option>
                        <option value="videoGame">Video Game</option>
                    </select>
                    {mediaType === 'movie' && <MovieSearch onAdd={handleAdd} />}
                    {mediaType === 'tv' && <TvSearch onAdd={handleAdd} />}
                    {mediaType === 'book' && <BookSearch onAdd={handleAdd} />}
                    {mediaType === 'videoGame' && <VideoGameSearch onAdd={handleAdd} />}
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