import React, { useState } from 'react';
import Navbar from '../component/Navbar';
import Popup from '../component/Popup';
import {
    Trash2,
    ShieldCheck,
    AlertCircle,
    CalendarCheck,
    LogIn
} from 'lucide-react';

const PopupDemo = () => {
    const [popupState, setPopupState] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        description: '',
        confirmText: 'OK',
        cancelText: null,
        onConfirm: () => { },
        onCancel: () => { },
    });

    const closePopup = () => setPopupState(prev => ({ ...prev, isOpen: false }));

    const handleAction = (type) => {
        switch (type) {
            case 'success':
                setPopupState({
                    isOpen: true,
                    type: 'success',
                    title: 'Action Successful',
                    description: 'Your request has been processed successfully. You can now proceed to the next step.',
                    confirmText: 'Great!',
                    onConfirm: closePopup,
                    onCancel: closePopup
                });
                break;
            case 'error':
                setPopupState({
                    isOpen: true,
                    type: 'error',
                    title: 'Payment Failed',
                    description: 'We were unable to process your payment. Please check your card details and try again.',
                    confirmText: 'Try Again',
                    onConfirm: closePopup,
                    onCancel: closePopup
                });
                break;
            case 'warning':
                setPopupState({
                    isOpen: true,
                    type: 'warning',
                    title: 'Confirm Deletion',
                    description: 'Are you sure you want to delete this booking? This action cannot be undone.',
                    confirmText: 'Delete Now',
                    cancelText: 'Cancel',
                    onConfirm: () => {
                        console.log('Deleted!');
                        closePopup();
                    },
                    onCancel: closePopup
                });
                break;
            case 'info':
                setPopupState({
                    isOpen: true,
                    type: 'info',
                    title: 'Booking Required',
                    description: 'You need to be logged in to book a hoarding. Access restricted to registered users.',
                    confirmText: 'Login Now',
                    cancelText: 'Later',
                    onConfirm: () => {
                        console.log('Redirecting to login...');
                        closePopup();
                    },
                    onCancel: closePopup
                });
                break;
            default:
                break;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-20">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                        Custom Popup Showcase
                    </h1>
                    <p className="text-lg text-gray-600">
                        Interactive, accessible, and beautiful popups for every use case.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Success Demo */}
                    <button
                        onClick={() => handleAction('success')}
                        className="group p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-all text-left flex items-start gap-4"
                    >
                        <div className="p-3 bg-green-50 rounded-xl group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Success State</h3>
                            <p className="text-gray-500 text-sm">Use for confirmations, logins, and successful form submissions.</p>
                        </div>
                    </button>

                    {/* Error Demo */}
                    <button
                        onClick={() => handleAction('error')}
                        className="group p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-all text-left flex items-start gap-4"
                    >
                        <div className="p-3 bg-red-50 rounded-xl group-hover:scale-110 transition-transform">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Error State</h3>
                            <p className="text-gray-500 text-sm">Highlight payment failures, API errors, or validation issues.</p>
                        </div>
                    </button>

                    {/* Warning Demo */}
                    <button
                        onClick={() => handleAction('warning')}
                        className="group p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-all text-left flex items-start gap-4"
                    >
                        <div className="p-3 bg-amber-50 rounded-xl group-hover:scale-110 transition-transform">
                            <Trash2 className="w-8 h-8 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Destructive Action</h3>
                            <p className="text-gray-500 text-sm">Ideal for delete confirmations or irreversible actions.</p>
                        </div>
                    </button>

                    {/* Info Demo */}
                    <button
                        onClick={() => handleAction('info')}
                        className="group p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-all text-left flex items-start gap-4"
                    >
                        <div className="p-3 bg-blue-50 rounded-xl group-hover:scale-110 transition-transform">
                            <LogIn className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Information/Nudge</h3>
                            <p className="text-gray-500 text-sm">Inform users about requirements or helpful shortcuts.</p>
                        </div>
                    </button>
                </div>

                <div className="mt-16 p-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Try the Booking Flow</h2>
                            <p className="text-blue-100">See how popups integrate with real business logic.</p>
                        </div>
                        <button
                            onClick={() => handleAction('success')}
                            className="px-8 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg flex items-center gap-2"
                        >
                            <CalendarCheck className="w-5 h-5" />
                            Book Now
                        </button>
                    </div>
                    {/* Abstract Decoration */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                </div>
            </main>

            <Popup
                isOpen={popupState.isOpen}
                type={popupState.type}
                title={popupState.title}
                description={popupState.description}
                confirmText={popupState.confirmText}
                cancelText={popupState.cancelText}
                onConfirm={popupState.onConfirm}
                onCancel={popupState.onCancel}
            />
        </div>
    );
};

export default PopupDemo;
