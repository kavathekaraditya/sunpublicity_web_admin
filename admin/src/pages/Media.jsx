import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Edit2,
  X,
  Plus,
  Save,
  Loader,
  CheckCircle,
  AlertCircle,
  Building2, 
  Truck, 
  ShoppingBag, 
  Calendar, 
  Zap, 
  Briefcase,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  subscribeToMedia,
  createMedia,
  updateMedia,
  deleteMedia,
  uploadMediaImage
} from '../services/mediaService';

const Media = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState('downtown');
  const [showModal, setShowModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('');
  const [editingMedia, setEditingMedia] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    imageUrl: '',
    imagePath: ''
  });

  const sections = [
    { 
      id: 'downtown', 
      name: 'Downtown Billboard', 
      icon: Building2, 
      color: 'blue',
      description: 'Premium urban advertising spaces in downtown areas'
    },
    { 
      id: 'highway', 
      name: 'Highway Display', 
      icon: Truck, 
      color: 'green',
      description: 'High-visibility billboards along major highways'
    },
    { 
      id: 'shopping', 
      name: 'Shopping Mall', 
      icon: ShoppingBag, 
      color: 'purple',
      description: 'Indoor and outdoor mall advertising boards'
    },
    { 
      id: 'event', 
      name: 'Event Promotion', 
      icon: Calendar, 
      color: 'yellow',
      description: 'Temporary displays for events and promotions'
    },
    { 
      id: 'citycenter', 
      name: 'City Center LED', 
      icon: Zap, 
      color: 'red',
      description: 'Digital LED screens in prime city locations'
    },
    { 
      id: 'corporate', 
      name: 'Corporate Space', 
      icon: Briefcase, 
      color: 'indigo',
      description: 'Professional advertising in corporate areas'
    }
  ];

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToMedia((mediaData) => {
      setMedia(mediaData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Show message helper
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Open modal for adding new media
  const handleAddMedia = (category) => {
    setCurrentCategory(category);
    setEditingMedia(null);
    setFormData({
      title: '',
      category: category,
      description: '',
      imageUrl: '',
      imagePath: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  // Handle edit
  const handleEdit = (item) => {
    setCurrentCategory(item.category);
    setEditingMedia(item);
    setFormData({
      title: item.title || '',
      category: item.category || '',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      imagePath: item.imagePath || ''
    });
    setImagePreview(item.imageUrl || null);
    setShowModal(true);
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setUploading(true);
      let imageUrl = formData.imageUrl;
      let imagePath = formData.imagePath;

      // Upload new image if selected
      if (imageFile) {
        const { url, path } = await uploadMediaImage(imageFile);
        imageUrl = url;
        imagePath = path;
      }

      const mediaData = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        imageUrl,
        imagePath
      };

      if (editingMedia) {
        await updateMedia(editingMedia.id, mediaData);
        showMessage('success', 'Media updated successfully!');
      } else {
        await createMedia(mediaData);
        showMessage('success', 'Media created successfully!');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving media:', error);
      showMessage('error', 'Failed to save media');
    } finally {
      setUploading(false);
    }
  };

  // Handle delete
  const handleDelete = async (item) => {
    if (!window.confirm('Are you sure you want to delete this media?')) return;

    try {
      await deleteMedia(item.id, item.imagePath);
      showMessage('success', 'Media deleted successfully!');
    } catch (error) {
      console.error('Error deleting media:', error);
      showMessage('error', 'Failed to delete media');
    }
  };

  // Reset form
  const resetForm = () => {
    setShowModal(false);
    setEditingMedia(null);
    setCurrentCategory('');
    setFormData({
      title: '',
      category: '',
      description: '',
      imageUrl: '',
      imagePath: ''
    });
    setImageFile(null);
    setImagePreview(null);
  };

  // Toggle section
  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  // Get media by category
  const getMediaByCategory = (categoryId) => {
    return media.filter(item => item.category === categoryId);
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
            <ImageIcon className="w-8 h-8 mr-3 text-primary-600" />
            Media Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage media across different categories with dedicated sections
          </p>
        </div>
      </div>

      {/* Message Alert */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`flex items-center gap-2 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          const count = getMediaByCategory(section.id).length;
          
          return (
            <Card key={section.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-6 h-6 text-${section.color}-600`} />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{count}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{section.name}</p>
            </Card>
          );
        })}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;
          const categoryMedia = getMediaByCategory(section.id);
          
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Section Header */}
              <div
                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-l-4 border-${section.color}-600`}
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Icon className={`w-6 h-6 text-${section.color}-600`} />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{section.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{section.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-${section.color}-100 text-${section.color}-700 dark:bg-${section.color}-900/30 dark:text-${section.color}-400`}>
                    {categoryMedia.length} items
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddMedia(section.id);
                    }}
                    className={`flex items-center space-x-1 px-3 py-1.5 bg-${section.color}-600 hover:bg-${section.color}-700 text-white rounded-lg transition-colors text-sm`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                  
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>

              {/* Section Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-4">
                      {categoryMedia.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {categoryMedia.map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Card className="overflow-hidden group">
                                <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ImageIcon className="w-16 h-16 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="p-3">
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                                    {item.title}
                                  </h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                    {item.description || 'No description'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                                    {item.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                                  </p>
                                  
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleEdit(item)}
                                      className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDelete(item)}
                                      className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No media in this section
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Add your first {section.name.toLowerCase()} media item
                          </p>
                          <button
                            onClick={() => handleAddMedia(section.id)}
                            className={`inline-flex items-center space-x-2 bg-${section.color}-600 hover:bg-${section.color}-700 text-white px-4 py-2 rounded-lg transition-colors`}
                          >
                            <Plus className="w-5 h-5" />
                            <span>Add Media</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

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
              className="w-full max-w-2xl"
            >
              <Card className="p-6 my-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingMedia ? 'Edit Media' : 'Add New Media'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                      placeholder="Enter media title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                      disabled={!!currentCategory}
                    >
                      <option value="">Select a category</option>
                      {sections.map(section => (
                        <option key={section.id} value={section.id}>{section.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                      placeholder="Enter media description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Image {!editingMedia && '*'}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required={!editingMedia}
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

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
                          <span>{editingMedia ? 'Update' : 'Create'}</span>
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
    </div>
  );
};

export default Media;
