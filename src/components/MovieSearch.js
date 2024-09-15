// src/components/MovieSearch.js
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setSearchResults, setStagingItem } from '@/store/slices/searchSlice';
import styles from './search.module.css'

const MovieSearch = () => {
    const [searchParams, setSearchParams] = useState({
        query: '',
        language: 'en-US',
        include_adult: false,
    });
    const [results, setResults] = useState([]);
    const [page, setPage] = useState(1); // Add state for pagination
    const dispatch = useDispatch();

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
            const response = await fetch(`/api/tmdb?mediaType=movie&query=${searchParams.query}&language=${searchParams.language}&include_adult=${searchParams.include_adult}&page=${page}`);
            const data = await response.json();
            const filteredResults = data.results.filter(result =>
                result.media_type !== 'tv' && result.title && result.overview
            );
            setResults(filteredResults);
            dispatch(setSearchResults(filteredResults));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleAdd = (item) => {
        const duration = item.runtime;
        const additionalFields = {
            cast: item.credits?.cast?.slice(0, 3).map(cast => cast.name).join(', '),
            director: item.credits?.crew?.find(crew => crew.job === 'Director')?.name,
        };

        const formData = {
            title: item.title,
            duration: duration || '',
            category: '', // Default category or let the user choose later
            mediaType: 'Movie',
            description: item.overview,
            posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
            backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : '',
            additionalFields: additionalFields,
        };

        dispatch(setStagingItem(formData));
    };

    const handleNextPage = () => {
        setPage(prevPage => prevPage + 1);
    };

    const handlePreviousPage = () => {
        setPage(prevPage => Math.max(prevPage - 1, 1));
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.heading}>Search Movies</h1>
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
                <input
                    type="text"
                    name="language"
                    placeholder="Language"
                    value={searchParams.language}
                    onChange={handleInputChange}
                    className={styles.input}
                />
                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        name="include_adult"
                        checked={searchParams.include_adult}
                        onChange={handleInputChange}
                        className={styles.checkbox}
                    />
                    Include Adult Content
                </label>
                <button type="submit" className={styles.button}>Search</button>
            </form>
            <div className={styles.resultsContainer}>
                {results.map((result) => (
                    <div key={result.id} className={styles.resultItem}>
                        <h3 className={styles.resultTitle}>{result.title}</h3>
                        {result.poster_path && (
                            <img src={`https://image.tmdb.org/t/p/w500${result.poster_path}`} alt={result.title} className={styles.resultImage} />
                        )}
                        <p className={styles.resultOverview}>{result.overview}</p>
                        <p className={styles.resultInfo}>Release Date: {result.release_date}</p>
                        <p className={styles.resultInfo}>Language: {result.original_language}</p>
                        <p className={styles.resultInfo}>Vote Average: {result.vote_average}</p>
                        <p className={styles.resultInfo}>Vote Count: {result.vote_count}</p>
                        {result.credits && (
                            <div className={styles.resultCredits}>
                                <h4 className={styles.resultCreditsTitle}>Cast:</h4>
                                <ul className={styles.resultCreditsList}>
                                    {result.credits.cast.slice(0, 3).map((castMember) => (
                                        <li key={castMember.cast_id}>{castMember.name} as {castMember.character}</li>
                                    ))}
                                </ul>
                                <h4 className={styles.resultCreditsTitle}>Crew:</h4>
                                <ul className={styles.resultCreditsList}>
                                    {result.credits.crew
                                        .filter((crewMember) => crewMember.job === 'Director' || crewMember.job === 'Producer')
                                        .map((crewMember) => (
                                            <li key={crewMember.credit_id}>{crewMember.name} - {crewMember.job}</li>
                                        ))}
                                </ul>
                            </div>
                        )}
                        <button onClick={() => handleAdd(result)} className={styles.addButton}>Add</button>
                    </div>
                ))}
            </div>
            <div className={styles.pagination}>
                <button onClick={handlePreviousPage} className={styles.paginationButton}>Previous</button>
                <button onClick={handleNextPage} className={styles.paginationButton}>Next</button>
            </div>
        </div>
    );
};

export default MovieSearch;