// src/pages/search.js
import { useState } from 'react';
import MediaForm from "@/components/MediaForm";
import MovieSearch from '@/components/MovieSearch';
import TvSearch from '@/components/TvSearch';
import Staging from '@/components/Staging';
import BookSearch from '@/components/BookSearch';
import VideoGameSearch from '@/components/VideoGameSearch';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSelector } from 'react-redux';

const Search = () => {
    const [mediaType, setMediaType] = useState('movie');
    const { data: session } = useSession();
    const stagingItem = useSelector((state) => state.search.stagingItem);

    const handleMediaTypeChange = (e) => {
        setMediaType(e.target.value);
    };

    const handleFormSubmit = async (formData) => {
        // Optimistically update the UI
        const tempId = Date.now().toString(); // Temporary ID for the new item
        const optimisticItem = {
            ...formData,
            _id: tempId,
            complete: false, // Ensure default values
            completedDuration: 0, // Ensure default values
            userEmail: session.user.email, // Ensure userEmail is set
            userId: session.user.id // Ensure userId is set
        };
        console.log('Optimistic Item:', optimisticItem); // Log optimistic item

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
            } else {
                const errorData = await response.json();
                console.error('Error adding media item:', errorData.message);
            }
        } catch (error) {
            console.error('Error adding media item:', error);
        }
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
            {/*             <h2 className="text-2xl font-bold mb-4">Add Custom</h2>
             <MediaForm onSubmit={handleFormSubmit} />  */}
            <br /><br />
            <h1 className="text-2xl text-white font-bold mb-4">Search</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-white-700 bg-[#222227] ">
                <div>
                    <select value={mediaType} onChange={handleMediaTypeChange} className="border p-2 mb-4 w-full text-white-700 bg-[#222227]">
                        <option value="movie">Movie</option>
                        <option value="tv">TV Show</option>
                        <option value="book">Book</option>
                        <option value="videoGame">Video Game</option>
                    </select>
                    {mediaType === 'movie' && <MovieSearch />}
                    {mediaType === 'tv' && <TvSearch />}
                    {mediaType === 'book' && <BookSearch />}
                    {mediaType === 'videoGame' && <VideoGameSearch />}
                </div>
                {!stagingItem ? (<div className="text-white text-2xl h-8 align-middle justify-center"><p>Search here for any books, movies, shows, or video games to add to your media queue!</p></div>) : (
                    <div>
                        <Staging onSubmit={handleSubmit} />
                    </div>
                )}
            </div>
            <br /><br />
            <Link href='/user-main' className="bg-green-500 text-white p-2 rounded mt-8" >Dashboard</Link>
        </div>
    );
};

export default Search;