import React from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className = ''
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
        >
            {Icon && (
                <div className="mb-4 p-4 bg-gray-100 rounded-full">
                    <Icon className="w-12 h-12 text-gray-400" />
                </div>
            )}

            {title && (
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {title}
                </h3>
            )}

            {description && (
                <p className="text-sm text-gray-500 max-w-md mb-6">
                    {description}
                </p>
            )}

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {actionLabel}
                </button>
            )}
        </motion.div>
    );
};

export default EmptyState;
