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
import styles from '../components/search.module.css';

const Search = () => {
    const [mediaType, setMediaType] = useState('movie');
    const { data: session } = useSession();
    const stagingItem = useSelector((state) => state.search.stagingItem);

    const handleMediaTypeChange = (e) => {
        setMediaType(e.target.value);
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
        <div className={styles.whole}>
            <h1 className={styles.heading}>Search</h1>

            <div className={styles.gridContainer}>
                {!stagingItem && (
                    <div className={styles.searchComponents}>
                        <select value={mediaType} onChange={handleMediaTypeChange} className={styles.select}>
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
                )}

                {stagingItem ? (
                    <div className={styles.stagingContainer}>
                        <Staging onSubmit={handleSubmit} />
                    </div>
                ) : (
                    <div className={styles.placeholder}>
                        <p>Search here for any books, movies, shows, or video games to add to your media queue!</p>
                    </div>
                )}
            </div>

            <Link href='/user-main' className={styles.dashboardLink}>Dashboard</Link>
        </div>
    );
};

export default Search;