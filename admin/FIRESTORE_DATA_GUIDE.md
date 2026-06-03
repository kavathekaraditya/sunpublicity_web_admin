# Firestore Data Fetching Guide

This guide shows you how to fetch all data from Firestore in your React application.

## 📁 Files Created

1. **`src/services/firestoreService.js`** - Core service with all Firestore fetch functions
2. **`src/hooks/useFirestore.js`** - React hooks for easy data fetching
3. **`src/pages/FirestoreDataViewer.jsx`** - Demo page to view all data

## 🚀 Quick Start

### Option 1: View Data in Browser (Easiest)

Navigate to the Data Viewer page:
```
http://localhost:5173/admin/data-viewer
```

Features:
- ✅ View all collections in tabs
- ✅ Toggle real-time updates
- ✅ Switch between JSON and Table view
- ✅ Export data as JSON files
- ✅ View dashboard statistics

### Option 2: Use in Your Components

#### Fetch All Data at Once

```javascript
import { useAllFirestoreData } from '../hooks/useFirestore';

function MyComponent() {
  const { data, loading, error, refetch } = useAllFirestoreData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  console.log('Users:', data.users);
  console.log('Bookings:', data.bookings);
  console.log('Categories:', data.categories);
  console.log('Hoardings:', data.hoardings);
  console.log('Messages:', data.contactMessages);

  return <div>Data loaded!</div>;
}
```

#### Fetch Specific Collections

```javascript
import { useUsers, useBookings, useCategories } from '../hooks/useFirestore';

function MyComponent() {
  // Fetch users
  const { users, loading: usersLoading } = useUsers();
  
  // Fetch bookings with real-time updates
  const { bookings, loading: bookingsLoading } = useBookings(true);
  
  // Fetch only active categories
  const { categories } = useCategories(false, true);

  return (
    <div>
      <h2>Users: {users.length}</h2>
      <h2>Bookings: {bookings.length}</h2>
      <h2>Categories: {categories.length}</h2>
    </div>
  );
}
```

#### Fetch Dashboard Statistics

```javascript
import { useDashboardStats } from '../hooks/useFirestore';

function Dashboard() {
  const { stats, loading, error } = useDashboardStats();

  if (loading) return <div>Loading stats...</div>;

  return (
    <div>
      <p>Total Users: {stats.totalUsers}</p>
      <p>Total Bookings: {stats.totalBookings}</p>
      <p>Pending Bookings: {stats.pendingBookings}</p>
      <p>Total Hoardings: {stats.totalHoardings}</p>
      <p>Unread Messages: {stats.unreadMessages}</p>
    </div>
  );
}
```

### Option 3: Use Service Directly (Advanced)

```javascript
import { 
  fetchAllData, 
  fetchUsers, 
  fetchBookings,
  subscribeToBookings 
} from '../services/firestoreService';

// Fetch all data once
async function loadAllData() {
  try {
    const data = await fetchAllData();
    console.log('All data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Fetch specific collection
async function loadUsers() {
  const users = await fetchUsers();
  console.log('Users:', users);
}

// Subscribe to real-time updates
function setupRealtimeBookings() {
  const unsubscribe = subscribeToBookings((bookings) => {
    console.log('Bookings updated:', bookings);
  });

  // Call unsubscribe() when component unmounts
  return unsubscribe;
}
```

## 📊 Available Collections

Your Firestore database has the following collections:

1. **users** - User accounts and profiles
2. **bookings** - Hoarding bookings
3. **categories** - Hoarding categories
4. **hoardings** - Hoarding listings (nested in categories)
5. **contactMessages** - Contact form submissions

## 🎯 Available Functions

### Fetch Functions (One-time)

- `fetchAllData()` - Fetch all collections
- `fetchUsers()` - Fetch all users
- `fetchBookings()` - Fetch all bookings
- `fetchBookingsByStatus(status)` - Filter by status
- `fetchBookingsByUser(userId)` - Filter by user
- `fetchCategories()` - Fetch all categories
- `fetchActiveCategories()` - Only active categories
- `fetchHoardings()` - Fetch all hoardings
- `fetchHoardingsByCategory(categoryId)` - Filter by category
- `fetchContactMessages()` - Fetch all messages
- `fetchUnreadContactMessages()` - Only unread messages
- `fetchDashboardStats()` - Get statistics

### Subscribe Functions (Real-time)

- `subscribeToUsers(callback)` - Real-time users
- `subscribeToBookings(callback)` - Real-time bookings
- `subscribeToCategories(callback)` - Real-time categories
- `subscribeToContactMessages(callback)` - Real-time messages
- `subscribeToHoardingsByCategory(categoryId, callback)` - Real-time hoardings

### React Hooks

- `useAllFirestoreData(realtime)` - All data
- `useUsers(realtime)` - Users
- `useBookings(realtime, status, userId)` - Bookings
- `useCategories(realtime, activeOnly)` - Categories
- `useHoardings(categoryId)` - Hoardings
- `useContactMessages(realtime, unreadOnly)` - Messages
- `useDashboardStats()` - Statistics

## 💡 Examples

### Export All Data as JSON

```javascript
import { fetchAllData } from '../services/firestoreService';

async function exportData() {
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

### Real-time Dashboard

```javascript
import { useEffect, useState } from 'react';
import { subscribeToBookings, subscribeToUsers } from '../services/firestoreService';

function RealtimeDashboard() {
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsubBookings = subscribeToBookings(setBookings);
    const unsubUsers = subscribeToUsers(setUsers);

    return () => {
      unsubBookings();
      unsubUsers();
    };
  }, []);

  return (
    <div>
      <h2>Real-time Stats</h2>
      <p>Users: {users.length}</p>
      <p>Bookings: {bookings.length}</p>
    </div>
  );
}
```

### Filter Pending Bookings

```javascript
import { useBookings } from '../hooks/useFirestore';

function PendingBookings() {
  const { bookings, loading } = useBookings(true, 'pending');

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Pending Bookings ({bookings.length})</h2>
      {bookings.map(booking => (
        <div key={booking.id}>
          {booking.hoardingName} - {booking.customerName}
        </div>
      ))}
    </div>
  );
}
```

## 🔧 Troubleshooting

### Error: "Missing or insufficient permissions"

Make sure your Firestore security rules allow reading:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```

### Data not loading

1. Check Firebase configuration in `src/config/firebase.js`
2. Verify you're authenticated
3. Check browser console for errors
4. Ensure collections exist in Firestore

### Real-time updates not working

1. Make sure you're calling the unsubscribe function on cleanup
2. Check that you're passing `realtime=true` to hooks
3. Verify Firestore rules allow reading

## 📝 Notes

- All fetch functions return Promises
- Subscribe functions return an unsubscribe function
- Hooks automatically handle loading and error states
- Real-time updates use Firestore's `onSnapshot`
- All data includes document IDs as `id` field

## 🎉 You're All Set!

Visit **http://localhost:5173/admin/data-viewer** to see all your Firestore data!
