import React, { useState, useEffect, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Modal from 'react-modal';
import { collection, onSnapshot, collectionGroup, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import {
    Calendar as CalendarIcon,
    Download,
    Filter,
    Search,
    X,
    FileSpreadsheet,
    FileText,
    FileJson,
    ChevronDown,
    MapPin,
    Phone,
    User,
    DollarSign,
    Clock
} from 'lucide-react';

// Set modal root for accessibility
Modal.setAppElement('#root');

/**
 * BookingCalendar Component
 * 
 * Features:
 * - Monthly & Weekly Calendar Views (FullCalendar)
 * - Real-time Firestore updates
 * - Status Indicators (Available, Partial, Fully Booked)
 * - Detailed Booking Modal
 * - Advanced Filtering & Export
 */
const BookingCalendar = () => {
    // ==========================================
    // State Management
    // ==========================================
    const [bookings, setBookings] = useState([]);
    const [hoardings, setHoardings] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        hoardingName: '',
        location: '',
        status: '',
        clientName: ''
    });

    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDateBookings, setSelectedDateBookings] = useState([]);

    const calendarRef = useRef(null);

    // ==========================================
    // Data Fetching (Real-time)
    // ==========================================
    useEffect(() => {
        // Subscribe to Bookings
        const unsubscribeBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
            setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => console.error("Error fetching bookings:", error));

        // Subscribe to Hoardings using collectionGroup
        const hoardingsQuery = query(collectionGroup(db, 'hoardings'));
        const unsubscribeHoardings = onSnapshot(hoardingsQuery, (snapshot) => {
            const hoardingsData = snapshot.docs.map(doc => {
                // Extract categoryName from document path
                const pathParts = doc.ref.path.split('/');
                const categoryName = pathParts[1];

                return {
                    id: doc.id,
                    categoryName,
                    ...doc.data()
                };
            });
            setHoardings(hoardingsData);
        }, (error) => console.error("Error fetching hoardings:", error));

        // Subscribe to Users
        const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => console.error("Error fetching users:", error));

        return () => {
            unsubscribeBookings();
            unsubscribeHoardings();
            unsubscribeUsers();
        };
    }, []);

    // ==========================================
    // Data Processing & Enrichment
    // ==========================================
    const enrichedBookings = useMemo(() => {
        return bookings.map(booking => {
            const hoarding = hoardings.find(h => h.id === booking.hoardingId) || {};
            const user = users.find(u => u.id === booking.userId) || {};

            // Date Normalization
            let start = booking.startDate ? new Date(booking.startDate) : (booking.createdAt ? new Date(booking.createdAt.toDate()) : new Date());
            let end = booking.endDate ? new Date(booking.endDate) : (booking.startDate ? new Date(booking.startDate) : start);

            if (!(start instanceof Date) || isNaN(start)) start = new Date();
            if (!(end instanceof Date) || isNaN(end)) end = new Date();

            return {
                ...booking,
                clientName: user.name || booking.userName || 'Unknown Client',
                clientPhone: user.phone || booking.phone || 'N/A',
                hoardingName: hoarding.title || booking.hoardingTitle || 'Unknown Hoarding',
                location: hoarding.location || booking.hoardingLocation || 'Unknown Location',
                price: hoarding.price || booking.amount || 0,
                start,
                end,
                status: booking.status || 'Pending'
            };
        });
    }, [bookings, hoardings, users]);

    // ==========================================
    // Filtering Logic
    // ==========================================
    const filteredBookings = useMemo(() => {
        return enrichedBookings.filter(b => {
            const matchClient = !filters.clientName || b.clientName.toLowerCase().includes(filters.clientName.toLowerCase());
            const matchHoarding = !filters.hoardingName || b.hoardingName === filters.hoardingName;
            const matchLocation = !filters.location || b.location === filters.location;
            const matchStatus = !filters.status || b.status === filters.status;
            return matchClient && matchHoarding && matchLocation && matchStatus;
        });
    }, [enrichedBookings, filters]);

    // ==========================================
    // Calendar Helpers
    // ==========================================
    const getBookingsForDate = (date) => {
        return filteredBookings.filter(b => {
            const start = new Date(b.start);
            const end = new Date(b.end);
            const check = new Date(date);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            check.setHours(0, 0, 0, 0);
            return check >= start && check <= end;
        });
    };

    const getDateStatus = (date) => {
        const dayBookings = getBookingsForDate(date);
        const totalHoardings = hoardings.length || 1;
        const bookedCount = dayBookings.length;
        const available = Math.max(0, totalHoardings - bookedCount);

        if (available === 0) return { color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500', label: 'Fully Booked', available };
        if (available < 3) return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500', label: 'Partial', available };
        return { color: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500', label: 'Available', available };
    };

    // ==========================================
    // Renderers
    // ==========================================
    const renderDayCell = (arg) => {
        const date = arg.date;
        const status = getDateStatus(date);
        const dayBookings = getBookingsForDate(date);

        return (
            <div className="h-full flex flex-col justify-between p-1 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="text-right font-medium text-gray-700">{arg.dayNumberText}</div>
                <div className="flex flex-col gap-1 text-xs">
                    <div className={`px-1.5 py-0.5 rounded border ${status.color} flex items-center justify-between`}>
                        <span className="font-semibold">{status.available} Free</span>
                        <div className={`w-2 h-2 rounded-full ${status.dot}`}></div>
                    </div>
                    {dayBookings.length > 0 && (
                        <div className="text-gray-500 pl-1 font-medium">
                            {dayBookings.length} Bookings
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const handleDateClick = (arg) => {
        const date = arg.date;
        const dayBookings = getBookingsForDate(date);
        setSelectedDate(date);
        setSelectedDateBookings(dayBookings);
        setModalIsOpen(true);
    };

    // ==========================================
    // Export Logic
    // ==========================================
    const getExportData = (dataToExport) => {
        return dataToExport.map(b => ({
            'Client Name': b.clientName,
            'Hoarding Name': b.hoardingName,
            'Location': b.location,
            'Price': b.price,
            'Start Date': b.start.toLocaleDateString(),
            'End Date': b.end.toLocaleDateString(),
            'Status': b.status
        }));
    };

    const exportExcel = () => {
        const data = getExportData(filteredBookings);
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bookings");
        XLSX.writeFile(wb, `bookings_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportCSV = () => {
        const data = getExportData(filteredBookings);
        const headers = Object.keys(data[0] || {}).join(',');
        const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(','));
        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `bookings_report_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("SunPublicity", 14, 22);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const data = getExportData(filteredBookings);
        const tableColumn = ["Client", "Hoarding", "Location", "Price", "Start", "End", "Status"];
        const tableRows = data.map(b => [
            b['Client Name'],
            b['Hoarding Name'],
            b['Location'],
            b['Price'],
            b['Start Date'],
            b['End Date'],
            b['Status']
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 133, 244] }
        });

        doc.save(`bookings_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (loading) {
        return <div className="p-12 text-center text-gray-500">Loading Calendar Data...</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-primary-600" />
                        Booking Calendar
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Overview of all hoarding bookings and availability.
                    </p>
                </div>

                {/* Export Dropdown */}
                <div className="relative group z-10">
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
                        <Download className="w-4 h-4" />
                        Export Report
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 hidden group-hover:block">
                        <button onClick={exportExcel} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg">
                            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel (.xlsx)
                        </button>
                        <button onClick={exportPDF} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <FileText className="w-4 h-4 text-red-600" /> PDF (.pdf)
                        </button>
                        <button onClick={exportCSV} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 last:rounded-b-lg">
                            <FileJson className="w-4 h-4 text-blue-600" /> CSV (.csv)
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search Client..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                        value={filters.clientName}
                        onChange={(e) => setFilters({ ...filters, clientName: e.target.value })}
                    />
                </div>

                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                        value={filters.hoardingName}
                        onChange={(e) => setFilters({ ...filters, hoardingName: e.target.value })}
                    >
                        <option value="">All Hoardings</option>
                        {[...new Set(enrichedBookings.map(b => b.hoardingName))].map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>

                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                        value={filters.location}
                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    >
                        <option value="">All Locations</option>
                        {[...new Set(enrichedBookings.map(b => b.location))].map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                </div>

                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">All Statuses</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Status Legend */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    <span className="text-green-700 dark:text-green-300 font-medium">Available (≥3 slots)</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                    <span className="text-yellow-700 dark:text-yellow-300 font-medium">Partial (&lt;3 slots)</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span className="text-red-700 dark:text-red-300 font-medium">Fully Booked</span>
                </div>
            </div>

            {/* Calendar Component */}
            <div className="calendar-wrapper bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <style>{`
          .fc-daygrid-day-frame { min-height: 120px; }
          .fc-col-header-cell { padding: 12px 0; background-color: #f9fafb; }
          .fc-button-primary { background-color: #2563eb !important; border-color: #2563eb !important; }
          .fc-button-active { background-color: #1d4ed8 !important; }
          .fc-theme-standard td, .fc-theme-standard th { border-color: #e5e7eb; }
          .fc .fc-daygrid-day-top { flex-direction: row; }
        `}</style>
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek'
                    }}
                    events={filteredBookings.map(b => ({
                        title: b.clientName,
                        start: b.start,
                        end: b.end,
                        backgroundColor: (b.status === 'Confirmed' || b.status === 'Approved') ? '#10B981' : b.status === 'Pending' ? '#F59E0B' : '#EF4444',
                        borderColor: 'transparent',
                        extendedProps: { ...b }
                    }))}
                    dayCellContent={renderDayCell}
                    dateClick={handleDateClick}
                    height="auto"
                    dayMaxEvents={2}
                />
            </div>

            {/* Booking Details Modal */}
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => setModalIsOpen(false)}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-0 w-full max-w-2xl outline-none max-h-[90vh] overflow-y-auto"
                overlayClassName="fixed inset-0 bg-black bg-opacity-60 z-50 backdrop-blur-sm"
            >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-primary-600" />
                            {selectedDate?.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{selectedDateBookings.length} bookings found on this date</p>
                    </div>
                    <button onClick={() => setModalIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4 bg-gray-50/50 dark:bg-gray-900/30 min-h-[300px]">
                    {selectedDateBookings.length > 0 ? (
                        selectedDateBookings.map((booking, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">{booking.clientName}</h4>
                                            <p className="text-sm text-gray-500">{booking.clientPhone}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${(booking.status === 'Confirmed' || booking.status === 'Approved') ? 'bg-green-100 text-green-700' :
                                        booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {booking.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">Hoarding:</span>
                                        <span>{booking.hoardingName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">Location:</span>
                                        <span>{booking.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <DollarSign className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">Price:</span>
                                        <span>₹{booking.price?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">Time:</span>
                                        <span>{booking.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {booking.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                            <CalendarIcon className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">No bookings scheduled for this date.</p>
                            <p className="text-sm">Select another date to view details.</p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <button
                        onClick={() => {
                            const data = getExportData(selectedDateBookings);
                            const ws = XLSX.utils.json_to_sheet(data);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Daily Bookings");
                            XLSX.writeFile(wb, `bookings_${selectedDate?.toISOString().split('T')[0]}.xlsx`);
                        }}
                        className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium transition-colors flex items-center justify-center gap-2"
                        disabled={selectedDateBookings.length === 0}
                    >
                        <Download className="w-5 h-5" />
                        Export Daily Report
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default BookingCalendar;
