# 🔥 Firestore Data Fetching - Complete Setup

## ✅ What Was Created

I've set up a comprehensive system to fetch all data from your Firestore database. Here's what was added:

### 📁 New Files Created

1. **`src/services/firestoreService.js`** (500+ lines)
   - Complete Firestore data fetching service
   - Functions for all collections (users, bookings, categories, hoardings, contactMessages)
   - Both one-time fetch and real-time subscription support
   - Filtering and statistics functions

2. **`src/hooks/useFirestore.js`** (400+ lines)
   - Custom React hooks for easy data fetching
   - Automatic loading and error state management
   - Support for real-time updates
   - Hooks for each collection and dashboard stats

3. **`src/pages/FirestoreDataViewer.jsx`** (400+ lines)
   - Beautiful UI to view all Firestore data
   - Tabbed interface for each collection
   - Real-time toggle
   - JSON/Table view toggle
   - Export to JSON functionality
   - Dashboard statistics view

4. **`src/utils/fetchFirestoreData.js`** (200+ lines)
   - Console utility script
   - Fetch data from browser console
   - Search and filter functions
   - Download as JSON

5. **`FIRESTORE_DATA_GUIDE.md`**
   - Complete documentation
   - Usage examples
   - Troubleshooting guide

### 🔧 Modified Files

- **`src/App.jsx`** - Added route for Data Viewer page at `/admin/data-viewer`

---

## 🚀 How to Use

### Method 1: Visual Interface (Recommended)

1. **Open the Data Viewer page in your browser:**
   ```
   http://localhost:5173/admin/data-viewer
   ```

2. **Features available:**
   - 📊 View all collections in separate tabs
   - 🔴 Toggle real-time updates ON/OFF
   - 📋 Switch between JSON and Table views
   - 💾 Export any collection as JSON file
   - 📈 View dashboard statistics
   - 🔄 Refresh data manually

### Method 2: Use in Your Components

```javascript
import { useAllFirestoreData } from '../hooks/useFirestore';

function MyComponent() {
  const { data, loading, error } = useAllFirestoreData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  console.log('All data:', data);
  // data.users
  // data.bookings
  // data.categories
  // data.hoardings
  // data.contactMessages

  return <div>Data loaded!</div>;
}
```

### Method 3: Direct Service Calls

```javascript
import { fetchAllData } from '../services/firestoreService';

async function loadData() {
  const data = await fetchAllData();
  console.log('Fetched data:', data);
}
```

### Method 4: Browser Console

1. Open browser console (F12)
2. Import the utility:
   ```javascript
   import { fetchAllFirestoreData } from './utils/fetchFirestoreData.js';
   ```
3. Fetch all data:
   ```javascript
   await fetchAllFirestoreData();
   ```
4. Access data:
   ```javascript
   window.firestoreData
   ```

---

## 📊 Available Collections

Your Firestore has these collections:

| Collection | Description | Count Function |
|------------|-------------|----------------|
| **users** | User accounts and profiles | `fetchUsers()` |
| **bookings** | Hoarding bookings | `fetchBookings()` |
| **categories** | Hoarding categories | `fetchCategories()` |
| **hoardings** | Hoarding listings (nested) | `fetchHoardings()` |
| **contactMessages** | Contact form submissions | `fetchContactMessages()` |

---

## 🎯 Available Functions

### Service Functions (src/services/firestoreService.js)

#### Fetch All Data
```javascript
import { fetchAllData } from '../services/firestoreService';

const data = await fetchAllData();
// Returns: { users, bookings, categories, hoardings, contactMessages, timestamp }
```

#### Fetch Specific Collections
```javascript
import { 
  fetchUsers,
  fetchBookings,
  fetchCategories,
  fetchHoardings,
  fetchContactMessages,
  fetchDashboardStats
} from '../services/firestoreService';

const users = await fetchUsers();
const bookings = await fetchBookings();
const categories = await fetchCategories();
const hoardings = await fetchHoardings();
const messages = await fetchContactMessages();
const stats = await fetchDashboardStats();
```

#### Filtered Fetches
```javascript
import { 
  fetchBookingsByStatus,
  fetchBookingsByUser,
  fetchActiveCategories,
  fetchHoardingsByCategory,
  fetchUnreadContactMessages
} from '../services/firestoreService';

const pendingBookings = await fetchBookingsByStatus('pending');
const userBookings = await fetchBookingsByUser('userId123');
const activeCategories = await fetchActiveCategories();
const categoryHoardings = await fetchHoardingsByCategory('categoryId');
const unreadMessages = await fetchUnreadContactMessages();
```

