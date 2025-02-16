'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Mail, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import supabaseRealtime from '@/lib/supabaseRealtimeClient';
import useNotificationStore from '@/store/notificationStore';
import { Badge } from "@/components/ui/badge";

// Create a styled light bulb icon component
const LightBulbIcon = ({ className }) => (
    <svg
        viewBox="0 0 72.26 122.88"
        className={className}
        style={{ fill: 'currentColor' }}
    >
        <path d="M20.05,11.8A6.05,6.05,0,0,1,23.84.3L50.39,9.07a6.05,6.05,0,0,1-.54,11.65L9,31.67A6,6,0,1,1,5.84,20l21.52-5.76L20.05,11.8ZM53.84,95.5v10.26a17.07,17.07,0,0,1-5,12.09l-.23.21a17,17,0,0,1-11.86,4.82H28.91a17.09,17.09,0,0,1-12.09-5l-.21-.23a17.06,17.06,0,0,1-4.81-11.86V95.5a5.65,5.65,0,0,1,1-11.21h3.09L1.78,69.91A6.14,6.14,0,0,1,.24,67.17,6,6,0,0,1,4.6,59.83L64.73,44.34a6,6,0,1,1,3,11.69l-50,12.88L31.59,83a5.84,5.84,0,0,1,1,1.29h6.5a5.41,5.41,0,0,1,.65-1L50.78,69.84a6,6,0,0,1,9.33,7.67l-5.76,7a5.66,5.66,0,0,1-.51,11Zm-34.73.1v10.16a9.78,9.78,0,0,0,2.71,6.77l.17.15a9.78,9.78,0,0,0,6.92,2.89h7.81a9.78,9.78,0,0,0,6.76-2.72l.16-.17a9.75,9.75,0,0,0,2.88-6.92V95.6ZM62.63,24.74a6.05,6.05,0,1,1,2.94,11.74l-58,14.67A6.05,6.05,0,1,1,4.58,39.41L62.63,24.74Z" />
    </svg>
);

export default function NotificationsDropdown() {
    const router = useRouter();
    const { data: session } = useSession();
    const {
        notifications,
        unreadCount,
        setNotifications,
        addNotification,
        markAsRead,
        markMultipleAsRead
    } = useNotificationStore();
    const [friendRequests, setFriendRequests] = useState([]);
    const [showFriendRequests, setShowFriendRequests] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            fetchNotifications();
            fetchFriendRequests();
            const subscription = setupRealtimeSubscription();
            const friendRequestSubscription = setupFriendRequestSubscription();
            return () => {
                if (subscription) supabaseRealtime.removeChannel(subscription);
                if (friendRequestSubscription) supabaseRealtime.removeChannel(friendRequestSubscription);
            };
        }
    }, [session?.user?.id]);

    const setupRealtimeSubscription = () => {
        return supabaseRealtime
            .channel(`notifications-${session?.user?.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `receiver_id=eq.${session?.user?.id}`
            }, (payload) => {
                // Only add if it's for the current user and not a duplicate
                if (payload.new.receiver_id === session?.user?.id) {
                    addNotification(payload.new);
                }
            })
            .subscribe();
    };

    const setupFriendRequestSubscription = () => {
        return supabaseRealtime
            .channel(`friend-requests-${session?.user?.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'friend_requests',
                filter: `receiver_id=eq.${session?.user?.id}`
            }, (payload) => {
                if (payload.new.receiver_id === session?.user?.id) {
                    fetchFriendRequests();
                }
            })
            .subscribe();
    };

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications');
            const data = await response.json();
            if (data.notifications) {
                setNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchFriendRequests = async () => {
        try {
            const response = await fetch('/api/friend-requests');
            const data = await response.json();
            setFriendRequests(data.requests || []);
        } catch (error) {
            console.error('Error fetching friend requests:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.is_read) {
            try {
                await fetch('/api/notifications', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notificationIds: [notification.id] })
                });
                markAsRead(notification.id);
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }

        // Navigate to gallery with query params
        router.push(`/user-pages/gallery?mediaId=${notification.media_item_id}&commentId=${notification.comment_id || ''}`);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                >
                    <LightBulbIcon
                        className={`h-5 w-5 transition-all ${(unreadCount + friendRequests.length) > 0
                                ? 'text-primary [filter:drop-shadow(0_0_8px_hsl(var(--primary)))] animate-pulse'
                                : ''
                            }`}
                    />
                    {(unreadCount + friendRequests.length) > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                            {unreadCount + friendRequests.length}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <div className="flex gap-4">
                        <span
                            className={`cursor-pointer flex items-center gap-2 ${!showFriendRequests ? 'text-primary' : 'text-muted-foreground'}`}
                            onClick={() => setShowFriendRequests(false)}
                        >
                            <Mail className="h-4 w-4" />
                            Notifications
                            {unreadCount > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {unreadCount}
                                </Badge>
                            )}
                        </span>
                        <span
                            className={`cursor-pointer flex items-center gap-2 ${showFriendRequests ? 'text-primary' : 'text-muted-foreground'}`}
                            onClick={() => setShowFriendRequests(true)}
                        >
                            <Users className="h-4 w-4" />
                            Friend Requests
                            {friendRequests.length > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {friendRequests.length}
                                </Badge>
                            )}
                        </span>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {showFriendRequests ? (
                    // Friend Requests Section
                    <>
                        {friendRequests.length === 0 ? (
                            <DropdownMenuItem disabled>No friend requests</DropdownMenuItem>
                        ) : (
                            <>
                                {friendRequests.map(request => (
                                    <DropdownMenuItem
                                        key={`friend-request-${request.sender_id}`}
                                        className="cursor-pointer"
                                    >
                                        <div className="flex flex-col gap-1 w-full">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm">{request.sender.username}</p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push('/user-pages/social');
                                                    }}
                                                >
                                                    View
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem
                                    className="cursor-pointer justify-center text-sm text-muted-foreground"
                                    onClick={() => router.push('/user-pages/social')}
                                >
                                    Manage all friend requests
                                </DropdownMenuItem>
                            </>
                        )}
                    </>
                ) : (
                    // Regular Notifications Section
                    <>
                        {notifications.length === 0 ? (
                            <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
                        ) : (
                            notifications.map(notification => (
                                <DropdownMenuItem
                                    key={`notification-${notification.id}-${notification.created_at}`}
                                    className={`cursor-pointer ${!notification.is_read ? 'bg-muted/50' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm">{notification.message}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </DropdownMenuItem>
                            ))
                        )}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 