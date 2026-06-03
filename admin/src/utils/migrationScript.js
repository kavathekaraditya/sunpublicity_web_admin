import {
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ensureCategoryExists } from './hoardingHelpers';

/**
 * Migration script to move hoardings from flat structure to category-name-based subcollections
 * 
 * OLD STRUCTURE: hoardings/{hoardingId}
 * NEW STRUCTURE: categories/{categoryName}/hoardings/{hoardingId}
 * 
 * Note: Category names are used as document IDs
 */

/**
 * Main migration function
 * @param {boolean} deleteOldData - Whether to delete the old hoardings collection after migration
 * @returns {Promise<Object>} Migration results
 */
export const migrateHoardingsToCategories = async (deleteOldData = false) => {
    console.log('🚀 Starting hoarding migration...');

    const results = {
        totalHoardings: 0,
        migrated: 0,
        failed: 0,
        errors: [],
        categoryMapping: {}
    };

    try {
        // Step 1: Fetch all hoardings from old structure
        console.log('📋 Fetching hoardings from old collection...');
        const hoardingsSnapshot = await getDocs(collection(db, 'hoardings'));
        results.totalHoardings = hoardingsSnapshot.docs.length;

        console.log(`✅ Found ${results.totalHoardings} hoardings to migrate`);

        if (results.totalHoardings === 0) {
            console.log('⚠️ No hoardings found to migrate');
            return results;
        }

        // Step 2: Migrate each hoarding to its category subcollection
        console.log('🔄 Starting migration process...');

        for (const hoardingDoc of hoardingsSnapshot.docs) {
            const hoardingId = hoardingDoc.id;
            const hoardingData = hoardingDoc.data();
            const categoryName = hoardingData.category;

            try {
                if (!categoryName) {
                    console.warn(`⚠️ No category found for hoarding "${hoardingData.title}". Skipping...`);
                    results.failed++;
                    results.errors.push({
                        hoardingId,
                        title: hoardingData.title,
                        error: 'No category specified'
                    });
                    continue;
                }

                // Ensure category document exists
                await ensureCategoryExists(categoryName);

                // Create the hoarding in the new location using category name as document ID
                const newHoardingRef = doc(db, 'categories', categoryName, 'hoardings', hoardingId);

                await setDoc(newHoardingRef, {
                    ...hoardingData,
                    migratedAt: serverTimestamp()
                });

                results.migrated++;
                results.categoryMapping[categoryName] = (results.categoryMapping[categoryName] || 0) + 1;

                console.log(`✅ Migrated: ${hoardingData.title} → categories/${categoryName}/hoardings/${hoardingId}`);

            } catch (error) {
                console.error(`❌ Failed to migrate hoarding ${hoardingId}:`, error);
                results.failed++;
                results.errors.push({
                    hoardingId,
                    title: hoardingData.title,
                    error: error.message
                });
            }
        }

        // Step 3: Delete old hoardings collection if requested
        if (deleteOldData && results.migrated > 0) {
            console.log('🗑️ Deleting old hoardings collection...');

            try {
                const batch = writeBatch(db);
                let batchCount = 0;

                for (const hoardingDoc of hoardingsSnapshot.docs) {
                    batch.delete(hoardingDoc.ref);
                    batchCount++;

                    if (batchCount === 500) {
                        await batch.commit();
                        batchCount = 0;
                    }
                }

                if (batchCount > 0) {
                    await batch.commit();
                }

                console.log('✅ Old hoardings collection deleted');
            } catch (error) {
                console.error('❌ Error deleting old collection:', error);
                results.errors.push({
                    error: 'Failed to delete old collection: ' + error.message
                });
            }
        }

        // Print summary
        console.log('\n📊 Migration Summary:');
        console.log(`Total hoardings: ${results.totalHoardings}`);
        console.log(`Successfully migrated: ${results.migrated}`);
        console.log(`Failed: ${results.failed}`);
        console.log('\nHoardings per category:');
        Object.entries(results.categoryMapping).forEach(([category, count]) => {
            console.log(`  ${category}: ${count}`);
        });

        if (results.errors.length > 0) {
            console.log('\n❌ Errors:');
            results.errors.forEach(err => {
                console.log(`  - ${err.title || err.hoardingId}: ${err.error}`);
            });
        }

        console.log('\n✅ Migration completed!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }

    return results;
};

/**
 * Verify migration by comparing counts
 * @returns {Promise<Object>} Verification results
 */
export const verifyMigration = async () => {
    console.log('🔍 Verifying migration...');

    const results = {
        oldCollectionCount: 0,
        newStructureCount: 0,
        categoryCounts: {}
    };

    try {
        // Count old collection
        const oldSnapshot = await getDocs(collection(db, 'hoardings'));
        results.oldCollectionCount = oldSnapshot.docs.length;

        // Count new structure by fetching all categories
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));

        for (const categoryDoc of categoriesSnapshot.docs) {
            const categoryName = categoryDoc.id; // Document ID is the category name
            const hoardingsSnapshot = await getDocs(
                collection(db, 'categories', categoryName, 'hoardings')
            );

            const count = hoardingsSnapshot.docs.length;
            results.categoryCounts[categoryName] = count;
            results.newStructureCount += count;
        }

        console.log('\n📊 Verification Results:');
        console.log(`Old collection count: ${results.oldCollectionCount}`);
        console.log(`New structure count: ${results.newStructureCount}`);
        console.log('\nCategory breakdown:');
        Object.entries(results.categoryCounts).forEach(([category, count]) => {
            console.log(`  ${category}: ${count}`);
        });

        if (results.oldCollectionCount === results.newStructureCount) {
            console.log('\n✅ Migration verified successfully!');
        } else {
            console.log('\n⚠️ Count mismatch detected!');
        }

    } catch (error) {
        console.error('❌ Verification failed:', error);
        throw error;
    }

    return results;
};
