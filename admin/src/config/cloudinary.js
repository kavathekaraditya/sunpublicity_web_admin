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
 * Delete image from Cloudinary
 * Note: Deletion requires authentication and should ideally be done server-side
 * For unsigned uploads, you may need to enable "Allow Destroy" in Cloudinary settings
 * or implement a backend endpoint for deletion
 * 
 * @param {string} publicId - Public ID of the image to delete
 */
export const deleteFromCloudinary = async (publicId) => {
    // Note: Direct deletion from client-side is not recommended for security
    // This is a placeholder - you should implement server-side deletion
    console.warn('Cloudinary deletion should be handled server-side for security');
    console.log('Image to delete:', publicId);

    // For now, we'll just log it. The image will remain in Cloudinary
    // but won't be referenced in your database
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
