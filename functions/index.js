const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cloudinary = require('cloudinary').v2;

// Initialize Firebase Admin
admin.initializeApp();

// Configure Cloudinary with credentials
// Set these using: firebase functions:config:set cloudinary.cloud_name="xxx" cloudinary.api_key="xxx" cloudinary.api_secret="xxx"
cloudinary.config({
  cloud_name: functions.config().cloudinary?.cloud_name || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: functions.config().cloudinary?.api_key || process.env.CLOUDINARY_API_KEY,
  api_secret: functions.config().cloudinary?.api_secret || process.env.CLOUDINARY_API_SECRET,
});

/**
 * Helper function to verify user is admin or superadmin
 */
async function verifyAdminAccess(context) {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to perform this action'
    );
  }

  // Get user document from Firestore
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(context.auth.uid)
    .get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User profile not found'
    );
  }

  const userData = userDoc.data();
  const role = userData.role;

  // Check if user has admin or superadmin role
  if (role !== 'admin' && role !== 'superadmin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins and superadmins can delete assets'
    );
  }

  return { uid: context.auth.uid, role: role };
}

/**
 * Cloud Function: Delete single asset from Cloudinary
 * 
 * Request: { publicId: string, resourceType: 'image' | 'video' }
 * Response: { success: boolean, result: object, message: string }
 */
exports.deleteCloudinaryAsset = functions.https.onCall(async (data, context) => {
  try {
    // Verify admin access
    const user = await verifyAdminAccess(context);
    
    const { publicId, resourceType = 'image' } = data;

    // Validate input
    if (!publicId || typeof publicId !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'publicId must be a non-empty string'
      );
    }

    if (!['image', 'video'].includes(resourceType)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'resourceType must be "image" or "video"'
      );
    }

    functions.logger.info(`User ${user.uid} (${user.role}) requesting deletion of ${resourceType}: ${publicId}`);

    // Delete asset from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true // Invalidate CDN cache
    });

    functions.logger.info(`Cloudinary deletion result for ${publicId}:`, result);

    // Check result
    if (result.result === 'ok') {
      return {
        success: true,
        result: result,
        message: `${resourceType} deleted successfully from Cloudinary`
      };
    } else if (result.result === 'not found') {
      functions.logger.warn(`Asset not found in Cloudinary: ${publicId}`);
      return {
        success: true, // Return success since asset doesn't exist anyway
        result: result,
        message: `${resourceType} not found in Cloudinary (may have been already deleted)`
      };
    } else {
      throw new Error(`Unexpected Cloudinary response: ${result.result}`);
    }

  } catch (error) {
    functions.logger.error('Error deleting Cloudinary asset:', error);
    
    // Re-throw HttpsError as-is
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Wrap other errors
    throw new functions.https.HttpsError(
      'internal',
      `Failed to delete asset: ${error.message}`
    );
  }
});

/**
 * Cloud Function: Delete multiple assets from Cloudinary
 * 
 * Request: { publicIds: string[], resourceType: 'image' | 'video' }
 * Response: { success: boolean, results: { success: [], failed: [], notFound: [] }, message: string }
 */
exports.deleteCloudinaryAssets = functions.https.onCall(async (data, context) => {
  try {
    // Verify admin access
    const user = await verifyAdminAccess(context);
    
    const { publicIds, resourceType = 'image' } = data;

    // Validate input
    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'publicIds must be a non-empty array'
      );
    }

    if (publicIds.length > 100) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Cannot delete more than 100 assets at once'
      );
    }

    if (!['image', 'video'].includes(resourceType)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'resourceType must be "image" or "video"'
      );
    }

    functions.logger.info(`User ${user.uid} (${user.role}) requesting deletion of ${publicIds.length} ${resourceType}(s)`);

    const results = {
      success: [],
      failed: [],
      notFound: []
    };

    // Delete each asset
    for (const publicId of publicIds) {
      if (!publicId || typeof publicId !== 'string') {
        results.failed.push({ publicId, error: 'Invalid publicId' });
        continue;
      }

      try {
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
          invalidate: true
        });

        if (result.result === 'ok') {
          results.success.push(publicId);
          functions.logger.info(`Successfully deleted ${resourceType}: ${publicId}`);
        } else if (result.result === 'not found') {
          results.notFound.push(publicId);
          functions.logger.warn(`Asset not found: ${publicId}`);
        } else {
          results.failed.push({ publicId, error: result.result });
          functions.logger.error(`Failed to delete ${publicId}:`, result.result);
        }
      } catch (error) {
        results.failed.push({ publicId, error: error.message });
        functions.logger.error(`Error deleting ${publicId}:`, error);
      }
    }

    const message = `Deleted: ${results.success.length}, Not found: ${results.notFound.length}, Failed: ${results.failed.length}`;
    functions.logger.info(`Bulk deletion complete: ${message}`);

    return {
      success: true,
      results: results,
      message: message
    };

  } catch (error) {
    functions.logger.error('Error in bulk deletion:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      `Failed to delete assets: ${error.message}`
    );
  }
});

