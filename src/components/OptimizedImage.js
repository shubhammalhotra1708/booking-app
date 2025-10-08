'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createIntersectionObserver } from '../utils/performance';

// Optimized image component with lazy loading and error handling
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  fallbackSrc = '/placeholder-salon.jpg',
  priority = false,
  sizes,
  quality = 80,
  placeholder = 'blur',
  blurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6bz6/1oADAMBAAIAAwAAABDxVfwjVSOwdL',
  onLoad,
  onError,
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = createIntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer?.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current && observer) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current && observer) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [priority, isInView]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setHasError(true);
    setImgSrc(fallbackSrc);
    onError?.(e);
  };

  // Generate sizes based on responsive breakpoints
  const responsiveSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {isInView && (
        <Image
          src={imgSrc}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          sizes={responsiveSizes}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            <span className="text-xs">Image unavailable</span>
          </div>
        </div>
      )}
    </div>
  );
}