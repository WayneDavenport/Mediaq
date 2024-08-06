// src/components/RequestHandler.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';

const RequestHandler = () => {
    const { data: session } = useSession();
    const [receivedInvites, setReceivedInvites] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchReceivedInvites = async () => {
            try {
                const response = await axios.get('/api/friends/received-invites');
                setReceivedInvites(response.data.receivedInvites);
            } catch (error) {
                setMessage(error.response.data.message);
            }
        };

        if (session) {
            fetchReceivedInvites();
        }
    }, [session]);

    const handleAcceptInvite = async (senderEmail) => {
        try {
            await axios.post('/api/friends/accept', { senderEmail, receiverEmail: session.user.email });
            setMessage('Friend request accepted');
            setReceivedInvites(receivedInvites.filter(invite => invite.email !== senderEmail));
        } catch (error) {
            setMessage(error.response.data.message);
        }
    };

    const handleDeclineInvite = async (senderEmail) => {
        try {
            await axios.post('/api/friends/decline', { senderEmail, receiverEmail: session.user.email });
            setMessage('Friend request declined');
            setReceivedInvites(receivedInvites.filter(invite => invite.email !== senderEmail));
        } catch (error) {
            setMessage(error.response.data.message);
        }
    };

    return (
        <div>
            <h2>Friend Requests</h2>
            {receivedInvites.length > 0 ? (
                receivedInvites.map((invite, index) => (
                    <div key={index}>
                        <p>{invite.email}</p>
                        <button onClick={() => handleAcceptInvite(invite.email)}>Accept</button>
                        <button onClick={() => handleDeclineInvite(invite.email)}>Decline</button>
                    </div>
                ))
            ) : (
                <p>No friend requests</p>
            )}
            {message && <p>{message}</p>}
        </div>
    );
};

export default RequestHandler;