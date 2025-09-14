'use client';

import { useState } from 'react';
import SalonCard from './SalonCard';
import { FunnelIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';

export default function SalonGrid({ salons, onOpenFilters }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('recommended');
  const [isLoading, setIsLoading] = useState(false);

  const sortOptions = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'distance', label: 'Nearest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ];

  return (
    <div className="flex-1">
      {/* Controls only - no duplicate heading */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <p className="text-body">
            {salons.length} salons found
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Filter Button - Always visible */}
          <button
            onClick={onOpenFilters}
            className="btn-secondary flex items-center"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setIsLoading(true);
                setSortBy(e.target.value);
                // Simulate loading
                setTimeout(() => setIsLoading(false), 800);
              }}
              className="input-booksy appearance-none pr-8 min-w-[160px] rounded-xl"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
              <svg className="fill-current h-4 w-4" style={{ color: 'var(--foreground-muted)' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-medium)' }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid' 
                  ? 'text-white' 
                  : 'hover:bg-gray-50'
              }`}
              style={{ 
                background: viewMode === 'grid' ? 'var(--accent-primary)' : 'white',
                color: viewMode === 'grid' ? 'white' : 'var(--foreground-secondary)'
              }}
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list' 
                  ? 'text-white' 
                  : 'hover:bg-gray-50'
              }`}
              style={{ 
                background: viewMode === 'list' ? 'var(--accent-primary)' : 'white',
                color: viewMode === 'list' ? 'white' : 'var(--foreground-secondary)'
              }}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Salon Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-white rounded-2xl overflow-hidden border border-gray-200 animate-pulse">
              <div className="h-40 bg-gray-200"></div>
              <div className="p-3 space-y-3">
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
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {salons.map((salon, index) => (
            <div key={salon.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in">
              <SalonCard salon={salon} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {salons.map((salon) => (
            <div key={salon.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-64 h-48 sm:h-32">
                  <img
                    src={salon.image}
                    alt={salon.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {salon.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">{salon.location}</p>
                      <p className="text-teal-600 font-medium text-sm mb-2">
                        {salon.priceRange}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {salon.services.slice(0, 4).map((service, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center mb-2">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm font-medium ml-1">
                          {salon.rating} ({salon.reviewCount})
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        salon.isOpen 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {salon.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <button className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      View Details
                    </button>
                    <button className="flex-1 py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      <div className="text-center mt-12">
        <button className="px-8 py-3 border-2 border-teal-600 text-teal-600 rounded-lg hover:bg-teal-600 hover:text-white transition-colors font-medium">
          Load More Salons
        </button>
      </div>
    </div>
  );
}
