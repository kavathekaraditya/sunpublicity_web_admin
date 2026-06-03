import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  limit,
  startAfter,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  MessageCircle,
  Mail,
  Phone,
  User2,
  Clock,
  Trash2,
  Search,
  Filter,
  Eye,
  EyeOff,
  CheckCheck,
  X
} from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';
import { format } from 'date-fns';

const MESSAGES_PER_PAGE = 10;

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'unread', 'read'
  const [filterDate, setFilterDate] = useState('all'); // 'all', 'week', 'month'

  // Modal states
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Confirm dialog states
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    messageId: null,
    messageName: null
  });

  // Pagination states
  const [displayLimit, setDisplayLimit] = useState(MESSAGES_PER_PAGE);
  const [hasMore, setHasMore] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    // Real-time listener for contact messages
    const q = query(
      collection(db, 'contactMessages'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Default to unread if field doesn't exist
          read: doc.data().read ?? false
        }));
        setMessages(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching contact messages:', error);
        showToast('Failed to fetch contact messages', 'error');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [showToast]);

  // Filter and search logic
  const filteredMessages = useMemo(() => {
    let filtered = [...messages];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(msg =>
        msg.name?.toLowerCase().includes(search) ||
        msg.email?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (filterStatus === 'unread') {
      filtered = filtered.filter(msg => !msg.read);
    } else if (filterStatus === 'read') {
      filtered = filtered.filter(msg => msg.read);
    }

    // Date filter
    if (filterDate !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      if (filterDate === 'week') {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (filterDate === 'month') {
        cutoffDate.setDate(now.getDate() - 30);
      }

      filtered = filtered.filter(msg => {
        const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
        return msgDate >= cutoffDate;
      });
    }

    return filtered;
  }, [messages, searchTerm, filterStatus, filterDate]);

  // Paginated messages
  const displayedMessages = filteredMessages.slice(0, displayLimit);

  // Update hasMore when filtered messages change
  useEffect(() => {
    setHasMore(displayLimit < filteredMessages.length);
  }, [displayLimit, filteredMessages.length]);

  // Statistics
  const stats = useMemo(() => {
    const total = messages.length;
    const unread = messages.filter(msg => !msg.read).length;
    const today = messages.filter(msg => {
      const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return msgDate >= todayStart;
    }).length;

    return { total, unread, today };
  }, [messages]);

  const handleDelete = async (messageId, senderName) => {
    setConfirmDialog({
      isOpen: true,
      messageId,
      messageName: senderName
    });
  };

  const confirmDelete = async () => {
    const { messageId, messageName } = confirmDialog;
    setConfirmDialog({ isOpen: false, messageId: null, messageName: null });

    setDeletingId(messageId);
    try {
      await deleteDoc(doc(db, 'contactMessages', messageId));
      showToast('Message deleted successfully', 'success');

      // Close modal if the deleted message was open
      if (selectedMessage?.id === messageId) {
        setIsModalOpen(false);
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      showToast('Failed to delete message. Please try again.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDialog({ isOpen: false, messageId: null, messageName: null });
  };

  const toggleReadStatus = async (messageId, currentStatus) => {
    setUpdatingId(messageId);
    try {
      await updateDoc(doc(db, 'contactMessages', messageId), {
        read: !currentStatus
      });
      showToast(`Marked as ${!currentStatus ? 'read' : 'unread'}`, 'success');
    } catch (error) {
      console.error('Error updating message status:', error);
      showToast('Failed to update message status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllAsRead = async () => {
    const unreadMessages = messages.filter(msg => !msg.read);

    if (unreadMessages.length === 0) {
      showToast('No unread messages', 'info');
      return;
    }

    try {
      await Promise.all(
        unreadMessages.map(msg =>
          updateDoc(doc(db, 'contactMessages', msg.id), { read: true })
        )
      );
      showToast(`Marked ${unreadMessages.length} messages as read`, 'success');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showToast('Failed to mark all as read', 'error');
    }
  };

  const openMessageModal = (message) => {
    setSelectedMessage(message);
    setIsModalOpen(true);

    // Mark as read when opening
    if (!message.read) {
      toggleReadStatus(message.id, false);
    }
  };

  const loadMore = () => {
    setDisplayLimit(prev => prev + MESSAGES_PER_PAGE);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterDate('all');
  };

  const hasActiveFilters = searchTerm || filterStatus !== 'all' || filterDate !== 'all';

  const formatTimestamp = (value) => {
    if (!value) return 'N/A';

    try {
      const date = value?.toDate ? value.toDate() : new Date(value);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      return 'N/A';
    }
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <MessageCircle className="w-8 h-8 mr-3 text-primary-600" />
          Contact Messages
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and manage messages submitted from the website contact section
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Messages</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.total}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Unread Messages</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stats.unread}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Today</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {stats.today}
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="all">All Messages</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          {/* Mark All as Read */}
          <button
            onClick={markAllAsRead}
            disabled={stats.unread === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <CheckCheck className="w-5 h-5" />
            Mark All Read
          </button>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
            {searchTerm && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                Search: {searchTerm}
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                {filterStatus === 'unread' ? 'Unread' : 'Read'}
              </span>
            )}
            {filterDate !== 'all' && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm">
                {filterDate === 'week' ? 'Last 7 days' : 'Last 30 days'}
              </span>
            )}
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear all
            </button>
          </div>
        )}
      </Card>

      {/* Messages Grid */}
      {filteredMessages.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {hasActiveFilters ? 'No messages match your filters.' : 'No contact messages found.'}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedMessages.map((msg) => (
              <Card
                key={msg.id}
                className={`p-4 flex flex-col space-y-3 relative cursor-pointer transition-all hover:shadow-lg ${!msg.read
                  ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-800'
                  : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
                  }`}
                onClick={() => openMessageModal(msg)}
              >
                {/* Unread Indicator */}
                {!msg.read && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" title="Unread" />
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center text-gray-900 dark:text-white font-semibold">
                      <User2 className="w-4 h-4 mr-2 text-primary-600" />
                      <span>{msg.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3 mr-1.5" />
                      <span>{formatTimestamp(msg.createdAt)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleReadStatus(msg.id, msg.read)}
                      disabled={updatingId === msg.id}
                      className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={msg.read ? 'Mark as unread' : 'Mark as read'}
                    >
                      {updatingId === msg.id ? (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : msg.read ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(msg.id, msg.name)}
                      disabled={deletingId === msg.id}
                      className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete message"
                    >
                      {deletingId === msg.id ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-700 dark:text-gray-300 border-y border-gray-200 dark:border-gray-700 py-2 space-y-1">
                  {msg.email && (
                    <div className="flex items-center break-all">
                      <Mail className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{msg.email}</span>
                    </div>
                  )}
                  {msg.phone && (
                    <div className="flex items-center break-all">
                      <Phone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span>{msg.phone}</span>
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-800 dark:text-gray-200">
                  <p className="line-clamp-3">
                    {msg.message || 'No message provided.'}
                  </p>
                  {(msg.message && msg.message.length > 120) && (
                    <button
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-xs mt-2 font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMessageModal(msg);
                      }}
                    >
                      Read more →
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Load More / Pagination Info */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {displayedMessages.length} of {filteredMessages.length} messages
            </p>
            {hasMore && (
              <button
                onClick={loadMore}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                Load More
              </button>
            )}
          </div>
        </>
      )}

      {/* Message Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Message Details"
        size="lg"
        footer={
          selectedMessage && (
            <>
              <button
                onClick={() => {
                  toggleReadStatus(selectedMessage.id, selectedMessage.read);
                }}
                disabled={updatingId === selectedMessage.id}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {selectedMessage.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Mark as {selectedMessage.read ? 'Unread' : 'Read'}
              </button>
              <button
                onClick={() => handleDelete(selectedMessage.id, selectedMessage.name)}
                disabled={deletingId === selectedMessage.id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )
        }
      >
        {selectedMessage && (
          <div className="space-y-6">
            {/* Sender Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <User2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedMessage.name || 'Unknown'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTimestamp(selectedMessage.createdAt)}
                  </p>
                </div>
                {!selectedMessage.read && (
                  <span className="ml-auto px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                    Unread
                  </span>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              {selectedMessage.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {selectedMessage.email}
                  </a>
                </div>
              )}
              {selectedMessage.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a
                    href={`tel:${selectedMessage.phone}`}
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {selectedMessage.phone}
                  </a>
                </div>
              )}
            </div>

            {/* Message Content */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Message
              </h4>
              <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {selectedMessage.message || 'No message provided.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="Delete Message"
        message={`Are you sure you want to delete the message from ${confirmDialog.messageName || 'Unknown'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default ContactMessages;
