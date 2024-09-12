// src/components/BookSearch.js
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setSearchResults, setStagingItem } from '@/store/slices/searchSlice';
import { useSession } from 'next-auth/react';
import styles from './search.module.css';

const BookSearch = () => {
    const [searchParams, setSearchParams] = useState({
        query: '',
        author: '',
    });
    const [results, setResults] = useState([]);
    const [error, setError] = useState(''); // State to store error message
    const dispatch = useDispatch();
    const { data: session } = useSession();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchParams({
            ...searchParams,
            [name]: value,
        });
        setError(''); // Clear error when user starts typing
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: Ensure either 'query' (title) or 'author' is filled
        if (!searchParams.query && !searchParams.author) {
            setError('Please enter either a title or an author.');
            return; // Prevent form submission
        }

        try {
            // Fetch data from Google Books API
            const response = await fetch(`/api/googleBooks?query=${searchParams.query}&author=${searchParams.author}`);
            const data = await response.json();

            // Map the results to include Open Library cover art
            const resultsWithCovers = data.books.map(book => {
                const isbn = book.isbn;
                return {
                    ...book,
                    coverUrl: isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : null,
                };
            });

            setResults(resultsWithCovers);
            dispatch(setSearchResults(resultsWithCovers));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleAdd = (item) => {
        const readingSpeed = session?.user?.readingSpeed || 20; // Default to 20 if not provided
        const duration = Math.ceil(item.pageCount / readingSpeed * 30); // Calculate duration in minutes
        const additionalFields = {
            authors: item.authors?.join(', '),
            publisher: item.publisher,
            pageCount: parseInt(item.pageCount),
            isbn: item.isbn,
            imageUrl: item.coverUrl, // Use the cover URL from Open Library
        };

        const formData = {
            title: item.title,
            duration: duration || '',
            category: '', // Default category or let the user choose later
            mediaType: 'Book',
            description: item.description,
            additionalFields: additionalFields,
        };

        dispatch(setStagingItem(formData));
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.heading}>Search Books</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
                <input
                    type="text"
                    name="query"
                    placeholder="Title"
                    value={searchParams.query}
                    onChange={handleInputChange}
                    className={styles.input}
                />
                <input
                    type="text"
                    name="author"
                    placeholder="Author"
                    value={searchParams.author}
                    onChange={handleInputChange}
                    className={styles.input}
                />
                {error && <p className={styles.error}>{error}</p>} {/* Display error message */}
                <button type="submit" className={styles.button}>Search</button>
            </form>
            <div className={styles.resultsContainer}>
                {results.map((result, index) => (
                    <div key={index} className={styles.resultItem}>
                        <h3 className={styles.resultTitle}>{result.title}</h3>
                        {result.coverUrl && (
                            <img src={result.coverUrl} alt={result.title} className={styles.resultImage} />
                        )}
                        <p className={styles.resultOverview}>{result.description}</p>
                        <p className={styles.resultInfo}>Authors: {result.authors?.join(', ')}</p>
                        <p className={styles.resultInfo}>Publisher: {result.publisher}</p>
                        <p className={styles.resultInfo}>Page Count: {parseInt(result.pageCount)}</p>
                        <button onClick={() => handleAdd(result)} className={styles.addButton}>Add</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BookSearch;