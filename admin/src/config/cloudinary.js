// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = "dvaoenkgr";
const CLOUDINARY_UPLOAD_PRESET = "hoardings_upload";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Upload image to Cloudinary
 * @param {File} file - Image file to upload
 * @returns {Promise<{url: string, publicId: string}>} - Upload result with URL and public ID
 */
export const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'hoardings');

    // Add resource_type auto to support videos if needed, though Cloudinary defaults might hande it.
    // However, for explicit video uploads, we often need 'resource_type' param in URL or body.
    // The standard endpoint is /image/upload, but for videos it should be /video/upload or /auto/upload.

    // Determine endpoint based on file type
    let apiUrl = CLOUDINARY_API_URL;
    if (file.type.startsWith('video/')) {
        apiUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Upload failed');
        }

        const data = await response.json();

        return {
            url: data.secure_url,
            publicId: data.public_id,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

/**
 * Delete image from Cloudinary via Firebase Cloud Function
 * This is secure and requires admin authentication
 * 
 * @param {string} publicId - Public ID of the image/video to delete
 * @param {string} resourceType - 'image' or 'video' (default: 'image')
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    if (!publicId) {
        console.warn('No publicId provided for deletion');
        return { success: false, message: 'No publicId provided' };
    }

    try {
        // Import Firebase Functions
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const { default: app } = await import('./firebase');
        
        const functions = getFunctions(app);
        const deleteAsset = httpsCallable(functions, 'deleteCloudinaryAsset');

        console.log(`Requesting deletion of ${resourceType}: ${publicId}`);

        // Call Firebase Cloud Function
        const result = await deleteAsset({ publicId, resourceType });

        console.log('Cloudinary deletion result:', result.data);

        return {
            success: result.data.success,
            message: result.data.message,
            result: result.data.result
        };

    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        
        // Handle specific Firebase errors
        if (error.code === 'unauthenticated') {
            throw new Error('You must be logged in to delete assets');
        } else if (error.code === 'permission-denied') {
            throw new Error('Only admins can delete assets');
        } else {
            throw new Error(`Failed to delete asset: ${error.message}`);
        }
    }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary image URL
 * @returns {string|null} - Public ID or null if not a Cloudinary URL
 */
export const extractPublicId = (url) => {
    if (!url || !url.includes('cloudinary.com')) {
        return null;
    }

    try {
        // Extract public_id from URL
        // Example: https://res.cloudinary.com/dvaoenkgr/image/upload/v1234567890/hoardings/image.jpg
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;

        const pathParts = parts[1].split('/');
        // Remove version (v1234567890) if present
        const relevantParts = pathParts.filter(part => !part.startsWith('v'));

        // Join remaining parts and remove file extension
        const publicId = relevantParts.join('/').replace(/\.[^/.]+$/, '');
        return publicId;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};

export default {
    uploadToCloudinary,
    deleteFromCloudinary,
    extractPublicId,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_UPLOAD_PRESET,
};
