'use client';

import React, { useState, useEffect } from 'react';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave'; // Adjust path as needed
import styles from '@/app/styles.module.css'; // Assuming slogan style is here, adjust if not

const SloganAnimator = () => {
    const [key, setKey] = useState(0);
    const sloganText = "Mindful Backlog Management";

    useEffect(() => {
        const intervalId = setInterval(() => {
            setKey(prevKey => prevKey + 1);
        }, 8000); // 8 seconds

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, []);

    return (
        <TextShimmerWave
            key={key} // Changing the key re-mounts the component, restarting the animation
            as="h2"
            className={styles.slogan} // Apply the same slogan style
            duration={1.5} // You can adjust duration of the shimmer itself
            spread={1.2}   // And spread
            transition={{
                repeat: 0, // Play animation only once per mount
            }}
        >
            {sloganText}
        </TextShimmerWave>
    );
};

export default SloganAnimator; 