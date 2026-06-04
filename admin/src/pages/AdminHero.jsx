import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import {
    Monitor,
    Save,
    Video,
    Layers,
    MousePointer,
    AlertCircle,
    CheckCircle,
    Eye,
    Upload
} from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import { uploadToCloudinary } from '../config/cloudinary';

const AdminHero = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [galleryImages, setGalleryImages] = useState([]);

    // Initial State matching schema
    const [formData, setFormData] = useState({
        video: {
            src: '',
            filters: {
                brightness: 1,
                contrast: 1,
                saturate: 1
            }
        },
        overlay: {
            enabled: true,
            from: 'black/60', // Default tailwind black with opacity
            via: 'black/40',
            to: 'transparent'
        },
        cta: {
            text: 'Search Media',
            link: '/hoardings',
            bgColor: 'bg-primary-600',
            hoverColor: 'hover:bg-primary-700',
            textColor: 'text-white'
        }
    });

    // Valid Tailwind Options
    const bgColors = [
        'bg-primary-600', 'bg-blue-600', 'bg-red-600', 'bg-green-600',
        'bg-yellow-500', 'bg-purple-600', 'bg-gray-900', 'bg-white', 'bg-transparent'
    ];

    const hoverColors = [
        'hover:bg-primary-700', 'hover:bg-blue-700', 'hover:bg-red-700', 'hover:bg-green-700',
        'hover:bg-yellow-600', 'hover:bg-purple-700', 'hover:bg-gray-800', 'hover:bg-gray-100', 'hover:opacity-90'
    ];

    const textColors = [
        'text-white', 'text-gray-900', 'text-gray-200', 'text-primary-600'
    ];

    useEffect(() => {
        fetchHeroData();
    }, []);

    const fetchHeroData = async () => {
        try {
            setLoading(true);
            const docRef = doc(db, 'hero_section', 'main');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                // Merge with default state to ensure structure
                setFormData(prev => ({
                    ...prev,
                    ...data,
                    video: { ...prev.video, ...data.video, filters: { ...prev.video.filters, ...data.video?.filters } },
                    overlay: { ...prev.overlay, ...data.overlay },
                    cta: { ...prev.cta, ...data.cta }
                }));
            }

            const galleryRef = doc(db, 'hero_section', 'gallery');
            const gallerySnap = await getDoc(galleryRef);
            if (gallerySnap.exists()) {
                setGalleryImages(gallerySnap.data().images || []);
            }
        } catch (error) {
            console.error('Error fetching hero data:', error);
            showMessage('error', 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (section, field, value, subField = null) => {
        setFormData(prev => {
            if (section === 'video' && subField) {
                return {
                    ...prev,
                    video: {
                        ...prev.video,
                        filters: {
                            ...prev.video.filters,
                            [field]: parseFloat(value)
                        }
                    }
                };
            }
            if (section === 'video' && !subField) {
                return {
                    ...prev,
                    video: {
                        ...prev.video,
                        [field]: value
                    }
                };
            }
            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            };
        });
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('video/')) {
            showMessage('error', 'Please upload a valid video file');
            return;
        }

        // Size validation (e.g. 100MB max)
        if (file.size > 100 * 1024 * 1024) {
            showMessage('error', 'Video size must be less than 100MB');
            return;
        }

        try {
            setUploading(true);
            showMessage('success', 'Starting upload...');

            const result = await uploadToCloudinary(file);

            setFormData(prev => ({
                ...prev,
                video: {
                    ...prev.video,
                    src: result.url
                }
            }));

            showMessage('success', 'Video uploaded successfully');
        } catch (error) {
            console.error('Upload failed:', error);
            showMessage('error', 'Failed to upload video');
        } finally {
            setUploading(false);
            // Reset file input
            e.target.value = '';
        }
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                showMessage('error', `File ${file.name} is not a valid image`);
                return false;
            }
            if (file.size > 10 * 1024 * 1024) {
                showMessage('error', `Image ${file.name} is too large (> 10MB)`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        try {
            setUploading(true);
            showMessage('success', `Uploading ${validFiles.length} image(s)...`);

            const uploadPromises = validFiles.map(file => uploadToCloudinary(file));
            const results = await Promise.all(uploadPromises);

            const urls = results.map(r => r.url);
            setGalleryImages(prev => [...prev, ...urls]);
            showMessage('success', 'Images uploaded successfully');
        } catch (error) {
            console.error('Upload failed:', error);
            showMessage('error', 'Failed to upload one or more images');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleRemoveGalleryImage = (index) => {
        setGalleryImages(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const docRef = doc(db, 'hero_section', 'main');

            await setDoc(docRef, {
                ...formData,
                updatedAt: serverTimestamp()
            });

            const galleryRef = doc(db, 'hero_section', 'gallery');
            await setDoc(galleryRef, {
                images: galleryImages,
                updatedAt: serverTimestamp()
            });

            showMessage('success', 'Hero settings and Gallery saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            showMessage('error', 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Monitor className="w-8 h-8 mr-3 text-primary-600" />
                        Hero Section Settings
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your website's main banner visuals and actions
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors shadow-sm"
                >
                    {saving ? <LoadingSpinner size="sm" color="text-white" /> : <Save className="w-5 h-5" />}
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
            </div>

            {/* Success/Error Message */}
            {message.text && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Video Settings */}
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6 pb-2 border-b dark:border-gray-700">
                        <Video className="w-5 h-5 text-primary-600" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Video Configuration</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Background Video URL
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.video.src}
                                    onChange={(e) => handleChange('video', 'src', e.target.value)}
                                    placeholder="https://example.com/video.mp4"
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                />
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoUpload}
                                        className="hidden"
                                        id="video-upload"
                                        disabled={uploading}
                                    />
                                    <label
                                        htmlFor="video-upload"
                                        className={`flex items-center justify-center px-4 py-2 bg-secondary-600 text-white rounded-lg cursor-pointer hover:bg-secondary-700 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {uploading ? <LoadingSpinner size="sm" color="text-white" /> : <Upload className="w-5 h-5" />}
                                        <span className="ml-2 hidden sm:inline">Upload</span>
                                    </label>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Direct link to MP4/WebM file or upload from computer (Max 100MB).</p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Visual Filters</h3>

                            {['brightness', 'contrast', 'saturate'].map((filter) => (
                                <div key={filter}>
                                    <div className="flex justify-between mb-1">
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">{filter}</label>
                                        <span className="text-xs text-gray-500">{formData.video.filters[filter]}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        value={formData.video.filters[filter]}
                                        onChange={(e) => handleChange('video', filter, e.target.value, true)}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-600"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>


                {/* CTA Settings */}
                <Card className="p-6 md:col-span-2 xl:col-span-2">
                    <div className="flex items-center gap-2 mb-6 pb-2 border-b dark:border-gray-700">
                        <MousePointer className="w-5 h-5 text-primary-600" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Call to Action (Button)</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Button Text
                                </label>
                                <input
                                    type="text"
                                    value={formData.cta.text}
                                    onChange={(e) => handleChange('cta', 'text', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Link URL
                                </label>
                                <input
                                    type="text"
                                    value={formData.cta.link}
                                    onChange={(e) => handleChange('cta', 'link', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background</label>
                                    <select
                                        value={formData.cta.bgColor}
                                        onChange={(e) => handleChange('cta', 'bgColor', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                                    >
                                        {bgColors.map(c => <option key={c} value={c}>{c.replace('bg-', '')}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hover</label>
                                    <select
                                        value={formData.cta.hoverColor}
                                        onChange={(e) => handleChange('cta', 'hoverColor', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                                    >
                                        {hoverColors.map(c => <option key={c} value={c}>{c.replace('hover:bg-', '')}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Color</label>
                                    <select
                                        value={formData.cta.textColor}
                                        onChange={(e) => handleChange('cta', 'textColor', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                                    >
                                        {textColors.map(c => <option key={c} value={c}>{c.replace('text-', '')}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Button Preview */}
                            <div className="mt-6 flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                <span className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Button Preview</span>
                                <button className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 ${formData.cta.bgColor} ${formData.cta.hoverColor} ${formData.cta.textColor}`}>
                                    {formData.cta.text || 'Button Text'}
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Gallery Settings */}
                <Card className="p-6 md:col-span-2 xl:col-span-2">
                    <div className="flex items-center gap-2 mb-6 pb-2 border-b dark:border-gray-700">
                        <Upload className="w-5 h-5 text-primary-600" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gallery Section Settings</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Add Images to Gallery
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleGalleryUpload}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-primary-50 file:text-primary-700
                                    hover:file:bg-primary-100
                                    dark:file:bg-gray-700 dark:file:text-white
                                    cursor-pointer"
                                disabled={uploading}
                            />
                            <p className="text-xs text-gray-500 mt-1">Upload multiple images (Max 10MB each).</p>
                        </div>

                        {galleryImages.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                {galleryImages.map((url, idx) => (
                                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border dark:border-gray-700 bg-gray-100">
                                        <img
                                            src={url}
                                            alt={`Gallery ${idx}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveGalleryImage(idx)}
                                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete Image"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 border border-dashed rounded-lg dark:border-gray-700">
                                No images in gallery. Upload some above!
                            </div>
                        )}
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default AdminHero;
