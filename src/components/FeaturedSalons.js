'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, FunnelIcon, Bars3BottomLeftIcon } from '@heroicons/react/24/outline';
import SalonCard from './SalonCard';
import { featuredSalons } from '@/data/mockData';

export default function FeaturedSalons() {
  const [isVisible, setIsVisible] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const sortOptions = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'distance', label: 'Nearest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ];

  // Using centralized data from mockData.js

  return (
    <section className="py-6 bg-white">
      <div className="container-booksy">
        {/* Section Header with Controls */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div>
            <h2 className="heading-lg text-xl md:text-2xl font-bold mb-1">
              Featured Salons Near You
            </h2>
            <p className="text-body text-sm text-gray-600">
              {featuredSalons.length} salons available
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Filter Button */}
            <button className="btn-secondary flex items-center text-sm">
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-booksy appearance-none pr-8 min-w-[140px] rounded-lg text-sm py-2"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <svg className="fill-current h-3 w-3" style={{ color: 'var(--foreground-muted)' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Scrollable Salons - Booksy Style */}
        <div className="relative">
          <div 
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-1"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {featuredSalons.map((salon, index) => (
              <div
                key={salon.id}
                className={`flex-shrink-0 transition-all duration-700 ${
                  isVisible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ 
                  transitionDelay: `${index * 100}ms`,
                  width: '280px'
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
                transitionDelay: `${featuredSalons.length * 100}ms`,
                width: '280px'
              }}
            >
              <div className="h-full bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl border-2 border-dashed border-sky-200 flex flex-col items-center justify-center p-8 hover:border-sky-300 hover:bg-gradient-to-br hover:from-blue-100 hover:to-sky-100 transition-all duration-300 cursor-pointer group">
                <div className="text-sky-500 mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">View All Salons</h3>
                <p className="text-sm text-gray-600 text-center">Discover more options near you</p>
              </div>
            </div>
          </div>
          
          {/* Scroll Hint */}
          <div className="flex justify-center mt-4">
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>Swipe to see more</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
