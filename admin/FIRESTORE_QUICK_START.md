# 🔥 Firestore Data Fetching - Quick Start

## ✨ What's New

I've created a complete system to **fetch all data from your Firestore database**. You can now:

✅ View all Firestore data in a beautiful UI  
✅ Export data as JSON files  
✅ Use real-time updates  
✅ Easily integrate data fetching in your components  
✅ Access data via React hooks or direct service calls  

---

## 🚀 Quick Access

### 1. **Visual Data Viewer** (Easiest Way)

Open your browser and navigate to:

```
http://localhost:5173/admin/data-viewer
```

Or click **"Data Viewer"** in the sidebar menu (🗄️ Database icon)

**Features:**
- 📊 View all collections (Users, Bookings, Categories, Hoardings, Messages)
- 🔴 Toggle real-time updates ON/OFF
- 📋 Switch between JSON and Table views
- 💾 Export any collection as JSON
- 📈 View dashboard statistics
- 🔄 Refresh data manually

---

## 📁 What Was Created

### New Files:

1. **`src/services/firestoreService.js`**
   - Complete Firestore data fetching service
   - Functions for all collections
   - Real-time subscriptions
   - Filtering and statistics

2. **`src/hooks/useFirestore.js`**
   - Custom React hooks for data fetching
   - Automatic loading/error states
   - Easy integration in components

3. **`src/pages/FirestoreDataViewer.jsx`**
   - Beautiful UI to view all data
   - Export functionality
   - Real-time toggle

4. **`src/utils/fetchFirestoreData.js`**
   - Console utility for quick data access
   - Search and filter functions

5. **Documentation:**
   - `FIRESTORE_SETUP_SUMMARY.md` - Complete guide
   - `FIRESTORE_DATA_GUIDE.md` - Usage examples

### Modified Files:

- `src/App.jsx` - Added route for Data Viewer
- `src/components/Sidebar.jsx` - Added Data Viewer menu item

---

## 💡 Usage Examples

### In Your Components (React Hooks)

```javascript
import { useAllFirestoreData, useUsers, useBookings } from '../hooks/useFirestore';

function MyComponent() {
  // Fetch all data
  const { data, loading, error } = useAllFirestoreData();

  // Or fetch specific collections
  const { users } = useUsers();
  const { bookings } = useBookings(true); // true = real-time

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <p>Users: {data.users.length}</p>
      <p>Bookings: {data.bookings.length}</p>
    </div>
  );
}
```

### Direct Service Calls

```javascript
import { fetchAllData, fetchUsers } from '../services/firestoreService';

async function loadData() {
  // Fetch all collections
  const allData = await fetchAllData();
  console.log('All data:', allData);

  // Or fetch specific collection
  const users = await fetchUsers();
  console.log('Users:', users);
}
```

### Export Data as JSON

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

---

## 📊 Available Collections

| Collection | Description |
|------------|-------------|
| **users** | User accounts and profiles |
| **bookings** | Hoarding bookings |
| **categories** | Hoarding categories |
| **hoardings** | Hoarding listings (nested in categories) |
| **contactMessages** | Contact form submissions |

---

## 🎯 Available Functions

### Fetch Functions
- `fetchAllData()` - All collections
- `fetchUsers()` - All users
- `fetchBookings()` - All bookings
- `fetchCategories()` - All categories
- `fetchHoardings()` - All hoardings
- `fetchContactMessages()` - All messages
- `fetchDashboardStats()` - Statistics

### Filtered Fetches
- `fetchBookingsByStatus(status)` - Filter by status
- `fetchBookingsByUser(userId)` - Filter by user
- `fetchActiveCategories()` - Only active categories
- `fetchUnreadContactMessages()` - Only unread messages

### Real-time Subscriptions
- `subscribeToUsers(callback)`
- `subscribeToBookings(callback)`
- `subscribeToCategories(callback)`
- `subscribeToContactMessages(callback)`

### React Hooks
- `useAllFirestoreData(realtime)`
- `useUsers(realtime)`
- `useBookings(realtime, status, userId)`
- `useCategories(realtime, activeOnly)`
- `useHoardings(categoryId)`
- `useContactMessages(realtime, unreadOnly)`
- `useDashboardStats()`

---

## 📚 Full Documentation

For complete documentation, see:
- **`FIRESTORE_SETUP_SUMMARY.md`** - Complete setup guide
- **`FIRESTORE_DATA_GUIDE.md`** - Detailed usage examples

---

## 🎉 Get Started Now!

1. **Open the Data Viewer:**
   ```
   http://localhost:5173/admin/data-viewer
   ```

2. **Or click "Data Viewer" in the sidebar menu**

3. **Start fetching data in your components:**
   ```javascript
   import { useUsers } from '../hooks/useFirestore';
   const { users } = useUsers();
   ```

That's it! You're ready to fetch all your Firestore data! 🚀
