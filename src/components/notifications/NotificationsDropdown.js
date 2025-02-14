'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
import useNotificationStore from '@/store/notificationStore';

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

    useEffect(() => {
        if (session?.user?.id) {
            fetchNotifications();
            const subscription = setupRealtimeSubscription();
            return () => {
                if (subscription) {
                    supabaseRealtime.removeChannel(subscription);
                }
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
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={async (e) => {
                                e.preventDefault();
                                const unreadIds = notifications
                                    .filter(n => !n.is_read)
                                    .map(n => n.id);
                                try {
                                    await fetch('/api/notifications', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ notificationIds: unreadIds })
                                    });
                                    markMultipleAsRead(unreadIds);
                                } catch (error) {
                                    console.error('Error marking all as read:', error);
                                }
                            }}
                        >
                            Mark all as read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
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
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 