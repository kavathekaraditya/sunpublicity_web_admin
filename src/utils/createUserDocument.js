import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "../firebase";

/**
 * Creates a Firestore user document for a new user on first login
 * If user document already exists, does nothing (prevents overwriting)
 * 
 * @param {Object} firebaseUser - Firebase Auth user object
 * @returns {Promise<boolean>} - Returns true if document was created, false if already exists
 */
export async function createUserDocument(firebaseUser) {
    if (!firebaseUser) {
        console.warn("createUserDocument: No user provided");
        return false;
    }

    try {
        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            return false;
        }

        const userData = {
            name: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            phone: "",
            address: "",
            city: "",
            profileImage: firebaseUser.photoURL || "",
            role: "customer",
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            uid: firebaseUser.uid,
        };

        await setDoc(userDocRef, userData);
        return true;
    } catch (error) {
        console.error("Error creating user document:", error);
        throw error;
    }
}

/**
 * Specialized sync for Google Sign-in with deep profile details
 * 
 * @param {Object} user - Firebase User object
 * @param {string} providerId - Auth provider ID
 */
export async function syncGoogleUser(user, providerId) {
    if (!user) return;

    try {
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // New Google User
            await setDoc(userRef, {
                name: user.displayName || "Google User",
                email: user.email,
                photo: user.photoURL || "",
                phoneNumber: user.phoneNumber || "",
                emailVerified: user.emailVerified,
                metadata: {
                    creationTime: user.metadata.creationTime,
                    lastSignInTime: user.metadata.lastSignInTime,
                },
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
                role: "customer",
                uid: user.uid,
                providerId: providerId,
            });
        } else {
            // Returning user - update last login and sync photo
            await setDoc(userRef, {
                lastLoginAt: serverTimestamp(),
                photo: user.photoURL || userSnap.data().photo,
                emailVerified: user.emailVerified,
            }, { merge: true });
        }
    } catch (error) {
        console.error("Error syncing Google user:", error);
        throw error;
    }
}

/**
 * Fetches user profile data from Firestore
 * 
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} - User profile data or null if not found
 */
export async function getUserProfile(uid) {
    if (!uid) return null;

    try {
        const userDocRef = doc(firestore, "users", uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
}

/**
 * Updates user profile data in Firestore
 * 
 * @param {string} uid - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<boolean>} - Returns true if successful
 */
export async function updateUserProfile(uid, profileData) {
    if (!uid) return false;

    try {
        const userDocRef = doc(firestore, "users", uid);
        const updateData = {};
        if (profileData.phone !== undefined) updateData.phone = profileData.phone;
        if (profileData.address !== undefined) updateData.address = profileData.address;
        if (profileData.city !== undefined) updateData.city = profileData.city;
        if (profileData.profileImage !== undefined) updateData.profileImage = profileData.profileImage;
        if (profileData.photo !== undefined) updateData.photo = profileData.photo;
        if (profileData.name !== undefined) updateData.name = profileData.name;

        await setDoc(userDocRef, updateData, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
}
