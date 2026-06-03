import React from 'react';

// Generic skeleton component
export const Skeleton = ({ className = '', width, height }) => (
    <div
        className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded ${className}`}
        style={{
            width: width || '100%',
            height: height || '1rem',
            animation: 'shimmer 1.5s infinite',
        }}
    />
);

// Profile card skeleton
export const ProfileSkeleton = () => (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center gap-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-60" />
            </div>
        </div>
        <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    </div>
);

// Booking list item skeleton
export const BookingSkeleton = () => (
    <div className="py-3 flex items-center justify-between border-b">
        <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-5 w-20" />
    </div>
);

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 7 }) => (
    <div className="overflow-x-auto">
        <table className="min-w-full">
            <thead>
                <tr>
                    {Array.from({ length: columns }).map((_, i) => (
                        <th key={i} className="py-2 pr-4">
                            <Skeleton className="h-4 w-20" />
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <tr key={rowIndex} className="border-t">
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <td key={colIndex} className="py-2 pr-4">
                                <Skeleton className="h-4 w-16" />
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// Card skeleton
export const CardSkeleton = () => (
    <div className="bg-white rounded-xl shadow p-6 space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-8 w-24" />
    </div>
);

// Coupon card skeleton
export const CouponSkeleton = () => (
    <div className="border border-gray-200 rounded-lg p-4 space-y-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-32" />
    </div>
);

// Add shimmer animation to global styles
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
    document.head.appendChild(style);
}
