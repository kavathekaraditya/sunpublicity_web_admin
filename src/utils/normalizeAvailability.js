/**
 * Normalizes availability field from Firestore data
 */
export function normalizeAvailability(data) {
    if (!data) return false;
    const possibleFields = ['available', 'Available', 'availability', 'Availability', 'isAvailable', 'is_available'];
    for (const field of possibleFields) {
        if (data[field] !== undefined && data[field] !== null) {
            const value = data[field];
            if (typeof value === 'boolean') return value;
            if (typeof value === 'string') {
                const lowerValue = value.toLowerCase().trim();
                return lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1';
            }
            if (typeof value === 'number') return value === 1;
        }
    }
    return false;
}

/**
 * Normalizes image field from Firestore data
 */
export function normalizeImage(data) {
    if (!data) return "";
    const possibleFields = [
        'image', 'imageUrl', 'imageURL', 'ImageURL', 'ImageUrl', 'Image',
        'photo', 'Photo', 'img', 'Img', 'picture', 'Picture', 'thumbnail'
    ];
    for (const field of possibleFields) {
        if (data[field] && typeof data[field] === 'string') {
            return data[field];
        }
    }
    return "";
}

/**
 * Normalizes hoarding data from Firestore
 */
export function normalizeHoardingData(docData, docId, categoryName) {
    // Robust coordinate parsing
    const latField = ['lat', 'latitude', 'Lat', 'Latitude'].find(f => docData[f] !== undefined);
    const lngField = ['lng', 'longitude', 'Lng', 'Longitude', 'long', 'Long'].find(f => docData[f] !== undefined);

    const lat = latField ? parseFloat(docData[latField]) : null;
    const lng = lngField ? parseFloat(docData[lngField]) : null;

    return {
        id: docId,
        title: docData.title || docData.location || docData.name || categoryName,
        name: docData.title || docData.location || docData.name || categoryName, // Alias for compatibility
        location: docData.location || "",
        locationAddress: docData.location || "", // Alias for compatibility
        categoryName: categoryName,
        lat,
        lng,
        price: docData.price || 0,
        image: normalizeImage(docData),
        imageUrl: normalizeImage(docData), // Alias for compatibility
        size: docData.size || "",
        available: normalizeAvailability(docData),
        expiryDate: docData.expiryDate || null,
        // Keep original data for any other fields
        ...docData
    };
}