#### Real-time Subscriptions
```javascript
import { 
  subscribeToUsers,
  subscribeToBookings,
  subscribeToCategories,
  subscribeToContactMessages
} from '../services/firestoreService';

// Subscribe to real-time updates
const unsubscribe = subscribeToBookings((bookings) => {
  console.log('Bookings updated:', bookings);
});

// Cleanup when done
unsubscribe();
```

### React Hooks (src/hooks/useFirestore.js)

```javascript
import { 
  useAllFirestoreData,
  useUsers,
  useBookings,
  useCategories,
  useHoardings,
  useContactMessages,
  useDashboardStats
} from '../hooks/useFirestore';

// In your component:
const { data, loading, error, refetch } = useAllFirestoreData();
const { users } = useUsers(true); // true = real-time
const { bookings } = useBookings(true, 'pending'); // filter by status
const { categories } = useCategories(false, true); // activeOnly
const { hoardings } = useHoardings('categoryId');
const { messages } = useContactMessages(true, true); // unreadOnly
const { stats } = useDashboardStats();
```

---

## 💡 Quick Examples

### Example 1: Display All Users
```javascript
import { useUsers } from '../hooks/useFirestore';

function UsersList() {
  const { users, loading, error } = useUsers();

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Users ({users.length})</h2>
      {users.map(user => (
        <div key={user.id}>
          {user.displayName} - {user.email}
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Real-time Pending Bookings
```javascript
import { useBookings } from '../hooks/useFirestore';

function PendingBookings() {
  const { bookings, loading } = useBookings(true, 'pending');

  return (
    <div>
      <h2>Pending Bookings ({bookings.length})</h2>
      {bookings.map(booking => (
        <div key={booking.id}>
          {booking.hoardingName} - {booking.status}
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Dashboard Statistics
```javascript
import { useDashboardStats } from '../hooks/useFirestore';

function Dashboard() {
  const { stats, loading } = useDashboardStats();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <div>Total Users: {stats.totalUsers}</div>
      <div>Total Bookings: {stats.totalBookings}</div>
      <div>Pending: {stats.pendingBookings}</div>
      <div>Total Hoardings: {stats.totalHoardings}</div>
      <div>Unread Messages: {stats.unreadMessages}</div>
    </div>
  );
}
```

### Example 4: Export All Data
```javascript
import { fetchAllData } from '../services/firestoreService';

async function exportAllData() {
  const data = await fetchAllData();
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'firestore_backup.json';
  a.click();
}
```

---

## 🎨 Data Viewer Page Features

Navigate to: **http://localhost:5173/admin/data-viewer**

### Features:
- ✅ **All Data Tab** - View all collections at once
- ✅ **Users Tab** - View all user accounts
- ✅ **Bookings Tab** - View all bookings
- ✅ **Categories Tab** - View all categories
- ✅ **Hoardings Tab** - View all hoardings from all categories
- ✅ **Messages Tab** - View all contact messages
- ✅ **Statistics Tab** - View dashboard statistics

### Controls:
- 🔴 **Realtime Toggle** - Enable/disable real-time updates
- 📋 **JSON/Table Toggle** - Switch between JSON and table view
- 💾 **Export Button** - Download data as JSON file
- 🔄 **Refresh Button** - Manually refresh data

---

## 📝 Important Notes

1. **Authentication Required**: You must be logged in to fetch data
2. **Firestore Rules**: Ensure your Firestore rules allow reading
3. **Real-time Updates**: Use sparingly to avoid excessive reads
4. **Nested Collections**: Hoardings are nested under categories
5. **Data Structure**: All documents include `id` field

---

## 🔧 Troubleshooting

### "Missing or insufficient permissions"
- Check Firestore security rules
- Ensure you're authenticated
- Verify user has proper role

### Data not loading
- Check Firebase configuration
- Verify collections exist in Firestore
- Check browser console for errors

### Real-time not working
- Ensure you're calling unsubscribe on cleanup
- Check that realtime parameter is `true`
- Verify Firestore rules allow reading

---

## 📚 Documentation

For more details, see:
- **FIRESTORE_DATA_GUIDE.md** - Complete usage guide
- **src/services/firestoreService.js** - Service documentation
- **src/hooks/useFirestore.js** - Hooks documentation

---

## 🎉 You're Ready!

Everything is set up and ready to use. Visit the Data Viewer page to see all your Firestore data:

**http://localhost:5173/admin/data-viewer**

Happy coding! 🚀
