import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "../firebase";

/**
 * Creates a new booking in Firestore
 * 
 * @param {Object} bookingData - Booking information
 * @param {string} bookingData.userId - User ID from Firebase Auth
 * @param {string} bookingData.userName - User's display name
 * @param {string} bookingData.userEmail - User's email
 * @param {string} bookingData.userPhone - User's phone number
 * @param {string} bookingData.hoardingId - Hoarding document ID
 * @param {string} bookingData.hoardingTitle - Hoarding title/name
 * @param {string} bookingData.hoardingAddress - Hoarding location address
 * @param {Date|string} bookingData.startDate - Booking start date
 * @param {Date|string} bookingData.endDate - Booking end date
 * @param {number} bookingData.totalPrice - Total booking price
 * @param {string} bookingData.status - Booking status (default: "pending")
 * @returns {Promise<string>} - Returns the booking ID
 */
export async function createBooking(bookingData) {
    try {
        // Validate required fields
        const requiredFields = [
            'userId', 'userName', 'userEmail', 'hoardingId',
            'hoardingTitle', 'hoardingAddress', 'startDate',
            'endDate', 'totalPrice'
        ];

        for (const field of requiredFields) {
            if (!bookingData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Prepare booking document
        const booking = {
            userId: bookingData.userId,
            userName: bookingData.userName,
            userEmail: bookingData.userEmail,
            userPhone: bookingData.userPhone || "",
            hoardingId: bookingData.hoardingId,
            hoardingTitle: bookingData.hoardingTitle,
            hoardingAddress: bookingData.hoardingAddress,
            startDate: bookingData.startDate instanceof Date
                ? bookingData.startDate
                : new Date(bookingData.startDate),
            endDate: bookingData.endDate instanceof Date
                ? bookingData.endDate
                : new Date(bookingData.endDate),
            totalPrice: Number(bookingData.totalPrice),
            status: bookingData.status || "pending",
            createdAt: serverTimestamp(),
        };

        // Add to Firestore
        const bookingsRef = collection(firestore, "bookings");
        const docRef = await addDoc(bookingsRef, booking);

        console.log("Booking created successfully:", docRef.id);
        return docRef.id;

    } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
    }
}

/**
 * Example usage:
 * 
 * const bookingId = await createBooking({
 *   userId: user.uid,
 *   userName: user.displayName,
 *   userEmail: user.email,
 *   userPhone: userProfile.phone,
 *   hoardingId: "hoarding123",
 *   hoardingTitle: "Premium Billboard",
 *   hoardingAddress: "123 Main Street, Mumbai",
 *   startDate: new Date("2024-01-01"),
 *   endDate: new Date("2024-03-31"),
 *   totalPrice: 50000,
 *   status: "pending"
 * });
 */
