// components/MovieSearch.js
import { useState } from 'react';

const MovieSearch = ({ onAdd }) => {
    const [searchParams, setSearchParams] = useState({
        query: '',
        language: 'en-US',
        include_adult: false,
    });
    const [results, setResults] = useState([]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSearchParams({
            ...searchParams,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/tmdb?mediaType=movie&query=${searchParams.query}&language=${searchParams.language}&include_adult=${searchParams.include_adult}`);
            const data = await response.json();
            setResults(data.results);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Search Movies</h1>
            <form onSubmit={handleSubmit} className="mb-4">
                <input
                    type="text"
                    name="query"
                    placeholder="Title"
                    value={searchParams.query}
                    onChange={handleInputChange}
                    required
                    className="border p-2 mb-2 w-full"
                />
                <input
                    type="text"
                    name="language"
                    placeholder="Language"
                    value={searchParams.language}
                    onChange={handleInputChange}
                    className="border p-2 mb-2 w-full"
                />
                <label className="flex items-center mb-2">
                    <input
                        type="checkbox"
                        name="include_adult"
                        checked={searchParams.include_adult}
                        onChange={handleInputChange}
                        className="mr-2"
                    />
                    Include Adult Content
                </label>
                <button type="submit" className="bg-blue-500 text-white p-2 rounded">Search</button>
            </form>
            <div className="space-y-4">
                {results.map((result) => (
                    <div key={result.id} className="border p-4 rounded shadow">
                        <h3 className="text-xl font-semibold">{result.title}</h3>
                        <p className="text-gray-700">{result.overview}</p>
                        <p className="text-gray-500">Release Date: {result.release_date}</p>
                        <p className="text-gray-500">Language: {result.original_language}</p>
                        <p className="text-gray-500">Vote Average: {result.vote_average}</p>
                        <p className="text-gray-500">Vote Count: {result.vote_count}</p>
                        {result.credits && (
                            <div className="mt-4">
                                <h4 className="font-semibold">Cast:</h4>
                                <ul className="list-disc list-inside">
                                    {result.credits.cast.slice(0, 3).map((castMember) => (
                                        <li key={castMember.cast_id}>{castMember.name} as {castMember.character}</li>
                                    ))}
                                </ul>
                                <h4 className="font-semibold mt-2">Crew:</h4>
                                <ul className="list-disc list-inside">
                                    {result.credits.crew
                                        .filter((crewMember) => crewMember.job === 'Director' || crewMember.job === 'Producer')
                                        .map((crewMember) => (
                                            <li key={crewMember.credit_id}>{crewMember.name} - {crewMember.job}</li>
                                        ))}
                                </ul>
                            </div>
                        )}
                        <button onClick={() => onAdd(result)} className="bg-green-500 text-white p-2 rounded mt-2">Add</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MovieSearch;