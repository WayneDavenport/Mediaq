'use client'

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import FriendSearch from '@/components/social/FriendSearch';
import FriendRequests from '@/components/social/FriendRequests';
import OutgoingFriendRequests from '@/components/social/OutgoingFriendRequests';
import InviteFriends from '@/components/social/InviteFriends';
import { LoadingScreen } from '@/components/loading/loading-screen';


export default function SocialPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [friends, setFriends] = useState([]);
    const [refreshOutgoing, setRefreshOutgoing] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetchFriends();
        }
    }, [session]);

    const fetchFriends = async () => {
        try {
            const response = await fetch('/api/friends');
            const data = await response.json();
            if (data.friends) {
                setFriends(data.friends);
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };

    // Simple function to trigger refresh of outgoing requests
    const handleRequestSent = () => {
        setRefreshOutgoing(prev => prev + 1);
    };

    if (status === 'unauthenticated') {
        router.push('/');
        return null;
    }

    return (
        <>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Social</h1>

                <div className="space-y-8">
                    <FriendRequests
                        currentUserId={session?.user?.id}
                        onRequestAccepted={fetchFriends}
                    />

                    <OutgoingFriendRequests
                        currentUserId={session?.user?.id}
                        refreshTrigger={refreshOutgoing}
                    />

                    {/* New Invite Friends component */}
                    <InviteFriends />

                    <FriendSearch
                        currentUserId={session?.user?.id}
                        currentFriends={friends}
                        onFriendAdded={fetchFriends}
                        onRequestSent={handleRequestSent}
                    />

                    {/* Display current friends */}
                    {friends.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-2xl font-semibold mb-4">My Friends</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {friends.map((friend) => (
                                    <div
                                        key={friend.friend_id}
                                        className="p-4 rounded-lg bg-card border"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div>
                                                <p className="font-medium">{friend.friend_user_name}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}