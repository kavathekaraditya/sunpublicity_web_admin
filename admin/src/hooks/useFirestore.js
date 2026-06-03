import { useState, useEffect } from 'react';
import {
    fetchAllData,
    fetchUsers,
    fetchBookings,
    fetchCategories,
    fetchHoardings,
    fetchContactMessages,
    fetchDashboardStats,
    subscribeToUsers,
    subscribeToBookings,
    subscribeToCategories,
    subscribeToContactMessages,
    fetchBookingsByStatus,
    fetchBookingsByUser,
    fetchActiveCategories,
    fetchHoardingsByCategory,
    fetchUnreadContactMessages,
    fetchWorkers,
    subscribeToWorkers
} from '../services/firestoreService';

/**
 * Custom hook to fetch all Firestore data
 * @param {boolean} realtime - Whether to use real-time updates
 * @returns {Object} { data, loading, error, refetch }
 */
export const useAllFirestoreData = (realtime = false) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetchAllData();
            setData(result);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching all data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!realtime) {
            fetchData();
        } else {
            // Set up real-time listeners for all collections
            const unsubscribers = [];

            const setupRealtimeListeners = async () => {
                try {
                    setLoading(true);
                    setError(null);

                    let usersData = [];
                    let bookingsData = [];
                    let categoriesData = [];
                    let contactMessagesData = [];

                    // Subscribe to users
                    const unsubUsers = subscribeToUsers((users) => {
                        usersData = users;
                        updateData();
                    });
                    unsubscribers.push(unsubUsers);

                    // Subscribe to bookings
                    const unsubBookings = subscribeToBookings((bookings) => {
                        bookingsData = bookings;
                        updateData();
                    });
                    unsubscribers.push(unsubBookings);

                    // Subscribe to categories
                    const unsubCategories = subscribeToCategories((categories) => {
                        categoriesData = categories;
                        updateData();
                    });
                    unsubscribers.push(unsubCategories);

                    // Subscribe to contact messages
                    const unsubMessages = subscribeToContactMessages((messages) => {
                        contactMessagesData = messages;
                        updateData();
                    });
                    unsubscribers.push(unsubMessages);

                    // Fetch hoardings once (or implement real-time if needed)
                    const hoardingsData = await fetchHoardings();

                    const updateData = () => {
                        setData({
                            users: usersData,
                            bookings: bookingsData,
                            categories: categoriesData,
                            hoardings: hoardingsData,
                            contactMessages: contactMessagesData,
                            timestamp: new Date().toISOString()
                        });
                        setLoading(false);
                    };

                    // Initial update
                    updateData();
                } catch (err) {
                    setError(err.message);
                    console.error('Error setting up real-time listeners:', err);
                    setLoading(false);
                }
            };

            setupRealtimeListeners();

            // Cleanup
            return () => {
                unsubscribers.forEach(unsub => unsub());
            };
        }
    }, [realtime]);

    return { data, loading, error, refetch: fetchData };
};

/**
 * Custom hook to fetch users
 * @param {boolean} realtime - Whether to use real-time updates
 * @returns {Object} { users, loading, error, refetch }
 */
export const useUsers = (realtime = false) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetchUsers();
            setUsers(result);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!realtime) {
            fetchData();
        } else {
            const unsubscribe = subscribeToUsers((data) => {
                setUsers(data);
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [realtime]);

    return { users, loading, error, refetch: fetchData };
};

/**
 * Custom hook to fetch workers
 * @param {boolean} realtime - Whether to use real-time updates
 * @returns {Object} { workers, loading, error, refetch }
 */
export const useWorkers = (realtime = false) => {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetchWorkers();
            setWorkers(result);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching workers:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!realtime) {
            fetchData();
        } else {
            const unsubscribe = subscribeToWorkers((data) => {
                setWorkers(data);
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [realtime]);

    return { workers, loading, error, refetch: fetchData };
};

/**
 * Custom hook to fetch bookings
 * @param {boolean} realtime - Whether to use real-time updates
 * @param {string} status - Optional status filter
 * @param {string} userId - Optional user ID filter
 * @returns {Object} { bookings, loading, error, refetch }
 */
export const useBookings = (realtime = false, status = null, userId = null) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            let result;

            if (status) {
                result = await fetchBookingsByStatus(status);
            } else if (userId) {
                result = await fetchBookingsByUser(userId);
            } else {
                result = await fetchBookings();
            }

            setBookings(result);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!realtime) {
            fetchData();
        } else {
            const unsubscribe = subscribeToBookings((data) => {
                let filteredData = data;

                if (status) {
                    filteredData = data.filter(b => b.status === status);
                }
                if (userId) {
                    filteredData = data.filter(b => b.userId === userId);
                }

                setBookings(filteredData);
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [realtime, status, userId]);

    return { bookings, loading, error, refetch: fetchData };
};

/**
 * Custom hook to fetch categories
 * @param {boolean} realtime - Whether to use real-time updates
 * @param {boolean} activeOnly - Whether to fetch only active categories
 * @returns {Object} { categories, loading, error, refetch }
 */
export const useCategories = (realtime = false, activeOnly = false) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = activeOnly ? await fetchActiveCategories() : await fetchCategories();
            setCategories(result);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching categories:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!realtime) {
            fetchData();
        } else {
            const unsubscribe = subscribeToCategories((data) => {
                const filteredData = activeOnly ? data.filter(c => c.active) : data;
                setCategories(filteredData);
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [realtime, activeOnly]);

    return { categories, loading, error, refetch: fetchData };
};

/**
 * Custom hook to fetch hoardings
 * @param {string} categoryId - Optional category ID filter
 * @returns {Object} { hoardings, loading, error, refetch }
 */
export const useHoardings = (categoryId = null) => {
    const [hoardings, setHoardings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = categoryId
                ? await fetchHoardingsByCategory(categoryId)
                : await fetchHoardings();
            setHoardings(result);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching hoardings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [categoryId]);

    return { hoardings, loading, error, refetch: fetchData };
};

/**
 * Custom hook to fetch contact messages
 * @param {boolean} realtime - Whether to use real-time updates
 * @param {boolean} unreadOnly - Whether to fetch only unread messages
 * @returns {Object} { messages, loading, error, refetch }
 */
export const useContactMessages = (realtime = false, unreadOnly = false) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = unreadOnly
                ? await fetchUnreadContactMessages()
                : await fetchContactMessages();
            setMessages(result);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching contact messages:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!realtime) {
            fetchData();
        } else {
            const unsubscribe = subscribeToContactMessages((data) => {
                const filteredData = unreadOnly ? data.filter(m => !m.read) : data;
                setMessages(filteredData);
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [realtime, unreadOnly]);

    return { messages, loading, error, refetch: fetchData };
};

/**
 * Custom hook to fetch dashboard statistics
 * @returns {Object} { stats, loading, error, refetch }
 */
export const useDashboardStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetchDashboardStats();
            setStats(result);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching dashboard stats:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return { stats, loading, error, refetch: fetchData };
};
