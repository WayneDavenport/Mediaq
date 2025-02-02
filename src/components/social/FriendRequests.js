'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";

const FriendRequests = ({ currentUserId }) => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRequests = async () => {
        try {
            const response = await fetch('/api/friend-requests');
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to fetch requests');

            setPendingRequests(data.requests || []);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAccept = async (requestId) => {
        try {
            console.log('Accepting request:', requestId);
            const response = await fetch(`/api/friend-requests/${requestId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'accept' })
            });

            const data = await response.json();
            console.log('Accept response:', data);

            if (!response.ok) throw new Error(data.error || 'Failed to accept request');

            // Remove the accepted request from the list
            setPendingRequests(current =>
                current.filter(request => request.id !== requestId)
            );
        } catch (err) {
            console.error('Accept error:', err);
            setError(err.message);
        }
    };

    const handleDecline = async (requestId) => {
        try {
            const response = await fetch(`/api/friend-requests/${requestId}`, {
                method: 'DELETE',
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to decline request');

            // Remove the declined request from the list
            setPendingRequests(current =>
                current.filter(request => request.id !== requestId)
            );
        } catch (err) {
            console.error('Decline error:', err);
            setError(err.message);
        }
    };

    if (isLoading) return <div>Loading requests...</div>;

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Pending Friend Requests</h2>
                {error && (
                    <p className="text-sm text-destructive mb-4">{error}</p>
                )}
                <div className="space-y-4">
                    {pendingRequests.length === 0 ? (
                        <p className="text-muted-foreground">No pending friend requests</p>
                    ) : (
                        pendingRequests.map((request) => (
                            <div
                                key={request.id}
                                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                                <div>
                                    <p className="font-medium">
                                        {request.sender.username}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {request.sender.email}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => handleAccept(request.id)}
                                        className="bg-green-500 hover:bg-green-600"
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDecline(request.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default FriendRequests; 