/**
 * Firestore Trigger: Auto-delete Cloudinary assets when hoarding is deleted
 */
exports.onHoardingDelete = functions.firestore
  .document('categories/{categoryId}/hoardings/{hoardingId}')
  .onDelete(async (snap, context) => {
    const data = snap.data();
    const publicIds = [];

    functions.logger.info(`Hoarding deleted: ${context.params.hoardingId}, auto-cleaning Cloudinary assets...`);

    // Extract publicIds from imageUrls array
    if (data.imageUrls && Array.isArray(data.imageUrls)) {
      for (const url of data.imageUrls) {
        const publicId = extractPublicIdFromUrl(url);
        if (publicId) publicIds.push(publicId);
      }
    }

    // Extract publicId from single imageUrl
    if (data.imageUrl) {
      const publicId = extractPublicIdFromUrl(data.imageUrl);
      if (publicId) publicIds.push(publicId);
    }

    // Delete all found assets
    if (publicIds.length > 0) {
      functions.logger.info(`Found ${publicIds.length} asset(s) to delete`);
      
      for (const publicId of publicIds) {
        try {
          const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'image',
            invalidate: true
          });
          functions.logger.info(`Auto-deleted asset ${publicId}:`, result.result);
        } catch (error) {
          functions.logger.error(`Failed to auto-delete ${publicId}:`, error);
          // Don't throw - allow other deletions to continue
        }
      }
    } else {
      functions.logger.info('No Cloudinary assets found to delete');
    }
  });

/**
 * Firestore Trigger: Auto-delete media assets
 */
exports.onMediaDelete = functions.firestore
  .document('media/{mediaId}')
  .onDelete(async (snap, context) => {
    const data = snap.data();
    
    functions.logger.info(`Media deleted: ${context.params.mediaId}, auto-cleaning Cloudinary assets...`);

    let publicId = null;

    // Check for imagePath (stored publicId)
    if (data.imagePath) {
      publicId = data.imagePath;
    }
    // Fallback to extracting from imageUrl
    else if (data.imageUrl) {
      publicId = extractPublicIdFromUrl(data.imageUrl);
    }

    if (publicId) {
      try {
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: 'image',
          invalidate: true
        });
        functions.logger.info(`Auto-deleted media asset ${publicId}:`, result.result);
      } catch (error) {
        functions.logger.error(`Failed to auto-delete media ${publicId}:`, error);
      }
    } else {
      functions.logger.info('No Cloudinary asset found to delete');
    }
  });

/**
 * Firestore Trigger: Auto-delete hero gallery images when updated
 */
exports.onHeroUpdate = functions.firestore
  .document('hero_section/{docId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    functions.logger.info(`Hero section updated: ${context.params.docId}, checking for removed assets...`);

    // Check for removed gallery images
    if (before.images && after.images) {
      const removedImages = before.images.filter(img => !after.images.includes(img));
      
      if (removedImages.length > 0) {
        functions.logger.info(`Found ${removedImages.length} removed gallery image(s)`);
        
        for (const url of removedImages) {
          const publicId = extractPublicIdFromUrl(url);
          if (publicId) {
            try {
              const result = await cloudinary.uploader.destroy(publicId, {
                resource_type: 'image',
                invalidate: true
              });
              functions.logger.info(`Auto-deleted gallery image ${publicId}:`, result.result);
            } catch (error) {
              functions.logger.error(`Failed to auto-delete gallery image ${publicId}:`, error);
            }
          }
        }
      }
    }

    // Check for replaced video
    if (before.video?.src && after.video?.src && before.video.src !== after.video.src) {
      const publicId = extractPublicIdFromUrl(before.video.src);
      if (publicId) {
        try {
          const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'video',
            invalidate: true
          });
          functions.logger.info(`Auto-deleted hero video ${publicId}:`, result.result);
        } catch (error) {
          functions.logger.error(`Failed to auto-delete hero video ${publicId}:`, error);
        }
      }
    }
  });

/**
 * Helper function to extract publicId from Cloudinary URL
 */
function extractPublicIdFromUrl(url) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    // Example URL: https://res.cloudinary.com/dvaoenkgr/image/upload/v1234567890/hoardings/image.jpg
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const pathAfterUpload = parts[1];
    
    // Remove version number (v1234567890)
    const pathParts = pathAfterUpload.split('/');
    const relevantParts = pathParts.filter(part => !part.match(/^v\d+$/));

    // Join and remove file extension
    const publicId = relevantParts.join('/').replace(/\.[^/.]+$/, '');
    
    return publicId;
  } catch (error) {
    functions.logger.error('Error extracting publicId from URL:', error);
    return null;
  }
}
