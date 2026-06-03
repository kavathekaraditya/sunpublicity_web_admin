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

    const handleSave = async () => {
        try {
            setSaving(true);
            const docRef = doc(db, 'hero_section', 'main');

            await setDoc(docRef, {
                ...formData,
                updatedAt: serverTimestamp()
            });

            showMessage('success', 'Hero settings saved successfully');
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

                {/* Overlay Settings */}
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6 pb-2 border-b dark:border-gray-700">
                        <Layers className="w-5 h-5 text-primary-600" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Overlay Gradient</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Overlay</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.overlay.enabled}
                                    onChange={(e) => handleChange('overlay', 'enabled', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                            </label>
                        </div>

                        <div className={`space-y-4 transition-opacity ${!formData.overlay.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="grid grid-cols-3 gap-3">
                                {['from', 'via', 'to'].map((pos) => (
                                    <div key={pos}>
                                        <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
                                            {pos} Color
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.overlay[pos]}
                                            onChange={(e) => handleChange('overlay', pos, e.target.value)}
                                            placeholder={`e.g. black/50`}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500">Supports Tailwind colors (e.g. 'black/60', 'blue-900/40', 'transparent')</p>

                            {/* Mini Preview of Gradient */}
                            <div
                                className="h-12 w-full rounded-md border border-gray-200 dark:border-gray-600"
                                style={{
                                    background: `linear-gradient(to right, 
                                        ${formData.overlay.from.replace('black', '#000000').replace('/', '').replace('transparent', 'rgba(0,0,0,0)')}, 
                                        ${formData.overlay.via.replace('black', '#000000').replace('transparent', 'rgba(0,0,0,0)')}, 
                                        ${formData.overlay.to.replace('black', '#000000').replace('transparent', 'rgba(0,0,0,0)')})`
                                    // Note: This is a rough preview. Real Tailwind classes render better.
                                }}
                            ></div>
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

            </div>
        </div>
    );
};

export default AdminHero;
