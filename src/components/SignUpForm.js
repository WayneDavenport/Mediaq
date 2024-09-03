// src/components/SignUpForm.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from './SignUpForm.module.css'; // Import the CSS module

const SignUpForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState(''); // New state for username
    const [readingSpeed, setReadingSpeed] = useState(20); // Default value for reading speed
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!email || !password || !username) {
            setError('Email, username, and password are required.');
            return;
        }

        // Basic validation for username
        const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
        if (!usernameRegex.test(username)) {
            setError('Username must be 3-15 characters long and can only contain letters, numbers, and underscores.');
            return;
        }

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, username, readingSpeed }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong!');
            }

            setSuccess('User created successfully!');
            setEmail('');
            setPassword('');
            setUsername(''); // Reset username
            setReadingSpeed(20); // Reset to default value
            router.push('/');
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className={styles.card}>
            <h1>Sign Up</h1>
            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.rangeGroup}>
                    <label htmlFor="readingSpeed">Reading Speed (pages per 30 min):</label>
                    <input
                        type="range"
                        id="readingSpeed"
                        min="1"
                        max="128"
                        value={readingSpeed}
                        onChange={(e) => setReadingSpeed(e.target.value)}
                    />
                    <span>{readingSpeed} pages/30 min</span>
                </div>
                <button type="submit" className={styles.button}>Sign Up</button>
            </form>
            {error && <p className={`${styles.message} ${styles.error}`}>{error}</p>}
            {success && <p className={`${styles.message} ${styles.success}`}>{success}</p>}
        </div>
    );
};

export default SignUpForm;