import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadToCloudinary, extractPublicId } from '../config/cloudinary';

const MEDIA_COLLECTION = 'media';

// Get all media items
export const getAllMedia = async () => {
  try {
    const q = query(collection(db, MEDIA_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting media:', error);
    throw error;
  }
};

// Get single media item
export const getMediaById = async (id) => {
  try {
    const docRef = doc(db, MEDIA_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Media not found');
    }
  } catch (error) {
    console.error('Error getting media:', error);
    throw error;
  }
};

// Upload image to Cloudinary
export const uploadMediaImage = async (file) => {
  try {
    const result = await uploadToCloudinary(file);
    return { url: result.url, path: result.publicId };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Delete image from Cloudinary
export const deleteMediaImage = async (imagePath) => {
  try {
    if (imagePath) {
      console.log('Image reference removed. Public ID:', imagePath);
      // Note: Client-side deletion is not recommended for Cloudinary
      // The image will remain in Cloudinary but won't be referenced in the database
    }
  } catch (error) {
    console.error('Error processing image deletion:', error);
    // Don't throw error
  }
};

// Create new media item
export const createMedia = async (mediaData) => {
  try {
    const docRef = await addDoc(collection(db, MEDIA_COLLECTION), {
      ...mediaData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating media:', error);
    throw error;
  }
};

// Update media item
export const updateMedia = async (id, mediaData) => {
  try {
    const docRef = doc(db, MEDIA_COLLECTION, id);
    await updateDoc(docRef, {
      ...mediaData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating media:', error);
    throw error;
  }
};

// Delete media item
export const deleteMedia = async (id, imagePath) => {
  try {
    // Delete image from storage first
    if (imagePath) {
      await deleteMediaImage(imagePath);
    }

    // Delete document from Firestore
    await deleteDoc(doc(db, MEDIA_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
};

// Real-time listener for media collection
export const subscribeToMedia = (callback) => {
  const q = query(collection(db, MEDIA_COLLECTION), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (querySnapshot) => {
    const media = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(media);
  }, (error) => {
    console.error('Error listening to media:', error);
  });
};

// Get media by category
export const getMediaByCategory = async (category) => {
  try {
    const allMedia = await getAllMedia();
    if (category === 'all') {
      return allMedia;
    }
    return allMedia.filter(item => item.category === category);
  } catch (error) {
    console.error('Error getting media by category:', error);
    throw error;
  }
};

// Search media by title
export const searchMedia = async (searchTerm) => {
  try {
    const allMedia = await getAllMedia();
    if (!searchTerm) return allMedia;

    const term = searchTerm.toLowerCase();
    return allMedia.filter(item =>
      item.title?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error('Error searching media:', error);
    throw error;
  }
};
