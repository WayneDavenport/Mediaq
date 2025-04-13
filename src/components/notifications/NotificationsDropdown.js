'use client';

import { useState, useEffect, useCallback } from 'react';
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
    X,
    Loader2
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
import supabaseRealtime from '@/lib/supabaseRealtimeClient';

export default function NotificationsDropdown() {
    const router = useRouter();
    const { data: session } = useSession();

    const [notifications, setNotifications] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [allNotifications, setAllNotifications] = useState([]);
    const [pendingActionRecId, setPendingActionRecId] = useState(null);
    const [isDismissing, setIsDismissing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!session?.user?.id) return;
        try {
            const response = await fetch('/api/notifications');
            if (!response.ok) throw new Error('Failed to fetch notifications');
            const data = await response.json();
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
        }
    }, [session?.user?.id]);

    const fetchFriendRequests = useCallback(async () => {
        if (!session?.user?.id) return;
        try {
            const response = await fetch('/api/friend-requests');
            if (!response.ok) throw new Error('Failed to fetch friend requests');
            const data = await response.json();
            setFriendRequests(data.requests || []);
        } catch (error) {
            console.error('Error fetching friend requests:', error);
            setFriendRequests([]);
        }
    }, [session?.user?.id]);

    const fetchRecommendations = useCallback(async () => {
        if (!session?.user?.id) return;
        try {
            const response = await fetch('/api/recommendations?status=pending');
            if (!response.ok) throw new Error('Failed to fetch recommendations');
            const data = await response.json();
            setRecommendations(data.recommendations || []);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            setRecommendations([]);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        if (session?.user?.id) {
            setIsLoading(true);
            Promise.all([
                fetchNotifications(),
                fetchFriendRequests(),
                fetchRecommendations()
            ]).finally(() => setIsLoading(false));

            const subs = [
                setupRealtimeSubscription(),
                setupFriendRequestSubscription(),
                setupRecommendationSubscription()
            ];

            return () => {
                subs.forEach(channel => {
                    if (channel) supabaseRealtime.removeChannel(channel);
                });
            };
        } else {
            setNotifications([]);
            setFriendRequests([]);
            setRecommendations([]);
            setIsLoading(false);
        }
    }, [session?.user?.id, fetchNotifications, fetchFriendRequests, fetchRecommendations]);

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
            })),
            ...recommendations.map(rec => ({
                id: rec.id,
                created_at: rec.created_at,
                sender: rec.sender,
                sender_id: rec.sender_id,
                media_item_data: rec.media_item_data,
                message: rec.message,
                notificationType: 'recommendation',
                is_read: false,
                sortDate: new Date(rec.created_at)
            }))
        ];

        combined.sort((a, b) => b.sortDate - a.sortDate);
        setAllNotifications(combined);
    }, [notifications, friendRequests, recommendations]);

    const setupRealtimeSubscription = useCallback(() => {
        if (!session?.user?.id) return null;
        const channel = supabaseRealtime.channel(`notifications-${session.user.id}`);
        console.log(`Attempting to subscribe to channel: ${channel.topic}`);
        channel
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiver_id=eq.${session.user.id}` }, (payload) => {
                console.log('Notification INSERT Payload:', payload);
                if (payload.new.receiver_id === session.user.id) {
                    setNotifications(prev => prev.some(n => n.id === payload.new.id) ? prev : [payload.new, ...prev]);
                }
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications', filter: `receiver_id=eq.${session.user.id}` }, (payload) => {
                console.log('Notification DELETE Payload:', payload);
                if (payload.old?.id) {
                    setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
                }
            })
            .subscribe((status, err) => {
                console.log(`Notification Channel (${channel.topic}) Status:`, status);
                if (err) {
                    console.error(`Notification Channel (${channel.topic}) Error:`, err);
                }
            });
        return channel;
    }, [session?.user?.id]);

    const setupFriendRequestSubscription = useCallback(() => {
        if (!session?.user?.id) return null;
        const channel = supabaseRealtime.channel(`friend-requests-${session.user.id}`);
        console.log(`Attempting to subscribe to channel: ${channel.topic}`);
        channel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `receiver_id=eq.${session.user.id}` }, (payload) => {
                console.log("Friend Request Realtime Payload:", payload);
                switch (payload.eventType) {
                    case 'INSERT':
                        setFriendRequests(prev => prev.some(req => req.sender_id === payload.new.sender_id) ? prev : [...prev, payload.new]);
                        break;
                    case 'DELETE':
                        if (payload.old?.sender_id) {
                            setFriendRequests(prev => prev.filter(req => req.sender_id !== payload.old.sender_id));
                        }
                        break;
                    case 'UPDATE':
                        setFriendRequests(prev => prev.map(req => req.sender_id === payload.new.sender_id ? { ...req, ...payload.new } : req));
                        break;
                }
            })
            .subscribe((status, err) => {
                console.log(`Friend Request Channel (${channel.topic}) Status:`, status);
                if (err) {
                    console.error(`Friend Request Channel (${channel.topic}) Error:`, err);
                }
            });
        return channel;
    }, [session?.user?.id]);

    const setupRecommendationSubscription = useCallback(() => {
        if (!session?.user?.id) return null;
        const channel = supabaseRealtime.channel(`user_recommendations:${session.user.id}`);
        console.log(`Attempting to subscribe to channel: ${channel.topic}`);
        channel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_recommendations', filter: `receiver_id=eq.${session.user.id}` }, (payload) => {
                console.log('Recommendation Realtime Payload:', payload);
                switch (payload.eventType) {
                    case 'INSERT':
                        console.log('Recommendation INSERT status:', payload.new?.status);
                        if (payload.new?.status === 'pending') {
                            setRecommendations(prev => prev.some(rec => rec.id === payload.new.id) ? prev : [payload.new, ...prev]);
                        }
                        break;
                    case 'UPDATE':
                        console.log('Recommendation UPDATE old status:', payload.old?.status, 'new status:', payload.new?.status);
                        if (payload.old?.status === 'pending' && payload.new?.status !== 'pending') {
                            console.log(`Recommendation ${payload.new.id} status changed, removing from dropdown.`);
                            setRecommendations(prev => prev.filter(rec => rec.id !== payload.new.id));
                        } else if (payload.new?.status === 'pending') {
                            setRecommendations(prev => prev.map(rec => rec.id === payload.new.id ? payload.new : rec));
                        }
                        break;
                    case 'DELETE':
                        console.log('Recommendation DELETE old data:', payload.old);
                        if (payload.old?.id) {
                            console.log(`Recommendation ${payload.old.id} deleted, removing.`);
                            setRecommendations(prev => prev.filter(rec => rec.id !== payload.old.id));
                        }
                        break;
                }
            })
            .subscribe((status, err) => {
                console.log(`Recommendation Channel (${channel.topic}) Status:`, status);
                if (err) {
                    console.error(`Recommendation Channel (${channel.topic}) Error:`, err);
                }
            });
        return channel;
    }, [session?.user?.id]);

    const handleNotificationClick = async (notification, e) => {
        if (e.target.closest('.dismiss-button') || e.target.closest('.action-button')) return;

        if (notification.notificationType === 'friendRequest') {
            router.push('/user-pages/social');
        } else if (notification.notificationType === 'recommendation') {
            router.push(`/user-pages/gallery?mediaId=${notification.media_item_data?.id || notification.id}`);
        } else {
            if (notification.type === 'friend_request_accepted') {
                router.push('/user-pages/social');
            } else if (notification.media_item_id) {
                router.push(`/user-pages/gallery?mediaId=${notification.media_item_id}&commentId=${notification.comment_id || ''}`);
            }
            if (notification.notificationType === 'regular' && !notification.is_read) {
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
                try {
                    await fetch('/api/notifications', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ notificationIds: [notification.id] })
                    });
                } catch (error) {
                    console.error('Error marking notification as read:', error);
                    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: false } : n));
                }
            }
        }
    };

    const handleFriendRequestAction = async (senderId, action, e) => {
        e.stopPropagation();
        try {
            const endpoint = `/api/friend-requests/${senderId}`;
            const method = action === 'accept' ? 'POST' : 'DELETE';
            const response = await fetch(endpoint, { method });
            if (!response.ok) throw new Error(`Failed to ${action} friend request`);
            toast.success(`Friend request ${action === 'accept' ? 'accepted' : 'declined'}`);
        } catch (error) {
            console.error(`Error ${action}ing friend request:`, error);
            toast.error(`Failed to ${action} friend request`);
        }
    };

    const handleAcceptRecommendation = async (recommendationId, e) => {
        e.stopPropagation();
        if (pendingActionRecId) return;
        setPendingActionRecId(recommendationId);
        try {
            const response = await fetch(`/api/recommendations/${recommendationId}/approve`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to approve recommendation');
            toast.success('Recommendation accepted!');
        } catch (error) {
            toast.error('Failed to add item');
            console.error(error);
        } finally {
            setPendingActionRecId(null);
        }
    };

    const handleRejectRecommendation = async (recommendationId, e) => {
        e.stopPropagation();
        if (pendingActionRecId) return;
        setPendingActionRecId(recommendationId);
        try {
            const response = await fetch(`/api/recommendations/${recommendationId}/reject`, { method: 'POST' });
            if (!response.ok) throw new Error('Failed to reject recommendation');
            toast.success('Processing rejection...');
        } catch (error) {
            toast.error('Failed to reject recommendation');
            console.error(error);
        } finally {
            setPendingActionRecId(null);
        }
    };

    const handleDismissNotification = async (notificationId, notificationType, e) => {
        e.stopPropagation();
        if (isDismissing || pendingActionRecId) return;

        if (notificationType === 'recommendation') {
            await handleRejectRecommendation(notificationId, e);
            return;
        }
        if (notificationType === 'friendRequest') {
            const senderId = notificationId.replace('fr-', '');
            await handleFriendRequestAction(senderId, 'decline', e);
            return;
        }

        setIsDismissing(true);
        const originalNotifications = notifications;
        setNotifications(prev => prev.filter(n => n.id !== notificationId));

        try {
            const response = await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to dismiss notification');
            console.log('Notification dismissed successfully (no toast shown).');
        } catch (error) {
            console.error('Error dismissing notification:', error);
            toast.error('Failed to dismiss notification');
            setNotifications(originalNotifications);
        } finally {
            setIsDismissing(false);
        }
    };

    const handleClearAllNotifications = async () => {
        const regularNotifications = notifications;
        if (regularNotifications.length === 0 || isDismissing) return;

        setIsDismissing(true);
        setNotifications([]);

        try {
            const response = await fetch('/api/notifications/clear-all', { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to clear notifications');
            toast.success('Notifications cleared');
        } catch (error) {
            console.error('Error clearing notifications:', error);
            toast.error('Failed to clear notifications');
            setNotifications(regularNotifications);
        } finally {
            setIsDismissing(false);
        }
    };

    const getNotificationIcon = (notification) => {
        if (notification.notificationType === 'friendRequest') {
            return <UserPlus className="h-4 w-4 text-blue-500" />;
        }
        if (notification.notificationType === 'recommendation') {
            return <Mail className="h-4 w-4 text-amber-500" />;
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
            default:
                return <Bell className="h-4 w-4 text-gray-500" />;
        }
    };

    const combinedUnreadCount = allNotifications.filter(n =>
        (n.notificationType === 'regular' && !n.is_read) ||
        n.notificationType === 'friendRequest' ||
        n.notificationType === 'recommendation'
    ).length;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                >
                    <Bell
                        className={`h-5 w-5 transition-all ${combinedUnreadCount > 0
                            ? 'text-primary [filter:drop-shadow(0_0_8px_hsl(var(--primary)))] animate-pulse'
                            : ''
                            }`}
                    />
                    {combinedUnreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                            {combinedUnreadCount > 9 ? '9+' : combinedUnreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 max-h-[70vh] overflow-y-auto" align="end">
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

                {isLoading ? (
                    <DropdownMenuItem disabled className="justify-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
                    </DropdownMenuItem>
                ) : allNotifications.length === 0 ? (
                    <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
                ) : (
                    allNotifications.map(notification => (
                        <DropdownMenuItem
                            key={notification.id}
                            className={`cursor-pointer ${notification.notificationType === 'regular' && !notification.is_read ? 'bg-muted/50' : ''} relative pr-8`}
                            onSelect={(e) => e.preventDefault()}
                            onClick={(e) => handleNotificationClick(notification, e)}
                        >
                            <div className="flex gap-3 w-full">
                                <div className="flex-shrink-0 mt-1">
                                    {getNotificationIcon(notification)}
                                </div>
                                <div className="flex flex-col gap-1 flex-grow">
                                    {notification.notificationType === 'friendRequest' && (
                                        <>
                                            <p className="text-sm">
                                                <span className="font-medium">{notification.sender?.username || 'User'}</span>
                                                {' sent a friend request'}
                                            </p>
                                            <div className="flex gap-2 mt-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs action-button"
                                                    onClick={(e) => handleFriendRequestAction(notification.sender_id, 'accept', e)}
                                                >
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Accept
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs action-button"
                                                    onClick={(e) => handleFriendRequestAction(notification.sender_id, 'decline', e)}
                                                >
                                                    <X className="h-3 w-3 mr-1" />
                                                    Decline
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                    {notification.notificationType === 'recommendation' && (
                                        <>
                                            <p className="text-sm">
                                                <span className="font-medium">{notification.sender?.username || 'User'}</span>
                                                {' recommended '}
                                                <span className="font-medium">{notification.media_item_data?.title || 'an item'}</span>
                                            </p>
                                            <div className="flex gap-2 mt-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs action-button"
                                                    disabled={pendingActionRecId === notification.id}
                                                    onClick={(e) => handleAcceptRecommendation(notification.id, e)}
                                                >
                                                    {pendingActionRecId === notification.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" /> Accept</>}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs action-button"
                                                    disabled={pendingActionRecId === notification.id}
                                                    onClick={(e) => handleRejectRecommendation(notification.id, e)}
                                                >
                                                    {pendingActionRecId === notification.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><X className="h-3 w-3 mr-1" /> Decline</>}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                    {notification.notificationType === 'regular' && (
                                        <p className="text-sm">
                                            <span className="font-medium">{notification.user?.username || 'User'}</span>
                                            {' '}
                                            {notification.message}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="dismiss-button absolute right-1 top-1 h-6 w-6 rounded-full opacity-70 hover:opacity-100 hover:bg-muted"
                                onClick={(e) => handleDismissNotification(notification.id, notification.notificationType, e)}
                                disabled={isDismissing || pendingActionRecId === notification.id}
                            >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Dismiss</span>
                            </Button>
                        </DropdownMenuItem>
                    ))
                )}

                {friendRequests.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="cursor-pointer justify-center text-sm text-muted-foreground"
                            onSelect={() => router.push('/user-pages/social')}
                        >
                            Manage all friend requests
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 