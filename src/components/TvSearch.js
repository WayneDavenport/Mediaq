// src/components/TvSearch.js
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setSearchResults, setStagingItem } from '@/store/slices/searchSlice';
import styles from './search.module.css';

const TvSearch = () => {
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

    const fetchEpisodeRuntime = async (showId, seasonNumber, episodeNumber) => {
        const response = await fetch(`/api/tmdb?showId=${showId}&seasonNumber=${seasonNumber}&episodeNumber=${episodeNumber}`);
        const data = await response.json();
        return data.runtime;
    };

    const calculateAverageRuntime = async (showId, seasonNumber) => {
        const episodeNumbers = [1, 2, 3]; // You can randomize or choose specific episodes
        const runtimes = await Promise.all(
            episodeNumbers.map(episodeNumber => fetchEpisodeRuntime(showId, seasonNumber, episodeNumber))
        );
        const validRuntimes = runtimes.filter(runtime => runtime !== undefined);
        const averageRuntime = validRuntimes.reduce((acc, runtime) => acc + runtime, 0) / validRuntimes.length;
        return averageRuntime;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/tmdb?mediaType=tv&query=${searchParams.query}&language=${searchParams.language}&include_adult=${searchParams.include_adult}&page=${page}`);
            const data = await response.json();
            const filteredResults = await Promise.all(data.results.filter(result =>
                result.media_type !== 'movie' && result.name && result.overview
            ).map(async (result) => {
                if (!result.episode_run_time || result.episode_run_time.length === 0) {
                    const averageRuntime = await calculateAverageRuntime(result.id, 1); // Assuming season 1
                    result.episode_run_time = [averageRuntime];
                }
                return result;
            }));
            setResults(filteredResults);
            dispatch(setSearchResults(filteredResults));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleAdd = (item) => {
        const duration = item.number_of_episodes * (item.episode_run_time?.[0] || 0);
        const additionalFields = {
            cast: item.credits?.cast?.slice(0, 3).map(cast => cast.name).join(', '),
            network: item.networks?.map(network => network.name).join(', '),
            crew: item.credits?.crew?.slice(0, 3).map(crew => crew.name).join(', '),
            episodes: parseInt(item.number_of_episodes),
            imageUrl: `https://image.tmdb.org/t/p/w500${item.poster_path}`, // Add image URL here
        };

        const formData = {
            title: item.name,
            duration: duration || '',
            category: '', // Default category or let the user choose later
            mediaType: 'Show',
            description: item.overview,
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
            <h1 className={styles.heading}>Search TV Shows</h1>
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
                        <h3 className={styles.resultTitle}>{result.name}</h3>
                        {result.poster_path && (
                            <img src={`https://image.tmdb.org/t/p/w500${result.poster_path}`} alt={result.name} className={styles.resultImage} />
                        )}
                        <p className={styles.resultOverview}>{result.overview}</p>
                        <p className={styles.resultInfo}>Number of Episodes: {result.number_of_episodes}</p>
                        <p className={styles.resultInfo}>First Air Date: {result.first_air_date}</p>
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

export default TvSearch;