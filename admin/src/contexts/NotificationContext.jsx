import { createContext, useContext, useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    where,
    Timestamp,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

const NotificationContext = createContext({});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    // Cleanup old notifications (30+ days)
    const deleteNotificationsOlderThan30Days = async () => {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const q = query(
                collection(db, 'notifications'),
                where('createdAt', '<', Timestamp.fromDate(thirtyDaysAgo))
            );

            const snapshot = await getDocs(q);

            if (snapshot.size > 0) {
                const batch = writeBatch(db);
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                console.log(`Deleted ${snapshot.size} old notifications`);
            }
        } catch (error) {
            console.error('Error deleting old notifications:', error);
        }
    };

    // Add notification to Firestore
    const addNotification = async (data) => {
        try {
            const notificationId = data.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const notificationRef = doc(db, 'notifications', notificationId);

            await setDoc(notificationRef, {
                type: data.type || 'info',
                category: data.category || 'system',
                title: data.title,
                message: data.message,
                read: false,
                createdAt: serverTimestamp(),
                actionType: data.actionType || null,
                actionPath: data.actionPath || null,
                actionData: data.actionData || null,
                sourceCollection: data.sourceCollection || null,
                sourceId: data.sourceId || null
            });

            return notificationId;
        } catch (error) {
            console.error('Error adding notification:', error);
            throw error;
        }
    };

    // Mark single notification as read
    const markAsRead = async (notificationId) => {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), {
                read: true
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.read);

            if (unreadNotifications.length === 0) return;

            const batch = writeBatch(db);
            unreadNotifications.forEach(notification => {
                const notifRef = doc(db, 'notifications', notification.id);
                batch.update(notifRef, { read: true });
            });

            await batch.commit();
        } catch (error) {
            console.error('Error marking all as read:', error);
            throw error;
        }
    };

    // Delete single notification
    const deleteNotification = async (notificationId) => {
        try {
            await deleteDoc(doc(db, 'notifications', notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    };

    // Clear all notifications
    const clearAllNotifications = async () => {
        try {
            const batch = writeBatch(db);
            notifications.forEach(notification => {
                const notifRef = doc(db, 'notifications', notification.id);
                batch.delete(notifRef);
            });

            await batch.commit();
        } catch (error) {
            console.error('Error clearing all notifications:', error);
            throw error;
        }
    };

    // Real-time listener for notifications
    useEffect(() => {
        const q = query(
            collection(db, 'notifications'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const notificationData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Convert Firestore Timestamp to Date
                    createdAt: doc.data().createdAt?.toDate() || new Date()
                }));

                setNotifications(notificationData);

                // Compute unread count
                const unread = notificationData.filter(n => !n.read).length;
                setUnreadCount(unread);

                setLoading(false);
            },
            (error) => {
                console.error('Error fetching notifications:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // Cleanup old notifications on mount
    useEffect(() => {
        deleteNotificationsOlderThan30Days();
    }, []);

    // Real-time listener for contact messages
    useEffect(() => {
        const contactMessagesRef = collection(db, 'contactMessages');
        const q = query(contactMessagesRef, orderBy('createdAt', 'desc'));

        let isInitialLoad = true;

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // Skip initial load to avoid creating notifications for existing messages
            if (isInitialLoad) {
                isInitialLoad = false;
                return;
            }

            // Check for new messages
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const message = change.doc.data();
                    const messageId = change.doc.id;

                    // Create notification with stable ID
                    addNotification({
                        id: `contact_msg_${messageId}`,
                        type: 'info',
                        category: 'contact',
                        title: '📩 New Contact Message',
                        message: `${message.name || 'Someone'} sent a message`,
                        actionType: 'navigate',
                        actionPath: '/contacts',
                        actionData: { messageId },
                        sourceCollection: 'contactMessages',
                        sourceId: messageId
                    }).catch(err => {
                        // Ignore duplicate key errors (notification already exists)
                        if (!err.message?.includes('already exists')) {
                            console.error('Error creating contact notification:', err);
                        }
                    });
                }
            });
        }, (error) => {
            console.error('Error listening to contact messages:', error);
        });

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Real-time listener for bookings
    useEffect(() => {
        const bookingsRef = collection(db, 'bookings');

        let isInitialLoad = true;

        const unsubscribe = onSnapshot(bookingsRef, (snapshot) => {
            // Skip initial load
            if (isInitialLoad) {
                isInitialLoad = false;
                return;
            }

            const now = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(now.getDate() + 7);

            snapshot.docChanges().forEach((change) => {
                const booking = change.doc.data();
                const bookingId = change.doc.id;

                // New pending booking
                if (change.type === 'added' && booking.status === 'Pending') {
                    addNotification({
                        id: `booking_pending_${bookingId}`,
                        type: 'info',
                        category: 'booking',
                        title: 'New Booking Request',
                        message: `New booking request for ${booking.hoardingTitle || 'hoarding'}`,
                        actionType: 'navigate',
                        actionPath: '/bookings',
                        actionData: { bookingId, filter: 'pending' },
                        sourceCollection: 'bookings',
                        sourceId: bookingId
                    }).catch(err => {
                        if (!err.message?.includes('already exists')) {
                            console.error('Error creating booking notification:', err);
                        }
                    });
                }

                // Approved booking expiring soon
                if (booking.status === 'Approved' && booking.endDate) {
                    const endDate = booking.endDate.toDate ? booking.endDate.toDate() : new Date(booking.endDate);

                    if (endDate > now && endDate <= nextWeek) {
                        addNotification({
                            id: `booking_expiry_${bookingId}`,
                            type: 'warning',
                            category: 'booking',
                            title: 'Booking Expiring Soon',
                            message: `Booking for ${booking.hoardingTitle || 'hoarding'} expires on ${endDate.toLocaleDateString()}`,
                            actionType: 'navigate',
                            actionPath: '/bookings',
                            actionData: { bookingId },
                            sourceCollection: 'bookings',
                            sourceId: bookingId
                        }).catch(err => {
                            if (!err.message?.includes('already exists')) {
                                console.error('Error creating expiry notification:', err);
                            }
                        });
                    }
                }
            });
        }, (error) => {
            console.error('Error listening to bookings:', error);
        });

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            addNotification,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            clearAllNotifications,
            deleteNotificationsOlderThan30Days
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
