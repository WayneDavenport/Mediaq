'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function FriendRequests({ currentUserId, onRequestAccepted }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUserId) {
            fetchRequests();
        }
    }, [currentUserId]);

    const fetchRequests = async () => {
        try {
            const response = await fetch('/api/friend-requests');
            const data = await response.json();
            setRequests(data.requests || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Failed to load friend requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (senderId) => {
        try {
            const response = await fetch(`/api/friend-requests/${senderId}`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Failed to accept request');

            setRequests(prev => prev.filter(req => req.sender_id !== senderId));
            toast.success('Friend request accepted');
            if (onRequestAccepted) onRequestAccepted();
        } catch (error) {
            console.error('Error accepting request:', error);
            toast.error('Failed to accept friend request');
        }
    };

    const handleDecline = async (senderId) => {
        try {
            const response = await fetch(`/api/friend-requests/${senderId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to decline request');

            setRequests(prev => prev.filter(req => req.sender_id !== senderId));
            toast.success('Friend request declined');
        } catch (error) {
            console.error('Error declining request:', error);
            toast.error('Failed to decline friend request');
        }
    };

    if (loading) return <div>Loading requests...</div>;

    if (requests.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Friend Requests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {requests.map((request) => (
                    <div
                        key={request.sender_id}
                        className="p-4 rounded-lg bg-card border"
                    >
                        <div className="flex flex-col space-y-4">
                            <div>
                                <p className="font-medium">{request.sender.username}</p>
                                <p className="text-sm text-muted-foreground">{request.sender.email}</p>
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleAccept(request.sender_id)}
                                >
                                    Accept
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDecline(request.sender_id)}
                                >
                                    Decline
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 