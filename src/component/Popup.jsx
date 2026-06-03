import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Info,
    X
} from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Modern Reusable Popup Component
 * @param {boolean} isOpen - Controls visibility
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {string} title - Main title
 * @param {string} description - Subtext content
 * @param {string} confirmText - Text for the primary button
 * @param {string} cancelText - Text for the secondary button (optional)
 * @param {function} onConfirm - Callback for primary action
 * @param {function} onCancel - Callback for secondary action / close
 * @param {boolean} closeOnOutsideClick - Close when clicking backdrop
 */
const Popup = ({
    isOpen,
    type = 'info',
    title,
    description,
    confirmText = 'Confirm',
    cancelText,
    onConfirm,
    onCancel,
    closeOnOutsideClick = true
}) => {

    const config = {
        success: {
            icon: <CheckCircle2 className="w-12 h-12 text-green-500" />,
            bgColor: 'bg-green-50',
            btnColor: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
            textColor: 'text-green-900',
            descriptionColor: 'text-green-700'
        },
        error: {
            icon: <XCircle className="w-12 h-12 text-red-500" />,
            bgColor: 'bg-red-50',
            btnColor: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
            textColor: 'text-red-900',
            descriptionColor: 'text-red-700'
        },
        warning: {
            icon: <AlertTriangle className="w-12 h-12 text-amber-500" />,
            bgColor: 'bg-amber-50',
            btnColor: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
            textColor: 'text-amber-900',
            descriptionColor: 'text-amber-700'
        },
        info: {
            icon: <Info className="w-12 h-12 text-blue-500" />,
            bgColor: 'bg-blue-50',
            btnColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
            textColor: 'text-blue-900',
            descriptionColor: 'text-blue-700'
        }
    };

    const current = config[type] || config.info;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeOnOutsideClick ? onCancel : undefined}
                        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center"
                    >
                        {/* Close Button (Optional top right) */}
                        <button
                            onClick={onCancel}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Icon Container */}
                        <div className={`mx-auto w-20 h-20 ${current.bgColor} rounded-full flex items-center justify-center mb-6`}>
                            {current.icon}
                        </div>

                        {/* Title */}
                        <h3 className={`text-2xl font-bold mb-3 ${current.textColor}`}>
                            {title}
                        </h3>

                        {/* Description */}
                        {description && (
                            <p className={`text-base mb-8 ${current.descriptionColor} leading-relaxed`}>
                                {description}
                            </p>
                        )}

                        {/* Buttons */}
                        <div className={`flex items-center gap-3 ${cancelText ? 'flex-row' : 'flex-col'}`}>
                            {cancelText && (
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-6 py-3 text-gray-600 font-semibold hover:bg-gray-50 border border-gray-200 rounded-xl transition-all active:scale-[0.98]"
                                >
                                    {cancelText}
                                </button>
                            )}
                            <button
                                onClick={onConfirm}
                                className={`${cancelText ? 'flex-1' : 'w-full'} px-6 py-3 text-white font-semibold rounded-xl transition-all shadow-lg active:scale-[0.98] focus:ring-4 focus:ring-offset-2 ${current.btnColor}`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

Popup.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    closeOnOutsideClick: PropTypes.bool
};

export default Popup;
