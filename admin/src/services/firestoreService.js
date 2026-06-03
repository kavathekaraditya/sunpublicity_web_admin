import {
    collection,
    getDocs,
    onSnapshot,
    query,
    orderBy,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Firestore Service - Centralized data fetching for all collections
 */

// ============================================
// FETCH ALL DATA FROM ALL COLLECTIONS
// ============================================

/**
 * Fetch all data from Firestore (all collections)
 * @returns {Promise<Object>} Object containing all collection data
 */
export const fetchAllData = async () => {
    try {
        const [users, bookings, categories, hoardings, contactMessages] = await Promise.all([
            fetchUsers(),
            fetchBookings(),
            fetchCategories(),
            fetchHoardings(),
            fetchContactMessages()
        ]);

        return {
            users,
            bookings,
            categories,
            hoardings,
            contactMessages,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error fetching all data:', error);
        throw error;
    }
};

// ============================================
// WORKERS COLLECTION
// ============================================

/**
 * Fetch all workers from Firestore
 * @returns {Promise<Array>} Array of worker objects
 */
export const fetchWorkers = async () => {
    try {
        const workersRef = collection(db, 'workers');
        const q = query(workersRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const workers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`✅ Fetched ${workers.length} workers`);
        return workers;
    } catch (error) {
        console.error('Error fetching workers:', error);
        throw error;
    }
};

/**
 * Subscribe to real-time workers updates
 * @param {Function} callback - Function to call with updated data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToWorkers = (callback) => {
    const workersRef = collection(db, 'workers');
    const q = query(workersRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const workers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(workers);
    }, (error) => {
        console.error('Error in workers subscription:', error);
    });
};

// ============================================
// USERS COLLECTION
// ============================================

/**
 * Fetch all users from Firestore
 * @returns {Promise<Array>} Array of user objects
 */
export const fetchUsers = async () => {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);

        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`✅ Fetched ${users.length} users`);
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

/**
 * Subscribe to real-time users updates
 * @param {Function} callback - Function to call with updated data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUsers = (callback) => {
    const usersRef = collection(db, 'users');
    return onSnapshot(usersRef, (snapshot) => {
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(users);
    }, (error) => {
        console.error('Error in users subscription:', error);
    });
};

// ============================================
// BOOKINGS COLLECTION
// ============================================

/**
 * Fetch all bookings from Firestore
 * @returns {Promise<Array>} Array of booking objects
 */
export const fetchBookings = async () => {
    try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`✅ Fetched ${bookings.length} bookings`);
        return bookings;
    } catch (error) {
        console.error('Error fetching bookings:', error);
        throw error;
    }
};

/**
 * Subscribe to real-time bookings updates
 * @param {Function} callback - Function to call with updated data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToBookings = (callback) => {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(bookings);
    }, (error) => {
        console.error('Error in bookings subscription:', error);
    });
};

/**
 * Fetch bookings by status
 * @param {string} status - Booking status (pending, approved, rejected)
 * @returns {Promise<Array>} Array of filtered booking objects
 */
export const fetchBookingsByStatus = async (status) => {
    try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(
            bookingsRef,
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);

        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`✅ Fetched ${bookings.length} ${status} bookings`);
        return bookings;
    } catch (error) {
        console.error(`Error fetching ${status} bookings:`, error);
        throw error;
    }
};

/**
 * Fetch bookings by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of user's booking objects
 */
export const fetchBookingsByUser = async (userId) => {
    try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(
            bookingsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);

        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`✅ Fetched ${bookings.length} bookings for user ${userId}`);
        return bookings;
    } catch (error) {
        console.error(`Error fetching bookings for user ${userId}:`, error);
        throw error;
    }
};

// ============================================
// CATEGORIES COLLECTION
// ============================================

/**
 * Fetch all categories from Firestore
 * @returns {Promise<Array>} Array of category objects
 */
export const fetchCategories = async () => {
    try {
        const categoriesRef = collection(db, 'categories');
        const q = query(categoriesRef, orderBy('order', 'asc'));
        const snapshot = await getDocs(q);

        const categories = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`✅ Fetched ${categories.length} categories`);
        return categories;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};

/**
 * Subscribe to real-time categories updates
 * @param {Function} callback - Function to call with updated data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCategories = (callback) => {
    const categoriesRef = collection(db, 'categories');
    const q = query(categoriesRef, orderBy('order', 'asc'));

    return onSnapshot(q, (snapshot) => {
        const categories = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(categories);
    }, (error) => {
        console.error('Error in categories subscription:', error);
    });
};

/**
 * Fetch active categories only
 * @returns {Promise<Array>} Array of active category objects
 */
export const fetchActiveCategories = async () => {
    try {
        const categoriesRef = collection(db, 'categories');
        const q = query(
            categoriesRef,
            where('active', '==', true),
            orderBy('order', 'asc')
        );
        const snapshot = await getDocs(q);

        const categories = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`✅ Fetched ${categories.length} active categories`);
        return categories;
    } catch (error) {
        console.error('Error fetching active categories:', error);
        throw error;
    }
};

// ============================================
// HOARDINGS COLLECTION
// ============================================

/**
 * Fetch all hoardings from all categories
 * @returns {Promise<Array>} Array of hoarding objects with category info
 */
