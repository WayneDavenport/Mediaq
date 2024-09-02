// src/components/VideoGameSearch.js
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setSearchResults, setStagingItem } from '@/store/slices/searchSlice';

const VideoGameSearch = () => {
    const [searchParams, setSearchParams] = useState({
        query: '',
    });
    const [results, setResults] = useState([]);
    const dispatch = useDispatch();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchParams({
            ...searchParams,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/rawg?query=${searchParams.query}`);
            const data = await response.json();
            setResults(data);
            dispatch(setSearchResults(data));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleAdd = (item) => {
        const duration = item.playtime * 60; // Convert playtime from hours to minutes
        const additionalFields = {
            publisher: item.publishers?.map(publisher => publisher.name).join(', '),
            developers: item.developers?.map(developer => developer.name).join(', '),
            coverArt: item.background_image, // Use the background image as cover art
            gameId: item.id
        };

        const formData = {
            title: item.name,
            duration: duration || '',
            category: '', // Default category or let the user choose later
            mediaType: 'VideoGame',
            description: item.description_raw,
            additionalFields: additionalFields,
        };

        dispatch(setStagingItem(formData));
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Search Video Games</h1>
            <form onSubmit={handleSubmit} className="mb-4">
                <input
                    type="text"
                    name="query"
                    placeholder="Title"
                    value={searchParams.query}
                    onChange={handleInputChange}
                    className="border p-2 mb-2 w-full"
                />
                <button type="submit" className="bg-blue-500 text-white p-2 rounded">Search</button>
            </form>
            <div className="space-y-4">
                {results.map((result, index) => (
                    <div key={index} className="border p-4 rounded shadow">
                        <h3 className="text-xl font-semibold">{result.name}</h3>
                        {result.background_image && (
                            <img src={result.background_image} alt={result.name} className="w-32 h-auto mb-2" /> // Display cover art
                        )}
                        <p className="text-gray-500">Description: {result.description_raw}</p>
                        <p className="text-gray-500">Publisher: {result.publishers?.map(publisher => publisher.name).join(', ')}</p>
                        <p className="text-gray-500">Developer: {result.developers?.map(developer => developer.name).join(', ')}</p>
                        <button onClick={() => handleAdd(result)} className="bg-green-500 text-white p-2 rounded mt-2">Add</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VideoGameSearch;