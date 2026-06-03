import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../component/Navbar";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { createUserDocument, getUserProfile, updateUserProfile } from "../utils/createUserDocument";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { firestore } from "../firebase";
import { useToast } from "../component/Toast";
import ProfileAvatar from "../component/ProfileAvatar";
import BookingDetailModal from "../component/BookingDetailModal";
import EmptyState from "../component/EmptyState";
import {
  ProfileSkeleton,
  BookingSkeleton,
  TableSkeleton,
  CardSkeleton,
  CouponSkeleton
} from "../component/SkeletonLoader";
import { formatDate, formatDateTime, isExpired, firestoreTimestampToDate } from "../utils/dateFormatter";
import {
  Calendar,
  Package,
  Ticket,
  IndianRupee,
  LogOut,
  Save,
  ChevronDown,
  Eye
} from "lucide-react";

export default function Account() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Profile state
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    profileImage: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingFilter, setBookingFilter] = useState("all");
  const [bookingsToShow, setBookingsToShow] = useState(10);

  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(true);

  // Form validation state
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated) navigate("/login", { replace: true, state: { from: "/account" } });
  }, [isAuthenticated, navigate]);

  // Initialize user profile
  useEffect(() => {
    const initializeUser = async () => {
      if (!user) return;

      try {
        await createUserDocument(user);
        const userProfile = await getUserProfile(user.uid);

        if (userProfile) {
          setProfile({
            name: userProfile.name || user.displayName || "",
            phone: userProfile.phone || userProfile.phoneNumber || "",
            address: userProfile.address || "",
            city: userProfile.city || "",
            profileImage: userProfile.photo || userProfile.profileImage || user.photoURL || "",
          });
        }
      } catch (error) {
        console.error("Error initializing user:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [user, toast]);

  // Fetch bookings with orderBy
  useEffect(() => {
    if (!user) {
      setBookings([]);
      setBookingsLoading(false);
      return;
    }

    try {
      const bookingsRef = collection(firestore, "bookings");
      const q = query(
        bookingsRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bookingsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setBookings(bookingsList);
        setBookingsLoading(false);
      }, (error) => {
        console.error("Error fetching bookings:", error);

        // If composite index is needed, fallback to client-side sorting
        if (error.code === 'failed-precondition') {
          toast.warning("Setting up database index. Please wait...");

          // Fallback query without orderBy
          const fallbackQuery = query(
            bookingsRef,
            where("userId", "==", user.uid)
          );

          const fallbackUnsubscribe = onSnapshot(fallbackQuery, (snapshot) => {
            const bookingsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            // Sort client-side
            bookingsList.sort((a, b) => {
              const dateA = firestoreTimestampToDate(a.createdAt) || new Date(0);
              const dateB = firestoreTimestampToDate(b.createdAt) || new Date(0);
              return dateB - dateA;
            });

            setBookings(bookingsList);
            setBookingsLoading(false);
          });

          return () => fallbackUnsubscribe();
        }

        setBookingsLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up bookings listener:", error);
      toast.error("Failed to load bookings");
      setBookingsLoading(false);
    }
  }, [user, toast]);

  // Fetch coupons from Firestore
  useEffect(() => {
    try {
      const couponsRef = collection(firestore, "coupons");
      const q = query(couponsRef, where("active", "==", true));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const couponsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filter out expired coupons
        const activeCoupons = couponsList.filter(coupon => {
          if (!coupon.expiresAt) return true;
          const expiryDate = firestoreTimestampToDate(coupon.expiresAt);
          return !isExpired(expiryDate);
        });

        setCoupons(activeCoupons);
        setCouponsLoading(false);
      }, (error) => {
        console.error("Error fetching coupons:", error);
        setCouponsLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up coupons listener:", error);
      setCouponsLoading(false);
    }
  }, []);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!profile.name?.trim()) {
      newErrors.name = "Name is required";
    }

    if (profile.phone && !/^[0-9]{10}$/.test(profile.phone.replace(/\s/g, ''))) {
      newErrors.phone = "Phone must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save profile
  const saveProfile = async () => {
    if (!user) return;

    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    try {
      setSaving(true);
      await updateUserProfile(user.uid, profile);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle profile image upload
  const handleImageUpload = async (imageUrl) => {
    try {
      await updateUserProfile(user.uid, { profileImage: imageUrl });
      setProfile(prev => ({ ...prev, profileImage: imageUrl }));
      toast.success("Profile picture updated!");
    } catch (error) {
      console.error("Error updating profile image:", error);
      toast.error("Failed to update profile picture");
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const status = booking.status?.toLowerCase();
    if (bookingFilter === "all") return true;
    if (bookingFilter === "pending") return !status || status === "pending";
    if (bookingFilter === "approved") return status === "confirmed" || status === "approved";
    if (bookingFilter === "rejected") return status === "rejected";
    return true;
  });

  // Pagination
  const displayedBookings = filteredBookings.slice(0, bookingsToShow);
  const hasMoreBookings = filteredBookings.length > bookingsToShow;

  // Calculate payment totals
  const paymentTotals = bookings.reduce((acc, booking) => {
    const status = booking.status?.toLowerCase();
    const amount = Number(booking.totalPrice || booking.amount || 0);

    if (status === "confirmed" || status === "approved") {
      acc.paid += amount;
    } else if (status === "pending" || !status) {
      acc.pending += amount;
    } else if (status === "rejected" || status === "cancelled") {
      acc.rejected += amount;
    }

    return acc;
  }, { paid: 0, pending: 0, rejected: 0 });

  const recentBookings = bookings.slice(0, 5);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 space-y-6">
              <ProfileSkeleton />
              <CardSkeleton />
            </section>
            <aside className="space-y-6">
              <CardSkeleton />
              <CardSkeleton />
            </aside>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
            <p className="text-gray-600">Manage your profile, bookings, and preferences</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <section className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-start gap-6 mb-6">
                  <ProfileAvatar
                    imageUrl={profile.profileImage}
                    userName={profile.name || user?.displayName}
                    onImageUpload={handleImageUpload}
                    editable={true}
                    size="xl"
                  />

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {profile.name || user?.displayName || "User"}
                    </h2>
                    <p className="text-gray-600">{user?.email}</p>
                    <div className="mt-3 inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                      Customer Account
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        className={`w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                        placeholder="Enter your name"
                        value={profile.name}
                        onChange={(e) => {
                          setProfile({ ...profile, name: e.target.value });
                          setErrors({ ...errors, name: null });
                        }}
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        className={`w-full border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                        placeholder="10-digit mobile number"
                        value={profile.phone}
                        maxLength={10}
                        onChange={(e) => {
                          // Only allow numeric input
                          const value = e.target.value.replace(/\D/g, '');
                          setProfile({ ...profile, phone: value });
                          setErrors({ ...errors, phone: null });
                        }}
                        onKeyPress={(e) => {
                          // Prevent non-numeric characters from being typed
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Your city"
                        value={profile.city}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        rows={3}
                        placeholder="Your complete address"
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => logout()}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Recent Bookings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
                </div>

                {bookingsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <BookingSkeleton key={i} />)}
                  </div>
                ) : recentBookings.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="No bookings yet"
                    description="Your booking history will appear here once you make your first booking."
                  />
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {recentBookings.map((b) => (
                      <li
                        key={b.id}
                        className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg transition-colors cursor-pointer"
                        onClick={() => setSelectedBooking(b)}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {b.hoardingTitle || b.item?.location || b.item?.name || "Hoarding"}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <span>
                              {formatDateTime(firestoreTimestampToDate(b.createdAt) || new Date(b.createdAt))}
                            </span>
                            <span>•</span>
                            <span>{b.durationMonths || "N/A"} {b.durationMonths === 1 ? 'month' : 'months'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              ₹{(b.totalPrice || b.amount || 0).toLocaleString()}
                            </div>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${(b.status?.toLowerCase() === 'confirmed' || b.status?.toLowerCase() === 'approved') ? 'bg-green-100 text-green-700' :
                              (!b.status || b.status?.toLowerCase() === 'pending') ? 'bg-yellow-100 text-yellow-700' :
                                b.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                              }`}>
                              {b.status || 'pending'}
                            </span>
                          </div>
                          <Eye className="w-4 h-4 text-gray-400" />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>

              {/* All Bookings with Filters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">All Bookings</h2>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    {[
                      { value: "all", label: "All" },
                      { value: "pending", label: "Pending" },
                      { value: "approved", label: "Approved" },
                      { value: "rejected", label: "Rejected" }
                    ].map(filter => (
                      <button
                        key={filter.value}
                        onClick={() => {
                          setBookingFilter(filter.value);
                          setBookingsToShow(10);
                        }}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${bookingFilter === filter.value
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                          }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {bookingsLoading ? (
                  <TableSkeleton rows={5} columns={7} />
                ) : filteredBookings.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title={`No ${bookingFilter === 'all' ? '' : bookingFilter} bookings`}
                    description={`You don't have any ${bookingFilter === 'all' ? '' : bookingFilter} bookings at the moment.`}
                  />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600 border-b">
                            <th className="py-3 pr-4 font-semibold">Date</th>
                            <th className="py-3 pr-4 font-semibold">Hoarding</th>
                            <th className="py-3 pr-4 font-semibold">Location</th>
                            <th className="py-3 pr-4 font-semibold">Start</th>
                            <th className="py-3 pr-4 font-semibold">End</th>
                            <th className="py-3 pr-4 font-semibold">Amount</th>
                            <th className="py-3 pr-4 font-semibold">Status</th>
                            <th className="py-3 pr-4 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedBookings.map((b) => (
                            <tr key={b.id} className="border-b hover:bg-gray-50 transition-colors">
                              <td className="py-3 pr-4 text-gray-700">
                                {formatDate(firestoreTimestampToDate(b.createdAt) || new Date(b.createdAt))}
                              </td>
                              <td className="py-3 pr-4 font-medium text-gray-900">
                                {b.hoardingTitle || b.item?.name || "N/A"}
                              </td>
                              <td className="py-3 pr-4 text-gray-700">
                                {b.hoardingAddress || b.item?.location || "N/A"}
                              </td>
                              <td className="py-3 pr-4 text-gray-700">
                                {formatDate(firestoreTimestampToDate(b.startDate) || (b.startDate ? new Date(b.startDate) : null))}
                              </td>
                              <td className="py-3 pr-4 text-gray-700">
                                {formatDate(firestoreTimestampToDate(b.endDate) || (b.endDate ? new Date(b.endDate) : null))}
                              </td>
                              <td className="py-3 pr-4 font-semibold text-gray-900">
                                ₹{(b.totalPrice || b.amount || 0).toLocaleString()}
                              </td>
                              <td className="py-3 pr-4">
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold capitalize ${(b.status?.toLowerCase() === 'confirmed' || b.status?.toLowerCase() === 'approved') ? 'bg-green-100 text-green-700' :
                                  (!b.status || b.status?.toLowerCase() === 'pending') ? 'bg-yellow-100 text-yellow-700' :
                                    b.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-700'
                                  }`}>
                                  {b.status || 'pending'}
                                </span>
                              </td>
                              <td className="py-3 pr-4">
                                <button
                                  onClick={() => setSelectedBooking(b)}
                                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Load More Button */}
                    {hasMoreBookings && (
                      <div className="mt-6 text-center">
                        <button
                          onClick={() => setBookingsToShow(prev => prev + 10)}
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                        >
                          Load More
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </section>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Payments Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white"
              >
                <div className="flex items-center gap-2 mb-4">
                  <IndianRupee className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Payments Summary</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm opacity-90 mb-1">Total Paid</div>
                    <div className="text-3xl font-bold">
                      ₹{paymentTotals.paid.toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                    <div>
                      <div className="text-xs opacity-80 mb-1">Pending</div>
                      <div className="text-lg font-semibold">
                        ₹{paymentTotals.pending.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs opacity-80 mb-1">Rejected</div>
                      <div className="text-lg font-semibold">
                        ₹{paymentTotals.rejected.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/20 text-xs opacity-80">
                  Payments are processed after booking confirmation
                </div>
              </motion.div>

              {/* Discount Coupons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Ticket className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Active Coupons</h2>
                </div>

                {couponsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <CouponSkeleton key={i} />)}
                  </div>
                ) : coupons.length === 0 ? (
                  <EmptyState
                    icon={Ticket}
                    title="No active coupons"
                    description="Check back later for special offers and discounts."
                  />
                ) : (
                  <div className="space-y-3">
                    {coupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="border-2 border-dashed border-blue-200 rounded-lg p-4 bg-blue-50/50 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-bold text-blue-700 text-lg">
                            {coupon.code}
                          </div>
                          <div className="text-sm font-semibold text-green-600">
                            {coupon.type === 'percentage' ? `${coupon.discount}% OFF` : `₹${coupon.discount} OFF`}
                          </div>
                        </div>

                        {coupon.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {coupon.description}
                          </p>
                        )}

                        {coupon.expiresAt && (
                          <p className="text-xs text-gray-500">
                            Expires: {formatDate(firestoreTimestampToDate(coupon.expiresAt))}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                  Apply coupons during checkout to get discounts
                </div>
              </motion.div>
            </aside>
          </div>
        </div>
      </main>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </>
  );
}
