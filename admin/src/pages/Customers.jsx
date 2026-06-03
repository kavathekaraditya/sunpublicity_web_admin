import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, collectionGroup, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Users,
    Search,
    Eye,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Phone,
    Mail,
    ShoppingBag,
    X,
    FileText,
    ExternalLink,
    Trash2
} from 'lucide-react';
import { format } from 'date-fns';

const Customers = () => {
    const navigate = useNavigate();
    const { userRole } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookingHistory, setBookingHistory] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);

    const itemsPerPage = 10;

    const canDelete = userRole === 'admin' || userRole === 'user';

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            setError(null);

            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);

            const bookingsRef = collection(db, 'bookings');
            const bookingsSnapshot = await getDocs(bookingsRef);

            const userBookingsMap = {};
            bookingsSnapshot.docs.forEach(doc => {
                const booking = doc.data();
                const userId = booking.userId;

                if (!userBookingsMap[userId]) {
                    userBookingsMap[userId] = {
                        totalBookings: 0,
                        totalSpend: 0
                    };
                }

                userBookingsMap[userId].totalBookings += 1;
                userBookingsMap[userId].totalSpend += (booking.totalPrice || booking.amount || 0);
            });

            const customersData = usersSnapshot.docs
                .map(doc => {
                    const userData = doc.data();
                    const userId = doc.id;
                    const bookingStats = userBookingsMap[userId] || { totalBookings: 0, totalSpend: 0 };

                    return {
                        id: userId,
                        name: userData.name || userData.displayName || 'N/A',
                        email: userData.email || 'N/A',
                        phone: userData.phone || userData.phoneNumber || 'N/A',
                        totalBookings: bookingStats.totalBookings,
                        totalSpend: bookingStats.totalSpend,
                        createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : null,
                        role: userData.role || 'customer'
                    };
                })
                .filter(user => user.role !== 'admin' && user.role !== 'user'); // Filter out dashboard users

            customersData.sort((a, b) => b.totalSpend - a.totalSpend);

            setCustomers(customersData);
        } catch (err) {
            console.error('Error fetching customers:', err);
            setError('Failed to load customers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCustomer = async (customer) => {
        if (!canDelete) {
            alert('You do not have permission to delete customers.');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the profile for ${customer.name}? This will only remove their profile record from Firestore.`)) {
            return;
        }

        try {
            setLoading(true);
            await deleteDoc(doc(db, 'users', customer.id));
            alert('Customer profile deleted successfully.');
            if (isModalOpen) closeModal();
            fetchCustomers();
        } catch (err) {
            console.error('Error deleting customer:', err);
            alert('Failed to delete customer profile.');
            setLoading(false);
        }
    };

    const fetchBookingHistory = async (userId) => {
        try {
            setLoadingBookings(true);
            const bookingsRef = collection(db, 'bookings');
            const q = query(bookingsRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);

            const bookings = await Promise.all(snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();
                const booking = {
                    id: docSnap.id,
                    ...data,
                    totalPrice: data.totalPrice || data.amount || 0,
                    startDate: data.startDate?.toDate ? data.startDate.toDate() : (data.startDate ? new Date(data.startDate) : null),
                    endDate: data.endDate?.toDate ? data.endDate.toDate() : (data.endDate ? new Date(data.endDate) : null),
                };

                if (!booking.hoardingTitle && booking.hoardingId) {
                    try {
                        const hoardingQuery = query(collectionGroup(db, 'hoardings'), where('__name__', '==', booking.hoardingId));
                        const hoardingDoc = await getDocs(hoardingQuery);
                        if (!hoardingDoc.empty) {
                            const hData = hoardingDoc.docs[0].data();
                            booking.hoardingTitle = hData.title;
                            booking.hoardingAddress = hData.location || hData.address;
                        }
                    } catch (e) {
                        console.error('Hoarding fetch error', e);
                    }
                }

                return booking;
            }));

            bookings.sort((a, b) => (b.startDate || 0) - (a.startDate || 0));
            setBookingHistory(bookings);
        } catch (err) {
            console.error('Error fetching booking history:', err);
        } finally {
            setLoadingBookings(false);
        }
    };

    const openCustomerModal = async (customer) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
        await fetchBookingHistory(customer.id);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedCustomer(null);
        setBookingHistory([]);
    };

    const filteredCustomers = customers.filter(customer => {
        const searchLower = searchTerm.toLowerCase();
        return (
            customer.name.toLowerCase().includes(searchLower) ||
            customer.email.toLowerCase().includes(searchLower) ||
            customer.phone.toLowerCase().includes(searchLower)
        );
    });

    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const StatusBadge = ({ status }) => {
        const styles = {
            Approved: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/40',
            Rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/40',
            Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/40',
        };
        const defaultStyle = 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || defaultStyle}`}>
                {status || 'Unknown'}
            </span>
        );
    };

    if (loading && customers.length === 0) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-red-500">
                <AlertCircle className="w-10 h-10 mb-2" />
                <p>{error}</p>
                <button onClick={fetchCustomers} className="mt-4 text-blue-600 hover:underline">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customer Relationship Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        View customer profiles, booking history, and lifetime value.
                    </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg font-medium">
                        <Users className="w-4 h-4 inline mr-2" />
                        {customers.length} Total Customers
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4 text-center">Total Bookings</th>
                                <th className="px-6 py-4 text-center">Lifetime Spend</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {currentCustomers.length > 0 ? (
                                currentCustomers.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                                        {customer.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ID: {customer.id.slice(0, 8)}...
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    <span className="text-xs">{customer.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    <span className="text-xs">{customer.phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-medium">
                                                <ShoppingBag className="w-3.5 h-3.5" />
                                                {customer.totalBookings}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-lg font-semibold">
                                                ₹{customer.totalSpend.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openCustomerModal(customer)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span className="hidden sm:inline">View</span>
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDeleteCustomer(customer)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Delete profile"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                        <p>No customers found matching your search.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of{' '}
                            {filteredCustomers.length} customers
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === page
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Customer Profile Modal - CRM View */}
            {isModalOpen && selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                    {selectedCustomer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {selectedCustomer.name}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Customer Profile</p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Customer Information */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                    Contact Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-900/40">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                                                <Mail className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-0.5">Email Address</p>
                                                <p className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {selectedCustomer.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 p-4 rounded-xl border border-green-200 dark:border-green-900/40">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                                                <Phone className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-0.5">Phone Number</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {selectedCustomer.phone}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Metrics */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                    Customer Lifetime Value
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 p-5 rounded-xl border-2 border-blue-200 dark:border-blue-900/40">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                                                <ShoppingBag className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Total Bookings</p>
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                                    {selectedCustomer.totalBookings}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 p-5 rounded-xl border-2 border-green-200 dark:border-green-900/40">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                                                <ShoppingBag className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Lifetime Spend</p>
                                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                                    ₹{selectedCustomer.totalSpend.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Booking History - Read Only */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Booking History (Read-Only)
                                    </h3>
                                    <button
                                        onClick={() => navigate('/bookings')}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Manage Bookings
                                    </button>
                                </div>

                                {loadingBookings ? (
                                    <div className="flex items-center justify-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    </div>
                                ) : bookingHistory.length > 0 ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                        {bookingHistory.map((booking) => (
                                            <div
                                                key={booking.id}
                                                className="bg-white dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                                                            {booking.hoardingTitle || 'Unknown Hoarding'}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {booking.hoardingAddress || 'No address available'}
                                                        </p>
                                                    </div>
                                                    <StatusBadge status={booking.status} />
                                                </div>
                                                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-gray-600">
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                                            Start Date
                                                        </p>
                                                        <p className="font-semibold text-gray-900 dark:text-white text-xs">
                                                            {booking.startDate
                                                                ? format(booking.startDate, 'MMM d, yyyy')
                                                                : 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                                            End Date
                                                        </p>
                                                        <p className="font-semibold text-gray-900 dark:text-white text-xs">
                                                            {booking.endDate
                                                                ? format(booking.endDate, 'MMM d, yyyy')
                                                                : 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                                                            Amount Paid
                                                        </p>
                                                        <p className="font-bold text-green-600 dark:text-green-400 text-sm">
                                                            ₹{booking.totalPrice.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                                        <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400 font-medium">No booking history found</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">This customer hasn't made any bookings yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                            {canDelete ? (
                                <button
                                    onClick={() => handleDeleteCustomer(selectedCustomer)}
                                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/40 shadow-sm"
                                >
                                    Delete Profile
                                </button>
                            ) : (
                                <div />
                            )}
                            <button
                                onClick={closeModal}
                                className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
