'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import useNotificationStore from '@/store/notificationStore';

export default function FriendRequests({ currentUserId, onRequestAccepted }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const { removeFriendRequest } = useNotificationStore();

    useEffect(() => {
        if (currentUserId) {
            fetchRequests();
        }
    }, [currentUserId]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/friend-requests');
            const data = await response.json();
            setRequests(data.requests || []);
        } catch (error) {
            console.error('Error fetching friend requests:', error);
            toast.error('Failed to load friend requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (senderId) => {
        try {
            const response = await fetch(`/api/friend-requests/${senderId}`, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to accept request');
            }

            // Remove from local state
            setRequests(requests.filter(request => request.sender_id !== senderId));
            removeFriendRequest(senderId);

            toast.success('Friend request accepted');

            // Notify parent component
            if (onRequestAccepted) {
                onRequestAccepted();
            }
        } catch (error) {
            console.error('Error accepting friend request:', error);
            toast.error(error.message || 'Failed to accept friend request');
        }
    };

    const handleDecline = async (senderId) => {
        try {
            const response = await fetch(`/api/friend-requests/${senderId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to decline request');
            }

            // Remove from local state
            setRequests(requests.filter(request => request.sender_id !== senderId));
            removeFriendRequest(senderId);

            toast.success('Friend request declined');
        } catch (error) {
            console.error('Error declining friend request:', error);
            toast.error(error.message || 'Failed to decline friend request');
        }
    };

    if (loading) {
        return <div className="text-center p-4">Loading friend requests...</div>;
    }

    if (requests.length === 0) {
        return (
            <div className="rounded-lg border p-4">
                <h3 className="text-lg font-semibold mb-2">Friend Requests</h3>
                <p className="text-muted-foreground">No pending friend requests</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border p-4">
            <h3 className="text-lg font-semibold mb-4">Friend Requests</h3>
            <div className="space-y-4">
                {requests.map((request) => (
                    <div
                        key={request.sender_id}
                        className="p-4 rounded-lg bg-card border"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{request.sender?.username || 'Unknown User'}</p>
                                <p className="text-sm text-muted-foreground">{request.sender?.email || 'No email'}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Sent: {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Unknown date'}
                                </p>
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