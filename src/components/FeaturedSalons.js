'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SalonCard from './SalonCard';
import { transformShopData } from '@/utils/transformData';

export default function FeaturedSalons({ salons = null }) {
  const [isVisible, setIsVisible] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  
  // Smart data loading: Featured shops only (8-10 shops max)
  // NOTE: Currently using rating-based selection. TODO: Add 'featured' column to Shop table
  const [salonData, setSalonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Load featured shops - optimized for homepage
    const loadFeaturedShops = async () => {
      try {
        setLoading(true);
        
        // Fetch top 10 shops for display (includes newly created shops)
        const response = await fetch('/api/shops?limit=10&basic=true');
        const result = await response.json();
        
        if (result.success && result.data?.length > 0) {
          const processedShops = result.data.map(shop => ({
            ...transformShopData(shop),
            // Default categories for display (no API call to services)
            categories: ['Beauty', 'Hair'], // Default since we're not fetching services for performance
            isVerified: shop.is_verified || false
          }));
          setSalonData(processedShops);
        } else {
          // If no shops found, this might be a database/API issue
          setError(result.message || 'No shops available at the moment');
        }
      } catch (err) {
        console.error('Failed to load featured shops:', err);
        setError('Failed to load shops');
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedShops();
  }, []);

  // Removed sorting options since we only have 5 shops

  // Loading state for featured shops
  if (loading) {
    return (
      <section className="py-4 sm:py-6 bg-white">
        <div className="container-booksy px-3 sm:px-4">
          <div className="mb-4 sm:mb-6">
            <h2 className="heading-lg text-lg sm:text-xl md:text-2xl font-bold mb-1">
              Featured Salons Near You
            </h2>
            <p className="text-body text-xs sm:text-sm text-gray-600">Loading top-rated salons...</p>
          </div>
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-3 sm:p-4 animate-pulse">
                <div className="bg-gray-200 h-40 sm:h-48 rounded-lg mb-3 sm:mb-4"></div>
                <div className="bg-gray-200 h-3 sm:h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-2 sm:h-3 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="py-4 sm:py-6 bg-white">
        <div className="container-booksy px-3 sm:px-4">
          <div className="text-center py-8 sm:py-12">
            <p className="text-red-600 mb-4 text-xs sm:text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 sm:py-6 bg-white">
      <div className="container-booksy px-3 sm:px-4">
        {/* Simple Section Header */}
        <div className={`mb-4 sm:mb-6 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h2 className="heading-lg text-lg sm:text-xl md:text-2xl font-bold mb-1">
            Top Salons Near You
          </h2>
          <p className="text-body text-xs sm:text-sm text-gray-600">
            {salonData.length} featured salons
          </p>
        </div>

        {/* Horizontal Scrollable Salons - Booksy Style */}
        <div className="relative">
          <div 
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-3 sm:pb-4 px-1"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {salonData.map((salon, index) => (
              <div
                key={salon.id}
                className={`flex-shrink-0 transition-all duration-700 ${
                  isVisible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ 
                  transitionDelay: `${index * 100}ms`,
                  width: '260px'
                }}
              >
                <SalonCard salon={salon} />
              </div>
            ))}
            
            {/* View More Card */}
            <div
              className={`flex-shrink-0 transition-all duration-700 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ 
                transitionDelay: `${salonData.length * 100}ms`,
                width: '260px'
              }}
            >
              <Link href="/search" className="block h-full">
                <div className="h-full bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl border-2 border-dashed border-sky-200 flex flex-col items-center justify-center p-6 sm:p-8 hover:border-sky-300 hover:bg-gradient-to-br hover:from-blue-100 hover:to-sky-100 transition-all duration-300 cursor-pointer group">
                  <div className="text-sky-500 mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1.5 sm:mb-2">View All Salons</h3>
                  <p className="text-xs sm:text-sm text-gray-600 text-center">Discover more options near you</p>
                </div>
              </Link>
            </div>
          </div>
          
          {/* Scroll Hint */}
          <div className="flex justify-center mt-3 sm:mt-4">
            <div className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1.5 sm:gap-2">
              <span>Swipe to see more</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
