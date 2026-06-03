import React, { useState, useRef } from 'react';
import { Camera, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const ProfileAvatar = ({
    imageUrl,
    userName,
    onImageUpload,
    editable = true,
    size = 'lg'
}) => {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(imageUrl);
    const fileInputRef = useRef(null);

    const sizeClasses = {
        sm: 'w-12 h-12 text-sm',
        md: 'w-16 h-16 text-base',
        lg: 'w-20 h-20 text-xl',
        xl: 'w-32 h-32 text-3xl',
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        try {
            setUploading(true);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);

            // Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'ml_default'); // You may need to create this preset in Cloudinary
            formData.append('folder', 'profile_images');

            const response = await fetch(
                'https://api.cloudinary.com/v1_1/dvaoenkgr/image/upload',
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();

            // Call the callback with the uploaded image URL
            if (onImageUpload) {
                await onImageUpload(data.secure_url);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
            setPreviewUrl(imageUrl); // Revert to original
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative inline-block">
            <div
                className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg`}
            >
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt={userName || 'Profile'}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span>{getInitials(userName)}</span>
                )}
            </div>

            {editable && (
                <>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border-2 border-gray-100 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Upload profile picture"
                    >
                        {uploading ? (
                            <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                        ) : (
                            <Camera className="w-4 h-4 text-gray-600" />
                        )}
                    </motion.button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </>
            )}
        </div>
    );
};

export default ProfileAvatar;
