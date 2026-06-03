/**
 * Constructs a Cloudinary URL for a given image path or public ID.
 * @param {string} imagePath - The public ID or full URL of the image.
 * @returns {string} - The full Cloudinary URL.
 */
export const getCloudinaryUrl = (imagePath) => {
    if (!imagePath) return "https://placehold.co/800x450?text=No+Image";

    // If it's already a full URL or a local path, return it as is
    if (imagePath.startsWith("/") || imagePath.startsWith("http") || imagePath.startsWith("blob:")) {
        return imagePath;
    }

    // Otherwise, construct the Cloudinary URL using the cloud name 'dvaoenkgr'
    const cloudName = "dvaoenkgr";
    return `https://res.cloudinary.com/${cloudName}/image/upload/${imagePath}`;
};
