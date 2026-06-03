import React, { useState, useEffect, useMemo } from 'react';
import {
    collection,
    onSnapshot,
    query,
    where,
    limit,
    orderBy,
    collectionGroup
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
    Users,
    Map as MapIcon,
    Calendar,
    IndianRupee,
    TrendingUp,
    Clock,
    ExternalLink,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, startOfDay, subDays } from 'date-fns';
import StatCard from '../components/StatCard';
import DashboardFilters from '../components/DashboardFilters';
import DashboardCharts from '../components/DashboardCharts';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Raw Data State
    const [bookings, setBookings] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [hoardings, setHoardings] = useState([]);
    const [categories, setCategories] = useState([]);

    // Filters State
    const [dateFilter, setDateFilter] = useState('this-month');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');

    useEffect(() => {
        setLoading(true);

        // 1. Real-time Bookings
        const unsubscribeBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || Date.now())
            }));
            setBookings(data);
            setLoading(false);
        }, (err) => setError("Failed to connect to bookings stream."));

        // 2. Real-time Customers
        const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCustomers(data.filter(u => u.role === 'customer'));
        }, (err) => setError("Failed to connect to users stream."));

        // 3. Real-time Hoardings (All categories)
        const unsubscribeHoardings = onSnapshot(collectionGroup(db, 'hoardings'), (snapshot) => {
            setHoardings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => setError("Failed to connect to hoardings stream."));

        // 4. Real-time Categories (for filter)
        const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
            setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeBookings();
            unsubscribeUsers();
            unsubscribeHoardings();
            unsubscribeCategories();
        };
    }, []);

    // Analytical Computations
    const analytics = useMemo(() => {
        const now = new Date();
        const startOfThisMonth = startOfMonth(now);
        const startOfLastMonth = startOfMonth(subMonths(now, 1));
        const endOfLastMonth = endOfMonth(subMonths(now, 1));

        // Filter bookings based on active filters
        const filteredBookings = bookings.filter(b => {
            // Status Filter
            if (statusFilter !== 'all' && b.status !== statusFilter) return false;

            // Category Filter
            if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;

            // Date Filter
            if (dateFilter === 'today') {
                return b.createdAt >= startOfDay(now);
            } else if (dateFilter === 'last-7-days') {
                return b.createdAt >= subDays(now, 7);
            } else if (dateFilter === 'this-month') {
                return b.createdAt >= startOfThisMonth;
            }
            return true; // all-time
        });

        // 1. Core Stats
        const currentRevenue = filteredBookings.reduce((sum, b) =>
            (b.status === 'Approved' || b.paymentStatus === 'Paid') ? sum + (Number(b.totalPrice || b.amount) || 0) : sum, 0);

        const activeBookings = bookings.filter(b => b.status === 'Approved').length;

        // 2. Trend Calculations (Current Month vs Last Month)
        const bookingsThisMonth = bookings.filter(b => b.createdAt >= startOfThisMonth).length;
        const bookingsLastMonth = bookings.filter(b =>
            isWithinInterval(b.createdAt, { start: startOfLastMonth, end: endOfLastMonth })).length;

        const revenueThisMonth = bookings
            .filter(b => b.createdAt >= startOfThisMonth && (b.status === 'Approved' || b.paymentStatus === 'Paid'))
            .reduce((sum, b) => sum + (Number(b.totalPrice || b.amount) || 0), 0);

        const revenueLastMonth = bookings
            .filter(b => isWithinInterval(b.createdAt, { start: startOfLastMonth, end: endOfLastMonth }) && (b.status === 'Approved' || b.paymentStatus === 'Paid'))
            .reduce((sum, b) => sum + (Number(b.totalPrice || b.amount) || 0), 0);

        const calcTrend = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        // 3. Chart Data (Last 6 Months)
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = subMonths(now, i);
            const start = startOfMonth(d);
            const end = endOfMonth(d);
            const monthLabel = format(d, 'MMM');

            const monthBookings = bookings.filter(b => isWithinInterval(b.createdAt, { start, end }));
            const monthRevenue = monthBookings
                .filter(b => b.status === 'Approved' || b.paymentStatus === 'Paid')
                .reduce((sum, b) => sum + (Number(b.totalPrice || b.amount) || 0), 0);

            return {
                month: monthLabel,
                bookings: monthBookings.length,
                revenue: monthRevenue,
                sortKey: i
            };
        }).reverse();

        return {
            totalCustomers: customers.length,
            totalHoardings: hoardings.length,
            activeBookings: activeBookings,
            totalRevenue: currentRevenue,
            revenueTrend: calcTrend(revenueThisMonth, revenueLastMonth),
            bookingsTrend: calcTrend(bookingsThisMonth, bookingsLastMonth),
            chartData: last6Months,
            recentActivity: [...bookings]
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 5)
        };
    }, [bookings, customers, hoardings, dateFilter, statusFilter, categoryFilter]);

    if (loading && bookings.length === 0) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col h-[80vh] items-center justify-center text-center p-6">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full mb-4">
                    <AlertCircle className="w-12 h-12 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-sm mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Performance Overview</h1>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">Real-time business analytics and hoarding performance.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                    Live Sync
                </div>
            </div>

            {/* Filters */}
            <DashboardFilters
                dateFilter={dateFilter} setDateFilter={setDateFilter}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
                categories={categories}
            />

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Customers"
                    value={analytics.totalCustomers.toLocaleString()}
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Active Bookings"
                    value={analytics.activeBookings}
                    trend={analytics.bookingsTrend >= 0 ? 'up' : 'down'}
                    trendValue={Math.abs(analytics.bookingsTrend)}
                    icon={Calendar}
                    color="green"
                />
                <StatCard
                    title="Monthly Revenue"
                    value={`₹${analytics.totalRevenue.toLocaleString()}`}
                    trend={analytics.revenueTrend >= 0 ? 'up' : 'down'}
                    trendValue={Math.abs(analytics.revenueTrend)}
                    icon={IndianRupee}
                    color="yellow"
                />
                <StatCard
                    title="Live Locations"
                    value={analytics.totalHoardings}
                    icon={MapIcon}
                    color="purple"
                />
            </div>

            {/* Charts Section */}
            <DashboardCharts
                revenueData={analytics.chartData}
                bookingsData={analytics.chartData}
            />

            {/* Recent Activity Table */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Bookings</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Monitor the latest hoarding reservations</p>
                    </div>
                    <button
                        onClick={() => navigate('/bookings')}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group transition-colors"
                    >
                        View All
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-700/50 text-[10px] uppercase tracking-widest font-bold text-gray-600 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-4">Booking ID</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4 text-center">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {analytics.recentActivity.length > 0 ? (
                                analytics.recentActivity.map((activity) => (
                                    <tr
                                        key={activity.id}
                                        className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                                        onClick={() => navigate('/bookings')}
                                    >
                                        <td className="px-6 py-4 text-xs font-mono text-gray-500 dark:text-gray-400">#{activity.id.slice(-8).toUpperCase()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                    {activity.userName?.charAt(0) || 'U'}
                                                </div>
                                                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{activity.userName || 'Unknown'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">₹{(activity.totalPrice || activity.amount || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${activity.status === 'Approved' ? 'bg-green-50 text-green-600' :
                                                activity.status === 'Pending' ? 'bg-yellow-50 text-yellow-600' :
                                                    'bg-red-50 text-red-600'
                                                }`}>
                                                {activity.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs text-gray-600 dark:text-gray-400">{format(activity.createdAt, 'MMM d, h:mm a')}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        No recent activity found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Home;
