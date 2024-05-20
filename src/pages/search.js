// pages/search.js
import { useState } from 'react';

const Search = () => {
    const [mediaType, setMediaType] = useState('movie');
    const [searchParams, setSearchParams] = useState({
        title: '',
        genre: '',
        year: '',
    });
    const [results, setResults] = useState([]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchParams({ ...searchParams, [name]: value });
    };

    const handleMediaTypeChange = (e) => {
        setMediaType(e.target.value);
        setSearchParams({
            title: '',
            genre: '',
            year: '',
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/tmdb?mediaType=${mediaType}&title=${searchParams.title}&genre=${searchParams.genre}&year=${searchParams.year}`);
            const data = await response.json();
            setResults(data.results);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    return (
        <div>
            <h1>Search</h1>
            <form onSubmit={handleSubmit}>
                <select name="mediaType" value={mediaType} onChange={handleMediaTypeChange}>
                    <option value="movie">Movie</option>
                    <option value="show">Show</option>
                    <option value="book">Book</option>
                    <option value="videoGame">Video Game</option>
                    <option value="musicAlbum">Music Album</option>
                </select>
                <input
                    type="text"
                    name="title"
                    placeholder="Title"
                    value={searchParams.title}
                    onChange={handleInputChange}
                    required
                />
                <input
                    type="text"
                    name="genre"
                    placeholder="Genre"
                    value={searchParams.genre}
                    onChange={handleInputChange}
                />
                {mediaType === 'movie' && (
                    <input
                        type="text"
                        name="year"
                        placeholder="Year"
                        value={searchParams.year}
                        onChange={handleInputChange}
                    />
                )}
                <button type="submit">Search</button>
            </form>
            <div>
                {results.map((result) => (
                    <div key={result.id}>
                        <h3>{result.title || result.name}</h3>
                        <p>{result.overview}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Search;
