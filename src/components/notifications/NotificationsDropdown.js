'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail } from 'lucide-react';
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

export default function NotificationsDropdown() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();

    useEffect(() => {
        fetchNotifications();
        setupRealtimeSubscription();
    }, []);

    const setupRealtimeSubscription = () => {
        const subscription = supabaseRealtime
            .channel('notifications-channel')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications'
            }, (payload) => {
                setNotifications(prev => [payload.new, ...prev]);
                if (!payload.new.is_read) {
                    setUnreadCount(prev => prev + 1);
                }
            })
            .subscribe();

        return () => {
            supabaseRealtime.removeChannel(subscription);
        };
    };

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications');
            const data = await response.json();
            if (data.notifications) {
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter(n => !n.is_read).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read
        if (!notification.is_read) {
            try {
                await fetch('/api/notifications', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notificationIds: [notification.id] })
                });
                setUnreadCount(prev => Math.max(0, prev - 1));
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
                <Button variant="ghost" size="icon" className="relative">
                    <Mail className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                    <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
                ) : (
                    notifications.map(notification => (
                        <DropdownMenuItem
                            key={notification.id}
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
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 