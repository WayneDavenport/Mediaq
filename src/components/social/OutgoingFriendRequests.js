'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function OutgoingFriendRequests({ currentUserId, refreshTrigger = 0 }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUserId) {
            fetchOutgoingRequests();
        }
    }, [currentUserId, refreshTrigger]);

    const fetchOutgoingRequests = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/friend-requests/outgoing');
            const data = await response.json();
            setRequests(data.requests || []);
        } catch (error) {
            console.error('Error fetching outgoing requests:', error);
            toast.error('Failed to load outgoing friend requests');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (receiverId) => {
        try {
            const response = await fetch(`/api/friend-requests/outgoing/${receiverId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to cancel request');

            setRequests(prev => prev.filter(req => req.receiver_id !== receiverId));
            toast.success('Friend request cancelled');
        } catch (error) {
            console.error('Error cancelling request:', error);
            toast.error('Failed to cancel friend request');
        }
    };

    if (loading && requests.length === 0) return <div>Loading outgoing requests...</div>;
    if (requests.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Pending Friend Requests Sent</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {requests.map((request) => (
                    <div
                        key={request.receiver_id}
                        className="p-4 rounded-lg bg-card border"
                    >
                        <div className="flex flex-col space-y-4">
                            <div>
                                <p className="font-medium">{request.receiver?.username || 'Unknown User'}</p>
                                <p className="text-sm text-muted-foreground">{request.receiver?.email || 'No email'}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Sent: {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Unknown date'}
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancel(request.receiver_id)}
                                >
                                    Cancel Request
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 