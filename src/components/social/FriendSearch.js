'use client';

import { useState } from 'react';
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
} from "@/components/ui/card";

const FriendSearch = ({ currentUserId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/users/search?term=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to search users');

            setSearchResults(data.users);
        } catch (err) {
            setError(err.message);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendRequest = async (receiverId) => {
        try {
            console.log('Sending friend request...', { receiverId, currentUserId });

            const response = await fetch('/api/friend-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sender_id: currentUserId,
                    receiver_id: receiverId,
                    status: 'pending'
                }),
            });

            const data = await response.json();
            console.log('Response:', data);

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Failed to send friend request');
            }

            // Update UI to show request sent
            setSearchResults(results =>
                results.map(user =>
                    user.id === receiverId
                        ? { ...user, requestSent: true }
                        : user
                )
            );
        } catch (err) {
            console.error('Error sending friend request:', err);
            setError(err.message);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search by email or username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button
                            onClick={handleSearch}
                            disabled={isLoading}
                        >
                            <Search className="h-4 w-4 mr-2" />
                            Search
                        </Button>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <div className="space-y-2">
                        {searchResults.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                                <div>
                                    <p className="font-medium">{user.username}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                <Button
                                    variant={user.requestSent ? "secondary" : "default"}
                                    disabled={user.requestSent || user.id === currentUserId}
                                    onClick={() => handleSendRequest(user.id)}
                                >
                                    {user.requestSent
                                        ? "Request Sent"
                                        : user.id === currentUserId
                                            ? "This is you"
                                            : "Add Friend"
                                    }
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default FriendSearch; 