'use client';

import { AlertTriangle, RefreshCw, Search, Wifi, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Generic error state component
export function ErrorState({ 
  title = "Something went wrong", 
  message = "We encountered an error. Please try again.", 
  onRetry, 
  showHomeButton = true,
  children 
}) {
  return (
    <div className="text-center py-20">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="space-y-3">
          {onRetry && (
            <button 
              onClick={onRetry}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          )}
          {showHomeButton && (
            <Link 
              href="/"
              className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Home className="h-4 w-4 inline mr-2" />
              Go Home
            </Link>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

// Connection error specific component
export function ConnectionError({ onRetry }) {
  return (
    <ErrorState
      title="Connection Error"
      message="Unable to connect to our servers. Please check your internet connection and try again."
      onRetry={onRetry}
    >
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center text-blue-800 text-sm">
          <Wifi className="h-4 w-4 mr-2" />
          <span>Check your internet connection</span>
        </div>
      </div>
    </ErrorState>
  );
}

// Empty state for search/listings
export function EmptyState({ 
  title = "No results found", 
  message = "We couldn't find what you're looking for.", 
  suggestions = [],
  onSuggestionClick,
  showSearchButton = true 
}) {
  return (
    <div className="text-center py-20">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Search className="mx-auto h-16 w-16 text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        
        {suggestions.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Try searching for:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {showSearchButton && (
          <Link 
            href="/search"
            className="inline-flex items-center px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            <Search className="h-4 w-4 mr-2" />
            Browse All Salons
          </Link>
        )}
      </div>
    </div>
  );
}

// Loading skeleton component
export function LoadingSkeleton({ count = 4, type = "card" }) {
  if (type === "card") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(count)].map((_, index) => (
          <div key={index} className="bg-white rounded-2xl overflow-hidden border border-gray-200 animate-pulse">
            <div className="h-40 bg-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="flex space-x-1">
                <div className="h-5 bg-gray-200 rounded w-16"></div>
                <div className="h-5 bg-gray-200 rounded w-20"></div>
                <div className="h-5 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="flex space-x-1.5">
                <div className="h-6 bg-gray-200 rounded-lg flex-1"></div>
                <div className="h-6 bg-gray-200 rounded-lg flex-1"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className="space-y-4">
        {[...Array(count)].map((_, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
            <div className="flex space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// Booking-specific error states
export function BookingError({ error, onRetry, onBack }) {
  return (
    <div className="text-center py-12 bg-white rounded-lg border border-red-200">
      <div className="mb-4">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Error</h3>
      <p className="text-gray-600 mb-6">{error}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        )}
        {onBack && (
          <button 
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        )}
      </div>
    </div>
  );
}

// Success toast component
export function SuccessToast({ message, onClose, autoClose = true }) {
  if (autoClose) {
    setTimeout(() => {
      onClose?.();
    }, 3000);
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">{message}</p>
          </div>
          {onClose && (
            <div className="ml-auto pl-3">
              <button
                onClick={onClose}
                className="inline-flex text-green-400 hover:text-green-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}