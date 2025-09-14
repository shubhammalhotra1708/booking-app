'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, MapPinIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function HeroSection() {
  const [location, setLocation] = useState('');
  const [service, setService] = useState('');
  const [isSearching, setIsSearching] = useState(false);



  const handleSearch = () => {
    setIsSearching(true);
    // Handle search functionality
    console.log('Searching for:', { location, service });
    // Simulate search
    setTimeout(() => setIsSearching(false), 1500);
  };



  return (
    <div className="relative overflow-hidden" 
         style={{ 
           background: 'linear-gradient(135deg, var(--background) 0%, var(--background-secondary) 50%, #f8fafc 100%)',
           minHeight: '50vh'
         }}>
      
      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230ea5e9' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>

      <div className="relative container-booksy" style={{ 
        paddingTop: '60px', // Account for navbar + minimal space
        paddingBottom: '10px' 
      }}>
        <div className="text-center max-w-4xl mx-auto">
          
          {/* Main Heading - Ultra Compact */}
          <div className="mb-6">
            <h1 className="heading-xl text-2xl md:text-3xl lg:text-4xl font-bold" style={{ lineHeight: '1.1', marginBottom: '12px' }}>
              Book your next
              <span className="block mt-1" style={{ 
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                beauty appointment
              </span>
            </h1>
            
            <p className="text-body text-sm md:text-base max-w-xl mx-auto" style={{ color: 'var(--foreground-secondary)', lineHeight: '1.4' }}>
              Discover top-rated salons and spas near you. Book instantly.
            </p>
          </div>

          {/* Enhanced Search Widget - Ultra Compact */}
          <div className="max-w-xl mx-auto mb-4">
            <div className="bg-white rounded-xl p-3 md:p-4" style={{ 
              boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(229, 231, 235, 0.3)'
            }}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
                
                {/* Location Input */}
                <div className="md:col-span-5">
                  <label className="block text-xs font-semibold mb-2 text-gray-600 uppercase tracking-wide">
                    📍 Location
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 z-10 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter your location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Service Input */}
                <div className="md:col-span-5">
                  <label className="block text-xs font-semibold mb-2 text-gray-600 uppercase tracking-wide">
                    ✨ Service
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 z-10 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search for services..."
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="w-full h-10 pl-10 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div className="md:col-span-2 flex items-end">
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="w-full h-10 bg-sky-500 text-white text-sm font-semibold rounded-lg hover:bg-sky-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSearching ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                        Searching...
                      </div>
                    ) : (
                      'Search'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search status - Only show when searching */}
          {isSearching && (
            <div className="mt-4 text-sm text-sky-600 font-medium flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-sky-500 border-t-transparent"></div>
              Searching for salons...
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
