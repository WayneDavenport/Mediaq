// src/components/SignUpForm.js
import { useState } from 'react';
import { useRouter } from 'next/router';

const SignUpForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [readingSpeed, setReadingSpeed] = useState(20); // Default value for reading speed
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, readingSpeed }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong!');
            }

            setSuccess('User created successfully!');
            setEmail('');
            setPassword('');
            setReadingSpeed(20); // Reset to default value
            router.push('/');
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className='text-white'>
            <h1>Sign Up</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input
                        className='text-black'
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        className='text-black'
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
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
                <button type="submit">Sign Up</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
        </div>
    );
};

export default SignUpForm;