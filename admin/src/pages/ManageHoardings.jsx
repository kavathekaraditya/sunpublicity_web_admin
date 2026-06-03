import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  collectionGroup,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { uploadToCloudinary, extractPublicId } from '../config/cloudinary';
import {
  createHoarding,
  updateHoarding,
  deleteHoarding
} from '../utils/hoardingHelpers';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Save,
  Loader,
  X,
  Search,
  MapPin,
  IndianRupee,
  Maximize2,
  Image as ImageIcon,
  Star,
  TrendingUp,
  Eye,
  Tag,
  Zap,
  Calendar,
  CheckCircle,
  AlertCircle,
  Upload,
  Filter,
  FolderOpen
} from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const ManageHoardings = () => {
  // State Management
  const [hoardings, setHoardings] = useState([]);
  const [filteredHoardings, setFilteredHoardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingHoarding, setEditingHoarding] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Multiple images state
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Category Management State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    icon: 'billboard',
    active: true,
    order: 0
  });
  const [editingCategory, setEditingCategory] = useState(null);

  // Form State with Advanced Features
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    latitude: '',
    longitude: '',
    size: '',
    price: '',
    availability: true,
    imageUrl: '',
    // Advanced Features
    visibilityScore: 85,
    rating: 0,
    tags: [],
    bookingRate: 'medium',
    views: 0,
    trending: false,
    description: '',
    category: ''
  });

  // Filter State
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    availability: 'all',
    category: 'all',
    minRating: 0,
    trending: false
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Available Tags
  const availableTags = ['New', 'Discount', 'Premium', 'Hot Deal', 'Limited'];
  const [categories, setCategories] = useState([]);
  const bookingRates = ['low', 'medium', 'high'];

  // Icon options for categories
  const iconOptions = [
    { key: 'billboard', label: 'Billboard' },
    { key: 'monitor', label: 'Digital Screen' },
    { key: 'bus', label: 'Bus/Transit' },
    { key: 'building', label: 'Building' },
    { key: 'map-pin', label: 'Location' },
    { key: 'zap', label: 'Premium' },
    { key: 'tag', label: 'Tag' },
    { key: 'trending-up', label: 'Trending' }
  ];

  // Fetch Categories from Firestore
  useEffect(() => {
    const categoriesRef = collection(db, 'categories');

    const unsubscribe = onSnapshot(categoriesRef,
      (snapshot) => {
        const categoriesData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            name: doc.id // Document ID is the category name
          }))
          .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

        setCategories(categoriesData);
      },
      (error) => {
        console.error('Error fetching categories:', error);
        showMessage('error', 'Failed to fetch categories from Firestore');
        setCategories([]);
      }
    );

    return () => unsubscribe();
  }, []);

  // Set default category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData(prev => ({
        ...prev,
        category: categories[0].name
      }));
    }
  }, [categories]);

  // Real-time Data Fetching with onSnapshot using collectionGroup
  useEffect(() => {
    // Fetch from category-based structure: categories/{categoryName}/hoardings/{hoardingId}
    const q = query(collectionGroup(db, 'hoardings'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const hoardingsData = snapshot.docs.map(doc => {
          // Extract categoryName from document path
          const pathParts = doc.ref.path.split('/');
          const categoryName = pathParts[1];

          return {
            id: doc.id,
            categoryName,
            ...doc.data(),
            availability: doc.data().availability === true
          };
        });

        // Sort by createdAt in memory (descending)
        hoardingsData.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        setHoardings(hoardingsData);
        setFilteredHoardings(hoardingsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching hoardings:', error);
        showMessage('error', 'Failed to fetch hoardings');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Search and Filter Logic
  useEffect(() => {
    let result = hoardings;

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(h =>
        h.title?.toLowerCase().includes(term) ||
        h.location?.toLowerCase().includes(term) ||
        h.description?.toLowerCase().includes(term)
      );
    }

    // Price Filter
    if (filters.minPrice) {
      result = result.filter(h => h.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      result = result.filter(h => h.price <= Number(filters.maxPrice));
    }

    // Availability Filter
    if (filters.availability !== 'all') {
      const isAvailable = filters.availability === 'available';
      result = result.filter(h => (h.availability !== false) === isAvailable);
    }

    // Category Filter
    if (filters.category !== 'all') {
      result = result.filter(h => h.category === filters.category);
    }

    // Rating Filter
    if (filters.minRating > 0) {
      result = result.filter(h => (h.rating || 0) >= filters.minRating);
    }

    // Trending Filter
    if (filters.trending) {
      result = result.filter(h => h.trending === true);
    }

    setFilteredHoardings(result);
    setCurrentPage(1);
  }, [searchTerm, hoardings, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredHoardings.length / itemsPerPage);
  const paginatedHoardings = filteredHoardings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Message Display
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Image Handling - Multiple Images
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + imageFiles.length > 5) {
      showMessage('error', 'You can only upload up to 5 images');
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      showMessage('error', 'Please upload only image files (JPEG, PNG, WebP)');
      return;
    }

    // Validate file sizes (max 5MB per image)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      showMessage('error', 'Each image must be less than 5MB');
      return;
    }

    setImageFiles([...imageFiles, ...files]);

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviewUrls]);
    
    showMessage('success', `${files.length} image(s) selected successfully`);
  };

  const removeImage = (index) => {
    const newImages = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(newImages);
    setImagePreviews(newPreviews);
  };

  // Upload Images to Cloudinary
  const uploadImages = async () => {
    if (imageFiles.length === 0) {
      console.log('No new image files, returning existing URLs:', formData.imageUrls || []);
      return formData.imageUrls || [];
    }

    try {
      setUploading(true);
      console.log(`Starting upload of ${imageFiles.length} images to Cloudinary...`);

      const uploadedUrls = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        console.log(`Uploading image ${i + 1}/${imageFiles.length}:`, file.name);
        
        const result = await uploadToCloudinary(file);
        uploadedUrls.push(result.url);
        console.log(`Image ${i + 1} uploaded:`, result.url);
      }

      showMessage('success', `✅ ${uploadedUrls.length} image(s) uploaded successfully`);
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      showMessage('error', `❌ Upload failed: ${error.message}`);
      throw new Error(`Failed to upload images: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Delete Image from Cloudinary
  const deleteImageFromStorage = async (imageUrl) => {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      console.log('No valid Cloudinary URL to delete');
      return;
    }

    try {
      console.log('Image URL to delete:', imageUrl);
      const publicId = extractPublicId(imageUrl);
      console.log('Extracted public ID:', publicId);

      // Note: Client-side deletion is not recommended for Cloudinary
      // The image will remain in Cloudinary but won't be referenced in the database
      console.log('Image reference removed from database. Image remains in Cloudinary.');
    } catch (error) {
      console.log('Error processing image deletion:', error.message);
      // Don't throw error, just log it
    }
  };

  // Form Handlers
  const handleAddHoarding = () => {
    setEditingHoarding(null);
    setFormData({
      title: '',
      location: '',
      latitude: '',
      longitude: '',
      size: '',
      price: '',
      availability: true,
      imageUrl: '',
      imageUrls: [],
      visibilityScore: 85,
      rating: 0,
      tags: [],
      bookingRate: 'medium',
      views: 0,
      trending: false,
      description: '',
      category: categories.length > 0 ? categories[0].name : ''
    });
    setImageFile(null);
    setImagePreview(null);
    setImageFiles([]);
    setImagePreviews([]);
    setShowModal(true);
  };

  const handleEdit = (hoarding) => {
    setEditingHoarding(hoarding);
    setFormData({
      title: hoarding.title || '',
      location: hoarding.location || '',
      latitude: hoarding.latitude || '',
      longitude: hoarding.longitude || '',
      size: hoarding.size || '',
      price: hoarding.price || '',
      availability: hoarding.availability !== false,
      imageUrl: hoarding.imageUrl || '',
      imageUrls: hoarding.imageUrls || [],
      visibilityScore: hoarding.visibilityScore || 85,
      rating: hoarding.rating || 0,
      tags: hoarding.tags || [],
      bookingRate: hoarding.bookingRate || 'medium',
      views: hoarding.views || 0,
      trending: hoarding.trending || false,
      description: hoarding.description || '',
      category: hoarding.category || 'Downtown Billboard'
    });
    setImagePreview(hoarding.imageUrl || null);
    setImageFile(null);
    setImageFiles([]);
    setImagePreviews(hoarding.imageUrls || []);
    setShowModal(true);
  };

  const handleDelete = async (hoarding) => {
    if (!window.confirm('Are you sure you want to delete this hoarding?')) return;

    try {
      // Delete image from storage
      if (hoarding.imageUrl) {
        await deleteImageFromStorage(hoarding.imageUrl);
      }

      // Delete document from Firestore using category-based structure
      const categoryName = hoarding.category || hoarding.categoryName;
      await deleteHoarding(categoryName, hoarding.id);
      showMessage('success', 'Hoarding deleted successfully');
    } catch (error) {
      console.error('Error deleting hoarding:', error);
      showMessage('error', `Failed to delete hoarding: ${error.message}`);
    }
  };

  // Form Validation
  const validateForm = () => {
    if (!formData.title.trim()) {
      showMessage('error', 'Title is required');
      return false;
    }
    if (!formData.location.trim()) {
      showMessage('error', 'Location is required');
      return false;
    }
    if (!formData.size.trim()) {
      showMessage('error', 'Size is required');
      return false;
    }

    const priceValue = parseFloat(formData.price);
    if (isNaN(priceValue) || priceValue < 0) {
      showMessage('error', 'Please enter a valid price');
      return false;
    }

    return true;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    console.log('Selected category:', formData.category);

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    try {
      setUploading(true);
      console.log('Starting save process...');
      console.log('Current form data:', formData);

      // Upload new images if selected
      console.log('Uploading images...');
      const imageUrls = await uploadImages();
      console.log('Image URLs after upload:', imageUrls);

      const hoardingData = {
        ...formData,
        price: parseFloat(formData.price),
        visibilityScore: parseInt(formData.visibilityScore) || 85,
        rating: parseFloat(formData.rating) || 0,
        views: parseInt(formData.views) || 0,
        imageUrls,
        imageUrl: imageUrls.length > 0 ? imageUrls[0] : '', // Keep first image as primary for backward compatibility
      };

      console.log('Hoarding data before cleanup:', hoardingData);

      // Remove undefined values
      Object.keys(hoardingData).forEach(key => {
        if (hoardingData[key] === undefined || hoardingData[key] === '') {
          delete hoardingData[key];
        }
      });

      console.log('Hoarding data after cleanup:', hoardingData);

      // Get category name from form data
      const categoryName = formData.category;

      if (!categoryName) {
        showMessage('error', '❌ Category is required');
        setUploading(false);
        return;
      }

      console.log('Using category:', categoryName);

      if (editingHoarding) {
        console.log('Updating existing hoarding:', editingHoarding.id);

        // Delete old images if new ones uploaded
        if (imageFiles.length > 0 && editingHoarding.imageUrls) {
          console.log('Deleting old images...');
          for (const oldUrl of editingHoarding.imageUrls) {
            await deleteImageFromStorage(oldUrl);
          }
        }

        // Update using category-based structure
        await updateHoarding(categoryName, editingHoarding.id, {
          ...hoardingData,
          updatedAt: serverTimestamp(),
        });
        console.log('Hoarding updated successfully');
        showMessage('success', '✅ Hoarding updated successfully');
      } else {
        console.log('Creating new hoarding in category:', categoryName);

        // Create using category-based structure
        const newHoarding = await createHoarding(categoryName, {
          ...hoardingData,
          createdAt: serverTimestamp(),
        });
        console.log('Hoarding created with ID:', newHoarding.id);
        showMessage('success', '✅ Hoarding added successfully');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving hoarding:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      if (error.code === 'permission-denied') {
        showMessage('error', '❌ Permission denied: Please check Firestore rules and ensure they are deployed');
      } else if (error.code === 'not-found') {
        showMessage('error', '❌ Category not found: Please ensure the category exists');
      } else {
        showMessage('error', `❌ Failed to save hoarding: ${error.message}`);
      }
    } finally {
      setUploading(false);
      console.log('Save process completed');
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingHoarding(null);
    setFormData({
      title: '',
      location: '',
      latitude: '',
      longitude: '',
      size: '',
      price: '',
      availability: true,
      imageUrl: '',
      imageUrls: [],
      visibilityScore: 85,
      rating: 0,
      tags: [],
      bookingRate: 'medium',
      views: 0,
      trending: false,
      description: '',
      category: categories.length > 0 ? categories[0].name : ''
    });
    setImageFile(null);
    setImagePreview(null);
    setImageFiles([]);
    setImagePreviews([]);
  };

  // Category Management Functions
  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      icon: 'billboard',
      active: true,
      order: categories.length + 1
    });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      icon: category.icon || 'billboard',
      active: category.active !== undefined ? category.active : true,
      order: category.order || 0
    });
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Are you sure you want to delete "${category.name}"? This will also delete all hoardings in this category.`)) return;

    try {
      // Delete the category document
      await deleteDoc(doc(db, 'categories', category.id));
      showMessage('success', 'Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      showMessage('error', `Failed to delete category: ${error.message}`);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();

    if (!categoryFormData.name.trim()) {
      showMessage('error', 'Category name is required');
      return;
    }

    try {
      const categoryName = categoryFormData.name.trim();
      const categoryData = {
        name: categoryName,
        icon: categoryFormData.icon || 'billboard',
        active: categoryFormData.active !== undefined ? categoryFormData.active : true,
        order: parseInt(categoryFormData.order) || 0,
        createdAt: serverTimestamp()
      };

      if (editingCategory) {
        // Update existing category
        const oldCategoryId = editingCategory.id;

        if (oldCategoryId !== categoryName) {
          // If name changed, create new category document
          await setDoc(doc(db, 'categories', categoryName), categoryData);
          // Note: Old category and its hoardings remain unchanged
          showMessage('success', 'Category created with new name');
        } else {
          // Update existing category document
          await setDoc(doc(db, 'categories', categoryName), categoryData);
          showMessage('success', 'Category updated successfully');
        }
      } else {
        // Create new category
        await setDoc(doc(db, 'categories', categoryName), categoryData);
        showMessage('success', 'Category added successfully');
      }

      setShowCategoryModal(false);
      setCategoryFormData({
        name: '',
        icon: 'billboard',
        active: true,
        order: 0
      });
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
      showMessage('error', `Failed to save category: ${error.message}`);
    }
  };

  const resetCategoryForm = () => {
    setShowCategoryModal(false);
    setCategoryFormData({
      name: '',
      icon: 'billboard',
      active: true,
      order: 0
    });
    setEditingCategory(null);
  };

  // Tag Toggle
  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Building2 className="w-8 h-8 mr-3 text-primary-600" />
            Manage Hoardings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time hoarding management with advanced features
          </p>
        </div>
        <button
          onClick={handleAddHoarding}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Hoarding</span>
        </button>
        <button
          onClick={handleAddCategory}
          className="flex items-center space-x-2 bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FolderOpen className="w-5 h-5" />
          <span>Manage Categories</span>
        </button>
      </div>

      {/* Success/Error Message */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`flex items-center gap-2 p-4 rounded-lg ${message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters */}
      <Card className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, location, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Max Price"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <select
            value={filters.availability}
            onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          <select
            value={filters.minRating}
            onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="0">All Ratings</option>
            <option value="1">1+ Stars</option>
            <option value="2">2+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="4">4+ Stars</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.trending}
              onChange={(e) => setFilters({ ...filters, trending: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Show Trending Only</span>
          </label>

          <button
            onClick={() => setFilters({ minPrice: '', maxPrice: '', availability: 'all', category: 'all', minRating: 0, trending: false })}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Clear Filters
          </button>
        </div>
      </Card>

      {/* Hoardings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedHoardings.map((hoarding, index) => (
          <motion.div
            key={hoarding.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                {hoarding.imageUrl ? (
                  <img
                    src={hoarding.imageUrl}
                    alt={hoarding.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${hoarding.availability
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                    }`}>
                    {hoarding.availability ? 'Available' : 'Unavailable'}
                  </span>
                  {hoarding.trending && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-500 text-white flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Trending
                    </span>
                  )}
                </div>

                {/* Tags */}
                {hoarding.tags && hoarding.tags.length > 0 && (
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    {hoarding.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500 text-white">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {hoarding.title}
                </h3>

                {/* Description */}
                {hoarding.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {hoarding.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                    {hoarding.rating || 0} Rating
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Eye className="w-4 h-4 mr-1 text-blue-500" />
                    {hoarding.views || 0} Views
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Zap className="w-4 h-4 mr-1 text-purple-500" />
                    {hoarding.visibilityScore || 85}% Visibility
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <TrendingUp className={`w-4 h-4 mr-1 ${hoarding.bookingRate === 'high' ? 'text-green-500' :
                      hoarding.bookingRate === 'medium' ? 'text-yellow-500' :
                        'text-gray-500'
                      }`} />
                    {hoarding.bookingRate || 'medium'}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mr-2" />
                    {hoarding.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Maximize2 className="w-4 h-4 mr-2" />
                    {hoarding.size}
                  </div>
                  <div className="flex items-center text-sm font-semibold text-primary-600 dark:text-primary-400">
                    <IndianRupee className="w-4 h-4 mr-1" />
                    ₹{hoarding.price?.toLocaleString('en-IN')}/month
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleEdit(hoarding)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(hoarding)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredHoardings.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hoardings found</p>
          <button
            onClick={handleAddHoarding}
            className="mt-4 inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add First Hoarding</span>
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl"
            >
              <Card className="p-6 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingHoarding ? 'Edit Hoarding' : 'Add New Hoarding'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Category *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Describe the hoarding location, features, etc."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Location *
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Size *
                        </label>
                        <input
                          type="text"
                          value={formData.size}
                          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                          placeholder="e.g., 20x10 ft"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Price (₹/month) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">₹</span>
                          <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="50000"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            required
                            min="0"
                            step="1000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                          placeholder="e.g. 19.0760"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                          placeholder="e.g. 72.8777"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Advanced Features */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Advanced Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Visibility Score (%)
                        </label>
                        <input
                          type="number"
                          value={formData.visibilityScore}
                          onChange={(e) => setFormData({ ...formData, visibilityScore: e.target.value })}
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Rating (0-5)
                        </label>
                        <input
                          type="number"
                          value={formData.rating}
                          onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                          min="0"
                          max="5"
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Booking Rate
                        </label>
                        <select
                          value={formData.bookingRate}
                          onChange={(e) => setFormData({ ...formData, bookingRate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        >
                          {bookingRates.map(rate => (
                            <option key={rate} value={rate}>{rate.charAt(0).toUpperCase() + rate.slice(1)}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Views
                        </label>
                        <input
                          type="number"
                          value={formData.views}
                          onChange={(e) => setFormData({ ...formData, views: e.target.value })}
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {availableTags.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${formData.tags.includes(tag)
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload - Multiple Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Images (Up to 5 images for different angles)
                    </label>
                    
                    {/* Image Upload Button */}
                    <div className="mb-3">
                      <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
                        <Upload className="w-5 h-5 mr-2 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {imageFiles.length === 0 && imagePreviews.length === 0
                            ? 'Click to upload images'
                            : `${imageFiles.length + imagePreviews.length}/5 images selected`}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={imageFiles.length + imagePreviews.length >= 5}
                        />
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Max 5 images, each up to 5MB (JPEG, PNG, WebP)
                      </p>
                    </div>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {imagePreviews.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-0.5 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Availability and Trending */}
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.availability}
                        onChange={(e) => setFormData({ ...formData, availability: e.target.checked })}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Available for Booking</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.trending}
                        onChange={(e) => setFormData({ ...formData, trending: e.target.checked })}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Mark as Trending</span>
                    </label>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>{editingHoarding ? 'Update' : 'Add'} Hoarding</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Management Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingCategory ? 'Edit Category' : 'Manage Categories'}
                  </h2>
                  <button
                    onClick={resetCategoryForm}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Category Form */}
                <form onSubmit={handleSaveCategory} className="mb-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        value={categoryFormData.name}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                        placeholder="e.g., Auto Promotion"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Icon *
                        </label>
                        <select
                          value={categoryFormData.icon}
                          onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        >
                          {iconOptions.map(option => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Display Order
                        </label>
                        <input
                          type="number"
                          value={categoryFormData.order}
                          onChange={(e) => setCategoryFormData({ ...categoryFormData, order: e.target.value })}
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="categoryActive"
                        checked={categoryFormData.active}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, active: e.target.checked })}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="categoryActive" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                        Active (show on website)
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingCategory ? 'Update Category' : 'Add Category'}
                    </button>
                  </div>
                </form>

                {/* Categories List */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Existing Categories
                  </h3>
                  {categories.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      No categories yet. Add your first category above.
                    </p>
                  ) : (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {categories.map(category => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <span className="text-gray-900 dark:text-white font-medium">
                            {category.name}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="Edit category"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageHoardings;