export const fetchHoardings = async () => {
    try {
        const categories = await fetchCategories();
        const allHoardings = [];

        for (const category of categories) {
            const hoardingsRef = collection(db, 'categories', category.id, 'hoardings');
            const snapshot = await getDocs(hoardingsRef);

            const hoardings = snapshot.docs.map(doc => ({
                id: doc.id,
                categoryId: category.id,
                categoryName: category.name,
                ...doc.data()
            }));

            allHoardings.push(...hoardings);
        }

        console.log(`✅ Fetched ${allHoardings.length} hoardings from ${categories.length} categories`);
        return allHoardings;
    } catch (error) {
        console.error('Error fetching hoardings:', error);
        throw error;
    }
};

/**
 * Fetch hoardings from a specific category
 * @param {string} categoryId - Category ID
 * @returns {Promise<Array>} Array of hoarding objects
 */
export const fetchHoardingsByCategory = async (categoryId) => {
    try {
        const hoardingsRef = collection(db, 'categories', categoryId, 'hoardings');
        const snapshot = await getDocs(hoardingsRef);

        const hoardings = snapshot.docs.map(doc => ({
            id: doc.id,
            categoryId,
            ...doc.data()
        }));

        console.log(`✅ Fetched ${hoardings.length} hoardings from category ${categoryId}`);
        return hoardings;
    } catch (error) {
        console.error(`Error fetching hoardings for category ${categoryId}:`, error);
        throw error;
    }
};

/**
 * Subscribe to real-time hoardings updates for a category
 * @param {string} categoryId - Category ID
 * @param {Function} callback - Function to call with updated data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToHoardingsByCategory = (categoryId, callback) => {
    const hoardingsRef = collection(db, 'categories', categoryId, 'hoardings');

    return onSnapshot(hoardingsRef, (snapshot) => {
        const hoardings = snapshot.docs.map(doc => ({
            id: doc.id,
            categoryId,
            ...doc.data()
        }));
        callback(hoardings);
    }, (error) => {
        console.error(`Error in hoardings subscription for category ${categoryId}:`, error);
    });
};

// ============================================
// CONTACT MESSAGES COLLECTION
// ============================================

/**
 * Fetch all contact messages from Firestore
 * @returns {Promise<Array>} Array of contact message objects
 */
export const fetchContactMessages = async () => {
    try {
        const messagesRef = collection(db, 'contactMessages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`✅ Fetched ${messages.length} contact messages`);
        return messages;
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        throw error;
    }
};

/**
 * Subscribe to real-time contact messages updates
 * @param {Function} callback - Function to call with updated data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToContactMessages = (callback) => {
    const messagesRef = collection(db, 'contactMessages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(messages);
    }, (error) => {
        console.error('Error in contact messages subscription:', error);
    });
};

/**
 * Fetch unread contact messages
 * @returns {Promise<Array>} Array of unread contact message objects
 */
export const fetchUnreadContactMessages = async () => {
    try {
        const messagesRef = collection(db, 'contactMessages');
        const q = query(
            messagesRef,
            where('read', '==', false),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);

        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`✅ Fetched ${messages.length} unread contact messages`);
        return messages;
    } catch (error) {
        console.error('Error fetching unread contact messages:', error);
        throw error;
    }
};

// ============================================
// STATISTICS & ANALYTICS
// ============================================

/**
 * Fetch dashboard statistics
 * @returns {Promise<Object>} Object containing various statistics
 */
export const fetchDashboardStats = async () => {
    try {
        const [users, bookings, categories, hoardings, contactMessages] = await Promise.all([
            fetchUsers(),
            fetchBookings(),
            fetchCategories(),
            fetchHoardings(),
            fetchContactMessages()
        ]);

        const pendingBookings = bookings.filter(b => b.status === 'pending').length;
        const approvedBookings = bookings.filter(b => b.status === 'approved').length;
        const rejectedBookings = bookings.filter(b => b.status === 'rejected').length;
        const unreadMessages = contactMessages.filter(m => !m.read).length;
        const activeCategories = categories.filter(c => c.active).length;

        const stats = {
            totalUsers: users.length,
            totalBookings: bookings.length,
            pendingBookings,
            approvedBookings,
            rejectedBookings,
            totalCategories: categories.length,
            activeCategories,
            totalHoardings: hoardings.length,
            totalContactMessages: contactMessages.length,
            unreadMessages,
            timestamp: new Date().toISOString()
        };

        console.log('✅ Dashboard statistics:', stats);
        return stats;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
    // Fetch all data
    fetchAllData,

    // Users
    fetchUsers,
    subscribeToUsers,

    // Bookings
    fetchBookings,
    subscribeToBookings,
    fetchBookingsByStatus,
    fetchBookingsByUser,

    // Categories
    fetchCategories,
    subscribeToCategories,
    fetchActiveCategories,

    // Hoardings
    fetchHoardings,
    fetchHoardingsByCategory,
    subscribeToHoardingsByCategory,

    // Contact Messages
    fetchContactMessages,
    subscribeToContactMessages,
    fetchUnreadContactMessages,

    // Statistics
    fetchDashboardStats,

    // Workers
    fetchWorkers,
    subscribeToWorkers
};
