# Contact Message Notification System

## Overview
The admin panel now has a **complete real-time notification system** that alerts you whenever a customer sends a message through the contact form. Messages appear instantly both in the notification bell and on the Contact Messages page.

## How It Works

### 1. **Real-time Monitoring**
- The system uses Firebase Firestore's `onSnapshot` listener to monitor the `contactMessages` collection in real-time
- When a new message is added to the database, notifications are triggered instantly
- **No page refresh needed** - messages appear automatically

### 2. **Notification Display**
- A bell icon (🔔) appears in the navbar at the top right
- When new messages arrive, a red badge shows the count of unread notifications
- Click the bell icon to view all notifications in a dropdown panel

### 3. **Contact Messages Page**
- The Contact Messages page (`/admin/contact-messages`) also updates in real-time
- New messages appear automatically at the top of the list
- No need to refresh the page to see new messages

### 4. **Notification Content**
Each notification shows:
- **Title**: "📩 New Contact Message"
- **Message Preview**: Sender's name and first 50 characters of their message
- **Timestamp**: When the message was received
- Click the checkmark (✓) button on any notification to mark it as read
- Click "Mark all as read" to clear all unread notifications at once
- Notifications remain visible even after being marked as read

## Technical Implementation

### Files Modified:
1. **`src/contexts/NotificationContext.jsx`**
   - Added `onSnapshot` listener for real-time contact message monitoring
   - Tracks message count to detect new messages
   - Automatically creates notifications when new messages arrive

2. **`src/pages/ContactMessages.jsx`**
   - Changed from one-time fetch (`getDocs`) to real-time listener (`onSnapshot`)
   - Messages now appear instantly without page refresh
   - Proper cleanup with unsubscribe on component unmount

3. **`src/components/Navbar.jsx`**
   - Already includes the `NotificationCenter` component
   - Displays the bell icon with unread count badge

4. **`src/components/NotificationCenter.jsx`**
   - Renders the notification dropdown
   - Handles marking notifications as read

## Testing the Feature

To test the notification system:

1. **Open the admin panel** in one browser window
2. **Open your main website** in another window
3. **Submit a contact form** on the main website
4. **Watch the admin panel** - you should see:
   - The bell icon badge update with the new notification count
   - A new notification appear when you click the bell icon

## Additional Features

The notification system also monitors:
- **Booking Expiry Alerts**: Notifies when bookings are expiring within 7 days
- **Pending Booking Requests**: Shows count of pending booking requests

These checks run every 5 minutes automatically.

## Future Enhancements

Potential improvements:
- Sound/desktop notifications for new messages
- Email notifications
- Push notifications for mobile devices
- Notification history/archive
- Filter notifications by type
