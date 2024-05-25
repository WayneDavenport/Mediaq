// components/VideoGameSearch.js
import { useState } from 'react';

const VideoGameSearch = ({ onAdd }) => {
    const [searchParams, setSearchParams] = useState({
        query: '',
    });
    const [results, setResults] = useState([]);

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
            setResults(data.games);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
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
                        <h3 className="text-xl font-semibold">{result.title}</h3>
                        <p className="text-gray-500">Publisher: {result.publisher}</p>
                        <p className="text-gray-500">Playtime: {result.playtime} hours</p>
                        <button onClick={() => onAdd(result)} className="bg-green-500 text-white p-2 rounded mt-2">Add</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VideoGameSearch;