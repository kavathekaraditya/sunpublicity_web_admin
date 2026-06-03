import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, IndianRupee, Clock, User, Phone, Mail } from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/dateFormatter';

const BookingDetailModal = ({ booking, isOpen, onClose }) => {
    if (!isOpen || !booking) return null;

    const statusConfig = {
        confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmed' },
        approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
        cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
        rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
    };

    const statusKey = booking.status?.toLowerCase() || 'pending';
    const statusStyle = statusConfig[statusKey] || statusConfig.pending;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Status Badge */}
                        <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                                {statusStyle.label}
                            </span>
                            <span className="text-sm text-gray-500">
                                ID: {booking.id?.substring(0, 8)}...
                            </span>
                        </div>

                        {/* Hoarding Information */}
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 space-y-3">
                            <h3 className="font-semibold text-gray-900 text-lg">
                                {booking.hoardingTitle || booking.item?.name || 'Hoarding'}
                            </h3>

                            <div className="flex items-start gap-2 text-gray-700">
                                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
                                <span className="text-sm">
                                    {booking.hoardingAddress || booking.item?.location || 'N/A'}
                                </span>
                            </div>

                            {booking.hoardingCategory && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/70 rounded-full text-sm">
                                    <span className="font-medium text-gray-700">Category:</span>
                                    <span className="text-gray-600">{booking.hoardingCategory}</span>
                                </div>
                            )}
                        </div>

                        {/* Booking Period */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase">Start Date</span>
                                </div>
                                <p className="text-lg font-semibold text-gray-900">
                                    {booking.startDate?.toDate
                                        ? formatDate(booking.startDate.toDate())
                                        : booking.startDate
                                            ? formatDate(new Date(booking.startDate))
                                            : 'N/A'}
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase">End Date</span>
                                </div>
                                <p className="text-lg font-semibold text-gray-900">
                                    {booking.endDate?.toDate
                                        ? formatDate(booking.endDate.toDate())
                                        : booking.endDate
                                            ? formatDate(new Date(booking.endDate))
                                            : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Duration & Pricing */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <Clock className="w-5 h-5 text-purple-600" />
                                <div>
                                    <p className="text-xs text-gray-600">Duration</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {booking.durationMonths || 'N/A'} {booking.durationMonths === 1 ? 'month' : 'months'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                                <IndianRupee className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="text-xs text-gray-600">Total Amount</p>
                                    <p className="text-2xl font-bold text-green-700">
                                        ₹{(booking.totalPrice || booking.amount || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="border-t border-gray-200 pt-6 space-y-3">
                            <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>

                            <div className="grid md:grid-cols-2 gap-4">
                                {booking.customerName && (
                                    <div className="flex items-center gap-3">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Name</p>
                                            <p className="text-sm font-medium text-gray-900">{booking.customerName}</p>
                                        </div>
                                    </div>
                                )}

                                {booking.customerEmail && (
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="text-sm font-medium text-gray-900">{booking.customerEmail}</p>
                                        </div>
                                    </div>
                                )}

                                {booking.customerPhone && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Phone</p>
                                            <p className="text-sm font-medium text-gray-900">{booking.customerPhone}</p>
                                        </div>
                                    </div>
                                )}

                                {booking.customerAddress && (
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Address</p>
                                            <p className="text-sm font-medium text-gray-900">{booking.customerAddress}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Booking Date */}
                        <div className="border-t border-gray-200 pt-4">
                            <p className="text-xs text-gray-500">
                                Booked on {booking.createdAt?.toDate
                                    ? formatDateTime(booking.createdAt.toDate())
                                    : booking.createdAt
                                        ? formatDateTime(new Date(booking.createdAt))
                                        : 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BookingDetailModal;
