import { create } from 'zustand';

const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    friendRequests: [],
    setNotifications: (notifications) => {
        set({
            notifications,
            unreadCount: notifications.filter(n => !n.is_read).length
        });
    },
    setFriendRequests: (requests) => {
        set({ friendRequests: requests });
    },
    addNotification: (notification) => {
        set(state => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + (notification.is_read ? 0 : 1)
        }));
    },
    markAsRead: (notificationId) => {
        set(state => ({
            notifications: state.notifications.map(n =>
                n.id === notificationId ? { ...n, is_read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
        }));
    },
    markMultipleAsRead: (notificationIds) => {
        set(state => ({
            notifications: state.notifications.map(n =>
                notificationIds.includes(n.id) ? { ...n, is_read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - notificationIds.length)
        }));
    },
    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(notification => notification.id !== id),
        unreadCount: state.notifications.filter(n => !n.is_read && n.id !== id).length
    })),
    removeFriendRequest: (senderId) => set((state) => ({
        friendRequests: state.friendRequests.filter(req => req.sender_id !== senderId)
    }))
}));

export default useNotificationStore; 