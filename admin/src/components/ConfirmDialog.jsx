import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
    isOpen,
    onConfirm,
    onCancel,
    title = 'Confirm Action',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger' // 'danger' or 'warning'
}) => {
    useEffect(() => {
        if (isOpen) {
            const handleEsc = (e) => {
                if (e.key === 'Escape') onCancel();
                if (e.key === 'Enter') onConfirm();
            };
            document.addEventListener('keydown', handleEsc);
            return () => document.removeEventListener('keydown', handleEsc);
        }
    }, [isOpen, onCancel, onConfirm]);

    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: 'text-red-500 dark:text-red-400',
            button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white'
        },
        warning: {
            icon: 'text-yellow-500 dark:text-yellow-400',
            button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onCancel}
                aria-hidden="true"
            />

            {/* Dialog */}
            <div
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
                aria-describedby="dialog-description"
            >
                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20">
                    <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
                </div>

                {/* Title */}
                <h3
                    id="dialog-title"
                    className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2"
                >
                    {title}
                </h3>

                {/* Message */}
                <p
                    id="dialog-description"
                    className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6"
                >
                    {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 transition-colors ${styles.button}`}
                        autoFocus
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
