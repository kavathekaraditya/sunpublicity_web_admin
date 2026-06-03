/**
 * Firestore Data Fetcher - Console Script
 * Run this in browser console to fetch all Firestore data
 * 
 * Usage:
 * 1. Open your app in browser
 * 2. Open Developer Console (F12)
 * 3. Copy and paste this entire file
 * 4. Call: fetchAllFirestoreData()
 */

// Import Firebase modules
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './config/firebase';

/**
 * Fetch all data from all Firestore collections
 */
export async function fetchAllFirestoreData() {
    console.log('🔥 Starting Firestore data fetch...\n');

    const results = {
        timestamp: new Date().toISOString(),
        collections: {}
    };

    try {
        // Fetch Users
        console.log('📥 Fetching users...');
        const usersSnapshot = await getDocs(collection(db, 'users'));
        results.collections.users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`✅ Fetched ${results.collections.users.length} users\n`);

        // Fetch Bookings
        console.log('📥 Fetching bookings...');
        const bookingsSnapshot = await getDocs(
            query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))
        );
        results.collections.bookings = bookingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`✅ Fetched ${results.collections.bookings.length} bookings\n`);

        // Fetch Categories
        console.log('📥 Fetching categories...');
        const categoriesSnapshot = await getDocs(
            query(collection(db, 'categories'), orderBy('order', 'asc'))
        );
        results.collections.categories = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`✅ Fetched ${results.collections.categories.length} categories\n`);

        // Fetch Hoardings from all categories
        console.log('📥 Fetching hoardings...');
        results.collections.hoardings = [];

        for (const category of results.collections.categories) {
            const hoardingsSnapshot = await getDocs(
                collection(db, 'categories', category.id, 'hoardings')
            );

            const hoardings = hoardingsSnapshot.docs.map(doc => ({
                id: doc.id,
                categoryId: category.id,
                categoryName: category.name,
                ...doc.data()
            }));

            results.collections.hoardings.push(...hoardings);
            console.log(`  ↳ ${hoardings.length} hoardings from "${category.name}"`);
        }
        console.log(`✅ Fetched ${results.collections.hoardings.length} total hoardings\n`);

        // Fetch Contact Messages
        console.log('📥 Fetching contact messages...');
        const messagesSnapshot = await getDocs(
            query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'))
        );
        results.collections.contactMessages = messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`✅ Fetched ${results.collections.contactMessages.length} contact messages\n`);

        // Calculate statistics
        results.statistics = {
            totalUsers: results.collections.users.length,
            totalBookings: results.collections.bookings.length,
            pendingBookings: results.collections.bookings.filter(b => b.status === 'pending').length,
            approvedBookings: results.collections.bookings.filter(b => b.status === 'approved').length,
            rejectedBookings: results.collections.bookings.filter(b => b.status === 'rejected').length,
            totalCategories: results.collections.categories.length,
            activeCategories: results.collections.categories.filter(c => c.active).length,
            totalHoardings: results.collections.hoardings.length,
            totalContactMessages: results.collections.contactMessages.length,
            unreadMessages: results.collections.contactMessages.filter(m => !m.read).length
        };

        // Print summary
        console.log('═══════════════════════════════════════');
        console.log('📊 FIRESTORE DATA SUMMARY');
        console.log('═══════════════════════════════════════');
        console.log(`👥 Users: ${results.statistics.totalUsers}`);
        console.log(`📅 Bookings: ${results.statistics.totalBookings}`);
        console.log(`   ⏳ Pending: ${results.statistics.pendingBookings}`);
        console.log(`   ✅ Approved: ${results.statistics.approvedBookings}`);
        console.log(`   ❌ Rejected: ${results.statistics.rejectedBookings}`);
        console.log(`📂 Categories: ${results.statistics.totalCategories} (${results.statistics.activeCategories} active)`);
        console.log(`🏢 Hoardings: ${results.statistics.totalHoardings}`);
        console.log(`💬 Messages: ${results.statistics.totalContactMessages} (${results.statistics.unreadMessages} unread)`);
        console.log('═══════════════════════════════════════\n');

        console.log('✨ All data fetched successfully!');
        console.log('📦 Access the data via: window.firestoreData');
        console.log('💾 Download as JSON: downloadFirestoreData()\n');

        // Store in window for easy access
        window.firestoreData = results;

        return results;

    } catch (error) {
        console.error('❌ Error fetching Firestore data:', error);
        throw error;
    }
}

/**
 * Download all Firestore data as JSON file
 */
export function downloadFirestoreData() {
    if (!window.firestoreData) {
        console.error('❌ No data available. Run fetchAllFirestoreData() first.');
        return;
    }

    const dataStr = JSON.stringify(window.firestoreData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firestore_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ Data downloaded successfully!');
}

/**
 * Print specific collection data
 */
export function printCollection(collectionName) {
    if (!window.firestoreData) {
        console.error('❌ No data available. Run fetchAllFirestoreData() first.');
        return;
    }

    const data = window.firestoreData.collections[collectionName];

    if (!data) {
        console.error(`❌ Collection "${collectionName}" not found.`);
        console.log('Available collections:', Object.keys(window.firestoreData.collections));
        return;
    }

    console.log(`\n📦 ${collectionName.toUpperCase()} (${data.length} items)`);
    console.log('═══════════════════════════════════════');
    console.table(data);
}

/**
 * Search across all collections
 */
export function searchFirestore(searchTerm) {
    if (!window.firestoreData) {
        console.error('❌ No data available. Run fetchAllFirestoreData() first.');
        return;
    }

    const results = {};
    const term = searchTerm.toLowerCase();

    for (const [collectionName, items] of Object.entries(window.firestoreData.collections)) {
        const matches = items.filter(item =>
            JSON.stringify(item).toLowerCase().includes(term)
        );

        if (matches.length > 0) {
            results[collectionName] = matches;
        }
    }

    console.log(`\n🔍 Search results for "${searchTerm}":`);
    console.log('═══════════════════════════════════════');

    if (Object.keys(results).length === 0) {
        console.log('No results found.');
    } else {
        for (const [collection, items] of Object.entries(results)) {
            console.log(`\n${collection}: ${items.length} matches`);
            console.table(items);
        }
    }

    return results;
}

// Auto-run on import (optional)
console.log('🔥 Firestore Data Fetcher loaded!');
console.log('📝 Available commands:');
console.log('  • fetchAllFirestoreData() - Fetch all data');
console.log('  • downloadFirestoreData() - Download as JSON');
console.log('  • printCollection("users") - Print specific collection');
console.log('  • searchFirestore("term") - Search all collections');
console.log('  • window.firestoreData - Access fetched data\n');

// Export for use in other modules
export default {
    fetchAllFirestoreData,
    downloadFirestoreData,
    printCollection,
    searchFirestore
};
