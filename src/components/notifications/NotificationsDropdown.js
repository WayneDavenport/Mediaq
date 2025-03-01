'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
    Bell,
    Check,
    Clock,
    Mail,
    MessageSquare,
    ThumbsUp,
    Trash2,
    User,
    UserPlus,
    Users,
    X
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useNotificationStore from '@/store/notificationStore';
import supabaseRealtime from '@/lib/supabaseRealtimeClient';

export default function NotificationsDropdown() {
    const router = useRouter();
    const { data: session } = useSession();
    const {
        notifications,
        unreadCount,
        setNotifications,
        addNotification,
        markAsRead,
        markMultipleAsRead,
        removeNotification
    } = useNotificationStore();
    const [friendRequests, setFriendRequests] = useState([]);
    const [isDismissing, setIsDismissing] = useState(false);
    const [allNotifications, setAllNotifications] = useState([]);

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

    // Combine regular notifications and friend requests into a single sorted list
    useEffect(() => {
        const combined = [
            ...notifications.map(n => ({
                ...n,
                notificationType: 'regular',
                sortDate: new Date(n.created_at)
            })),
            ...friendRequests.map(req => ({
                id: `fr-${req.sender_id}`,
                created_at: req.created_at,
                sender: req.sender,
                sender_id: req.sender_id,
                notificationType: 'friendRequest',
                is_read: false,
                sortDate: new Date(req.created_at)
            }))
        ];

        // Sort by date, newest first
        combined.sort((a, b) => b.sortDate - a.sortDate);
        setAllNotifications(combined);
    }, [notifications, friendRequests]);

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

    const handleNotificationClick = async (notification, e) => {
        // Prevent click if we're clicking the dismiss button
        if (e.target.closest('.dismiss-button')) {
            return;
        }

        if (notification.notificationType === 'friendRequest') {
            // Navigate to social page for friend requests
            router.push('/user-pages/social');
            return;
        }

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

        // Handle different notification types
        if (notification.type === 'friend_request_accepted') {
            // Navigate to social page for accepted friend requests
            router.push('/user-pages/social');
        } else if (notification.media_item_id) {
            // Navigate to gallery with query params for comments
            router.push(`/user-pages/gallery?mediaId=${notification.media_item_id}&commentId=${notification.comment_id || ''}`);
        }
    };

    // Function to handle friend request actions directly from notification
    const handleFriendRequestAction = async (senderId, action, e) => {
        e.stopPropagation();

        try {
            const endpoint = `/api/friend-requests/${senderId}`;
            const method = action === 'accept' ? 'POST' : 'DELETE';

            const response = await fetch(endpoint, { method });

            if (!response.ok) {
                throw new Error(`Failed to ${action} friend request`);
            }

            // Remove this request from the list
            setFriendRequests(prev => prev.filter(req => req.sender_id !== senderId));

            toast.success(`Friend request ${action === 'accept' ? 'accepted' : 'declined'}`);
        } catch (error) {
            console.error(`Error ${action}ing friend request:`, error);
            toast.error(`Failed to ${action} friend request`);
        }
    };

    // New function to dismiss a notification
    const handleDismissNotification = async (notificationId, e) => {
        e.stopPropagation(); // Prevent triggering the parent click

        if (isDismissing) return;
        setIsDismissing(true);

        // Check if it's a friend request notification (has fr- prefix)
        if (typeof notificationId === 'string' && notificationId.startsWith('fr-')) {
            const senderId = notificationId.replace('fr-', '');
            try {
                const response = await fetch(`/api/friend-requests/${senderId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Failed to decline friend request');
                }

                // Remove from local state
                setFriendRequests(prev => prev.filter(req => req.sender_id !== senderId));
                toast.success('Friend request declined');
            } catch (error) {
                console.error('Error declining friend request:', error);
                toast.error('Failed to decline friend request');
            } finally {
                setIsDismissing(false);
            }
            return;
        }

        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to dismiss notification');
            }

            // Remove from local state
            removeNotification(notificationId);
            toast.success('Notification dismissed');
        } catch (error) {
            console.error('Error dismissing notification:', error);
            toast.error('Failed to dismiss notification');
        } finally {
            setIsDismissing(false);
        }
    };

    // Function to clear all notifications
    const handleClearAllNotifications = async () => {
        if (notifications.length === 0 || isDismissing) return;
        setIsDismissing(true);

        try {
            const response = await fetch('/api/notifications/clear-all', {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to clear notifications');
            }

            // Clear notifications in store
            setNotifications([]);
            toast.success('All notifications cleared');
        } catch (error) {
            console.error('Error clearing notifications:', error);
            toast.error('Failed to clear notifications');
        } finally {
            setIsDismissing(false);
        }
    };

    // Helper function to get icon for notification type
    const getNotificationIcon = (notification) => {
        if (notification.notificationType === 'friendRequest') {
            return <UserPlus className="h-4 w-4 text-blue-500" />;
        }

        switch (notification.type) {
            case 'friend_request_accepted':
                return <Users className="h-4 w-4 text-green-500" />;
            case 'comment':
                return <MessageSquare className="h-4 w-4 text-purple-500" />;
            case 'reply':
                return <MessageSquare className="h-4 w-4 text-indigo-500" />;
            case 'like':
                return <ThumbsUp className="h-4 w-4 text-pink-500" />;
            case 'recommendation':
                return <Mail className="h-4 w-4 text-amber-500" />;
            default:
                return <Bell className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                >
                    <Bell
                        className={`h-5 w-5 transition-all ${allNotifications.length > 0
                            ? 'text-primary [filter:drop-shadow(0_0_8px_hsl(var(--primary)))] animate-pulse'
                            : ''
                            }`}
                    />
                    {allNotifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                            {allNotifications.length}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAllNotifications}
                            disabled={isDismissing}
                            className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                            <Trash2 className="h-3 w-3" />
                            Clear all
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {allNotifications.length === 0 ? (
                    <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
                ) : (
                    allNotifications.map(notification => (
                        <DropdownMenuItem
                            key={notification.id}
                            className={`cursor-pointer ${!notification.is_read ? 'bg-muted/50' : ''
                                } relative pr-8`}
                            onClick={(e) => handleNotificationClick(notification, e)}
                        >
                            <div className="flex gap-3 w-full">
                                <div className="flex-shrink-0 mt-1">
                                    {getNotificationIcon(notification)}
                                </div>
                                <div className="flex flex-col gap-1 flex-grow">
                                    {notification.notificationType === 'friendRequest' ? (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm">
                                                    <span className="font-medium">{notification.sender?.username || 'Unknown User'}</span>
                                                    {' sent you a friend request'}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 mt-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs"
                                                    onClick={(e) => handleFriendRequestAction(notification.sender_id, 'accept', e)}
                                                >
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Accept
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs"
                                                    onClick={(e) => handleFriendRequestAction(notification.sender_id, 'decline', e)}
                                                >
                                                    <X className="h-3 w-3 mr-1" />
                                                    Decline
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-sm">
                                            <span className="font-medium">{notification.user?.username || 'Unknown User'}</span>
                                            {' '}
                                            {notification.message}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>

                            {/* Don't show dismiss button for friend requests that have accept/decline buttons */}
                            {notification.notificationType !== 'friendRequest' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="dismiss-button absolute right-1 top-1 h-6 w-6 rounded-full opacity-70 hover:opacity-100 hover:bg-muted"
                                    onClick={(e) => handleDismissNotification(notification.id, e)}
                                    disabled={isDismissing}
                                >
                                    <X className="h-3 w-3" />
                                    <span className="sr-only">Dismiss</span>
                                </Button>
                            )}
                        </DropdownMenuItem>
                    ))
                )}

                {allNotifications.length > 0 && friendRequests.length > 0 && (
                    <DropdownMenuItem
                        className="cursor-pointer justify-center text-sm text-muted-foreground"
                        onClick={() => router.push('/user-pages/social')}
                    >
                        Manage all friend requests
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 