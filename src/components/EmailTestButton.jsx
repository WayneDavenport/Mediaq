'use client';

import { useState } from 'react';

export default function EmailTestButton() {
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [error, setError] = useState(null);

    const sendTestEmail = async () => {
        setStatus('loading');
        setError(null);

        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send email');
            }

            setStatus('success');
        } catch (err) {
            console.error('Error sending email:', err);
            setError(err.message);
            setStatus('error');
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
            <button
                onClick={sendTestEmail}
                disabled={status === 'loading'}
                className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
                {status === 'loading' ? 'Sending...' : 'Send Test Email'}
            </button>

            {status === 'success' && (
                <div className="p-2 text-green-700 bg-green-100 rounded">
                    Email sent successfully!
                </div>
            )}

            {status === 'error' && (
                <div className="p-2 text-red-700 bg-red-100 rounded">
                    Error: {error}
                </div>
            )}
        </div>
    );
} 