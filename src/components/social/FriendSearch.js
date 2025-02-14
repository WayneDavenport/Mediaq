'use client';

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function FriendSearch({ currentUserId, currentFriends, onFriendAdded }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/users/search?term=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();

            // Filter out current user and existing friends
            const filteredResults = data.users.filter(user =>
                user.id !== currentUserId &&
                !currentFriends?.some(friend => friend.friend_id === user.id)
            );

            setSearchResults(filteredResults);
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Failed to search users');
        } finally {
            setLoading(false);
        }
    };

    const sendFriendRequest = async (receiverId) => {
        try {
            const response = await fetch('/api/friend-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ receiver_id: receiverId }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            toast.success('Friend request sent!');
            // Remove the user from search results
            setSearchResults(prev => prev.filter(user => user.id !== receiverId));
        } catch (error) {
            console.error('Error sending friend request:', error);
            toast.error(error.message || 'Failed to send friend request');
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Find Friends</h2>
            <div className="flex gap-2">
                <Input
                    type="text"
                    placeholder="Search by username or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </Button>
            </div>

            {searchResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((user) => (
                        <div
                            key={user.id}
                            className="p-4 rounded-lg bg-card border"
                        >
                            <div className="flex flex-col space-y-4">
                                <div>
                                    <p className="font-medium">{user.username}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => sendFriendRequest(user.id)}
                                >
                                    Add Friend
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 