import { useState, useEffect, useRef } from 'react';

/**
 * LazyImage Component
 * Implements lazy loading for images using Intersection Observer API
 * Improves performance by only loading images when they're about to enter the viewport
 * 
 * @param {Object} props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text for accessibility
 * @param {string} [props.className] - CSS classes
 * @param {string} [props.placeholder] - Placeholder image URL
 * @param {Function} [props.onError] - Error handler
 * @param {Object} [props.style] - Inline styles
 */
export default function LazyImage({
    src,
    alt,
    className = '',
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3C/svg%3E',
    onError,
    ...props
}) {
    const [imageSrc, setImageSrc] = useState(placeholder);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        // Check if browser supports IntersectionObserver
        if (!('IntersectionObserver' in window)) {
            // Fallback: load image immediately
            setImageSrc(src);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Image is in viewport, start loading
                        setImageSrc(src);
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                // Start loading when image is 50px away from viewport
                rootMargin: '50px',
                threshold: 0.01,
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (imgRef.current) {
                observer.unobserve(imgRef.current);
            }
        };
    }, [src]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = (e) => {
        setHasError(true);
        if (onError) {
            onError(e);
        } else {
            // Default error handler: set placeholder
            e.currentTarget.src = 'https://placehold.co/800x450?text=Image+Not+Found';
        }
    };

    return (
        <img
            ref={imgRef}
            src={imageSrc}
            alt={alt}
            className={`${className} ${!isLoaded && !hasError ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy" // Native lazy loading as fallback
            {...props}
        />
    );
}
