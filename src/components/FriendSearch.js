// src/components/FriendSearch.js
import { useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';

const FriendSearch = () => {
    const { data: session } = useSession();
    const [email, setEmail] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [message, setMessage] = useState('');

    const handleSearch = async () => {
        try {
            const response = await axios.get(`/api/friends?email=${email}`);
            setSearchResult(response.data.user);
        } catch (error) {
            setMessage(error.response.data.message);
        }
    };

    const handleSendInvite = async () => {
        try {
            const senderEmail = session.user.email;
            const receiverEmail = searchResult.email;

            await axios.post('/api/friends', { senderEmail, receiverEmail });
            setMessage('Invite sent successfully');
        } catch (error) {
            setMessage(error.response.data.message);
        }
    };

    return (
        <div>
            <input
                className='text-black'
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email to search"
            />
            <button onClick={handleSearch}>Search</button>

            {searchResult && (
                <div>
                    <p>{searchResult.email}</p>
                    <button onClick={handleSendInvite}>Send Invite</button>
                </div>
            )}

            {message && <p>{message}</p>}
        </div>
    );
};

export default FriendSearch;