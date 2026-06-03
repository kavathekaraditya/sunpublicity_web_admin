import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    X,
    Check,
    Info,
    AlertTriangle,
    Trash2,
    CheckCircle,
    XCircle,
    Mail,
    Calendar,
    Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../contexts/NotificationContext';
import { useToast } from '../contexts/ToastContext';
import ConfirmDialog from './ConfirmDialog';

const NotificationCenter = () => {
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications
    } = useNotifications();

    const { showToast } = useToast();
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        type: null, // 'delete' or 'clearAll'
        notificationId: null
    });
    const [previousUnreadCount, setPreviousUnreadCount] = useState(0);

    const dropdownRef = useRef(null);

    // Badge animation when new notifications arrive
    useEffect(() => {
        if (unreadCount > previousUnreadCount && previousUnreadCount > 0) {
            // Trigger animation (handled by CSS)
        }
        setPreviousUnreadCount(unreadCount);
    }, [unreadCount, previousUnreadCount]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get icon based on notification type
    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />;
            default:
                return <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
        }
    };

    // Get category icon
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'contact':
                return <Mail className="w-4 h-4" />;
            case 'booking':
                return <Calendar className="w-4 h-4" />;
            case 'system':
                return <Settings className="w-4 h-4" />;
            default:
                return <Bell className="w-4 h-4" />;
        }
    };

    // Filter notifications by category
    const filteredNotifications = notifications.filter(notification => {
        if (activeCategory === 'all') return true;
        if (activeCategory === 'unread') return !notification.read;
        return notification.category === activeCategory;
    });

    // Get category counts
    const categoryCounts = {
        all: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        contact: notifications.filter(n => n.category === 'contact').length,
        booking: notifications.filter(n => n.category === 'booking').length,
        system: notifications.filter(n => n.category === 'system').length
    };

    // Handle notification click (navigate)
    const handleNotificationClick = async (notification) => {
        // Mark as read
        if (!notification.read) {
            try {
                await markAsRead(notification.id);
            } catch (error) {
                console.error('Error marking as read:', error);
            }
        }

        // Navigate if action is defined
        if (notification.actionType === 'navigate' && notification.actionPath) {
            setIsOpen(false);
            navigate(notification.actionPath, {
                state: notification.actionData
            });
        }
    };

    // Handle delete notification
    const handleDeleteClick = (notificationId, event) => {
        event.stopPropagation(); // Prevent notification click
        setConfirmDialog({
            isOpen: true,
            type: 'delete',
            notificationId
        });
    };

    const confirmDeleteNotification = async () => {
        const { notificationId } = confirmDialog;
        setConfirmDialog({ isOpen: false, type: null, notificationId: null });

        try {
            await deleteNotification(notificationId);
            showToast('Notification deleted', 'success');
        } catch (error) {
            showToast('Failed to delete notification', 'error');
        }
    };

    // Handle clear all
    const handleClearAll = () => {
        setConfirmDialog({
            isOpen: true,
            type: 'clearAll',
            notificationId: null
        });
    };

    const confirmClearAll = async () => {
        setConfirmDialog({ isOpen: false, type: null, notificationId: null });

        try {
            await clearAllNotifications();
            showToast('All notifications cleared', 'success');
        } catch (error) {
            showToast('Failed to clear notifications', 'error');
        }
    };

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            showToast('All notifications marked as read', 'success');
        } catch (error) {
            showToast('Failed to mark all as read', 'error');
        }
    };

    const cancelDialog = () => {
        setConfirmDialog({ isOpen: false, type: null, notificationId: null });
    };

    // Format timestamp
    const formatTimestamp = (date) => {
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true });
        } catch {
            return 'Recently';
        }
    };

    // Skeleton loader
    const SkeletonLoader = () => (
        <div className="space-y-3 p-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                    <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    aria-label="Notifications"
                >
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-scale-in">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    Notifications
                                </h3>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={handleClearAll}
                                            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium flex items-center gap-1"
                                            title="Clear all notifications"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Category Tabs */}
                            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                                {[
                                    { key: 'all', label: 'All', icon: <Bell className="w-3 h-3" /> },
                                    { key: 'unread', label: 'Unread', icon: <Check className="w-3 h-3" /> },
                                    { key: 'contact', label: 'Messages', icon: <Mail className="w-3 h-3" /> },
                                    { key: 'booking', label: 'Bookings', icon: <Calendar className="w-3 h-3" /> },
                                    { key: 'system', label: 'System', icon: <Settings className="w-3 h-3" /> }
                                ].map(category => (
                                    <button
                                        key={category.key}
                                        onClick={() => setActiveCategory(category.key)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${activeCategory === category.key
                                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {category.icon}
                                        {category.label}
                                        {categoryCounts[category.key] > 0 && (
                                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${activeCategory === category.key
                                                    ? 'bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200'
                                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                                }`}>
                                                {categoryCounts[category.key]}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <SkeletonLoader />
                            ) : filteredNotifications.length > 0 ? (
                                filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 border-b border-gray-100 dark:border-gray-700 transition-colors ${notification.actionType === 'navigate'
                                                ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                : ''
                                            } ${!notification.read
                                                ? 'bg-blue-50/50 dark:bg-blue-900/10'
                                                : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className="mt-1 flex-shrink-0">
                                                {getIcon(notification.type)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm font-medium ${!notification.read
                                                            ? 'text-gray-900 dark:text-white'
                                                            : 'text-gray-600 dark:text-gray-400'
                                                        }`}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.read && (
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                                                    )}
                                                </div>

                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    {notification.message}
                                                </p>

                                                <div className="flex items-center justify-between mt-2">
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                                        {formatTimestamp(notification.createdAt)}
                                                    </p>

                                                    <div className="flex items-center gap-1">
                                                        {/* Category Badge */}
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                                            {getCategoryIcon(notification.category)}
                                                            {notification.category}
                                                        </span>

                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={(e) => handleDeleteClick(notification.id, e)}
                                                            className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                                                            title="Delete notification"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p className="font-medium">
                                        {activeCategory === 'all'
                                            ? 'No notifications'
                                            : `No ${activeCategory} notifications`}
                                    </p>
                                    <p className="text-xs mt-1">
                                        {activeCategory === 'unread'
                                            ? "You're all caught up!"
                                            : 'Notifications will appear here'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onConfirm={confirmDialog.type === 'delete' ? confirmDeleteNotification : confirmClearAll}
                onCancel={cancelDialog}
                title={confirmDialog.type === 'delete' ? 'Delete Notification' : 'Clear All Notifications'}
                message={
                    confirmDialog.type === 'delete'
                        ? 'Are you sure you want to delete this notification? This action cannot be undone.'
                        : 'Are you sure you want to clear all notifications? This action cannot be undone.'
                }
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </>
    );
};

export default NotificationCenter;
