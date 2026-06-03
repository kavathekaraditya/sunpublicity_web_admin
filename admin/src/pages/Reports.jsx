import { useState, useEffect } from 'react';
import { collection, getDocs, collectionGroup } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FileText, Download, TrendingUp, BarChart3 } from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    monthlyRevenue: [],
    locationPerformance: [],
    bookingTrends: [],
    statusDistribution: [],
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch all data using collectionGroup for hoardings
      const [hoardingsSnap, bookingsSnap] = await Promise.all([
        getDocs(collectionGroup(db, 'hoardings')),
        getDocs(collection(db, 'bookings'))
      ]);

      const hoardings = hoardingsSnap.docs.map(doc => {
        // Extract categoryName from document path
        const pathParts = doc.ref.path.split('/');
        const categoryName = pathParts[1];

        return {
          id: doc.id,
          categoryName,
          ...doc.data()
        };
      });
      const bookings = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Monthly Revenue Calculation
      const monthlyRevenueMap = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      bookings.forEach(booking => {
        if (booking.paymentStatus === 'Paid' && booking.createdAt) {
          const date = booking.createdAt.toDate ? booking.createdAt.toDate() : new Date(booking.createdAt);
          const monthIndex = date.getMonth();
          const monthName = months[monthIndex];

          if (!monthlyRevenueMap[monthName]) {
            monthlyRevenueMap[monthName] = { month: monthName, revenue: 0, bookings: 0, index: monthIndex };
          }
          monthlyRevenueMap[monthName].revenue += booking.amount || 0;
          monthlyRevenueMap[monthName].bookings += 1;
        }
      });

      // Fill in missing months for the current year or just show available data
      // For now, let's sort by month index
      const monthlyRevenue = Object.values(monthlyRevenueMap).sort((a, b) => a.index - b.index);

      // If empty, show some empty months
      if (monthlyRevenue.length === 0) {
        const currentMonth = new Date().getMonth();
        for (let i = Math.max(0, currentMonth - 5); i <= currentMonth; i++) {
          monthlyRevenue.push({ month: months[i], revenue: 0, bookings: 0 });
        }
      }

      // Location Performance
      const locationMap = {};
      hoardings.forEach(hoarding => {
        const location = hoarding.location || 'Unknown';
        if (!locationMap[location]) {
          locationMap[location] = { location, hoardings: 0, revenue: 0 };
        }
        locationMap[location].hoardings++;
      });

      bookings.forEach(booking => {
        const hoarding = hoardings.find(h => h.id === booking.hoardingId);
        if (hoarding && booking.paymentStatus === 'Paid') {
          const location = hoarding.location || 'Unknown';
          if (locationMap[location]) {
            locationMap[location].revenue += booking.amount || 0;
          }
        }
      });

      const locationPerformance = Object.values(locationMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Booking Trends (Last 4 Weeks)
      const bookingTrends = [];
      const now = new Date();
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7) - 6);
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - (i * 7));

        const count = bookings.filter(b => {
          if (!b.createdAt) return false;
          const date = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return date >= weekStart && date <= weekEnd;
        }).length;

        bookingTrends.push({ week: `Week ${4 - i}`, bookings: count });
      }

      // Status Distribution
      const statusCounts = {
        Pending: bookings.filter(b => b.status === 'Pending').length,
        Approved: bookings.filter(b => b.status === 'Approved').length,
        Rejected: bookings.filter(b => b.status === 'Rejected').length,
      };

      const statusDistribution = [
        { name: 'Pending', value: statusCounts.Pending, color: '#fbbf24' },
        { name: 'Approved', value: statusCounts.Approved, color: '#10b981' },
        { name: 'Rejected', value: statusCounts.Rejected, color: '#ef4444' },
      ];

      setReportData({
        monthlyRevenue,
        locationPerformance,
        bookingTrends,
        statusDistribution,
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <FileText className="w-8 h-8 mr-3 text-primary-600" />
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View detailed insights and export data
          </p>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => exportToCSV(reportData.monthlyRevenue, 'monthly-revenue')}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Revenue Data</span>
        </button>
        <button
          onClick={() => exportToCSV(reportData.locationPerformance, 'location-performance')}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Location Data</span>
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
              Monthly Revenue Trend
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue (₹)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Location Performance Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
              Location Performance
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.locationPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="location" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Bar dataKey="hoardings" fill="#3b82f6" name="Hoardings" />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Booking Trends Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Weekly Booking Trends
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.bookingTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="week" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Bar dataKey="bookings" fill="#8b5cf6" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Distribution Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Booking Status Distribution
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {reportData.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Table */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Revenue Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Month</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Bookings</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {reportData.monthlyRevenue.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 text-sm text-gray-900 dark:text-gray-100">{item.month}</td>
                    <td className="py-2 text-sm text-right text-gray-600 dark:text-gray-400">{item.bookings}</td>
                    <td className="py-2 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                      ₹{item.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Location Performance Table */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Performing Locations
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Location</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Hoardings</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {reportData.locationPerformance.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 text-sm text-gray-900 dark:text-gray-100">{item.location}</td>
                    <td className="py-2 text-sm text-right text-gray-600 dark:text-gray-400">{item.hoardings}</td>
                    <td className="py-2 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                      ₹{item.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
