'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Sparkles, ArrowRight } from 'lucide-react';

export default function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (arg = null) => {
    // If called from onClick, React passes the event as the first arg; ignore it
    const queryOverride = typeof arg === 'string' ? arg : null;
    const searchTerm = queryOverride || searchQuery.trim();
    if (!searchTerm) return;
    
    setIsSearching(true);
    
    // Navigate to search page with query only
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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
          <div className="mb-4 sm:mb-6">
            <h1 className="heading-xl text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold" style={{ lineHeight: '1.1', marginBottom: '12px' }}>
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
            
            <p className="text-body text-xs sm:text-sm md:text-base max-w-xl mx-auto" style={{ color: 'var(--foreground-secondary)', lineHeight: '1.4' }}>
              Discover top-rated salons and spas near you. Book instantly.
            </p>
          </div>

          {/* Enhanced Search Widget - Ultra Compact */}
          <div className="max-w-xl mx-auto mb-3 sm:mb-4">
            <div className="bg-white rounded-xl p-2.5 sm:p-3 md:p-4" style={{ 
              boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(229, 231, 235, 0.3)'
            }}>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                
                {/* Search Input */}
                <div className="flex-1">
                  <label className="block text-[10px] sm:text-xs font-semibold mb-1.5 sm:mb-2 text-gray-600 uppercase tracking-wide">
                    🔍 Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 z-10 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search salons or services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full h-9 sm:h-10 pl-8 sm:pl-10 pr-3 text-xs sm:text-sm border border-gray-200 rounded-lg placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex items-end">
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="w-full sm:w-auto px-4 sm:px-6 h-9 sm:h-10 bg-sky-500 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-sky-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
                  >
                    {isSearching ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        <span className="hidden sm:inline">Searching...</span>
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

          {/* Popular Service Categories Pills - Bottom of Hero Section */}
          {!isSearching && (
            <div className="mt-6 sm:mt-8 mb-3 sm:mb-4">
              <p className="text-[10px] sm:text-xs font-medium text-gray-600 mb-2 sm:mb-3 uppercase tracking-wide">
                Popular Services
              </p>
              <div className="flex justify-center items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-2">
                {[
                  { name: 'Hair Salon', icon: '💇‍♀️' },
                  { name: 'Nail Salon', icon: '💅' },
                  { name: 'Barber', icon: '✂️' },
                  { name: 'Massage', icon: '💆‍♀️' },
                  { name: 'Facial', icon: '✨' },
                  { name: 'Spa', icon: '🧖‍♀️' },
                ].map((service, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // Auto-fill the search bar and trigger search immediately
                      setSearchQuery(service.name);
                      handleSearch(service.name);
                    }}
                    className="flex-shrink-0 inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-white text-gray-700 text-[10px] sm:text-xs font-medium rounded-full border border-gray-200 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    <span className="mr-1 sm:mr-1.5 text-xs">{service.icon}</span>
                    <span className="whitespace-nowrap">{service.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Booking Status Link */}
          <div className="mt-6">
            <Link 
              href="/booking-status" 
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium group"
            >
              <span>Already have a booking? Check status</span>
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
