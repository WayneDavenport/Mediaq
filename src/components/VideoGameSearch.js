// src/components/VideoGameSearch.js
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setSearchResults, setStagingItem } from '@/store/slices/searchSlice';
import styles from './search.module.css';

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
            posterPath: item.background_image,
            backdropPath: item.background_image_additional,
            additionalFields: additionalFields,
        };

        dispatch(setStagingItem(formData));
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.heading}>Search Video Games</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
                <input
                    type="text"
                    name="query"
                    placeholder="Title"
                    value={searchParams.query}
                    onChange={handleInputChange}
                    required
                    className={styles.input}
                />
                <button type="submit" className={styles.button}>Search</button>
            </form>
            <div className={styles.resultsContainer}>
                {results.map((result, index) => (
                    <div key={index} className={styles.resultItem}>
                        <h3 className={styles.resultTitle}>{result.name}</h3>
                        {result.background_image && (
                            <img src={result.background_image} alt={result.name} className={styles.resultImage} />
                        )}
                        <p className={styles.resultOverview}>Description: {result.description_raw}</p>
                        <p className={styles.resultInfo}>Publisher: {result.publishers?.map(publisher => publisher.name).join(', ')}</p>
                        <p className={styles.resultInfo}>Developer: {result.developers?.map(developer => developer.name).join(', ')}</p>
                        <button onClick={() => handleAdd(result)} className={styles.addButton}>Add</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VideoGameSearch;