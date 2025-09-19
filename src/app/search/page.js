'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MagnifyingGlassIcon, MapPinIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { searchSalonsAndServices, getUserLocation } from '@/utils/searchUtils';
import SalonCard from '@/components/SalonCard';
import Navbar from '@/components/Navbar';

export default function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    const searchQuery = searchParams.get('q') || '';
    const searchLocation = searchParams.get('location') || getUserLocation();
    
    setQuery(searchQuery);
    setLocation(searchLocation);

    if (searchQuery) {
      setIsLoading(true);
      // Simulate API delay
      setTimeout(() => {
        const searchResults = searchSalonsAndServices(searchQuery, searchLocation);
        setResults(searchResults);
        setIsLoading(false);
      }, 500);
    } else {
      setResults([]);
      setIsLoading(false);
    }
  }, [searchParams]);

  const handleNewSearch = () => {
    if (query.trim()) {
      const params = new URLSearchParams();
      params.set('q', query.trim());
      if (location.trim()) {
        params.set('location', location.trim());
      }
      router.push(`/search?${params.toString()}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNewSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showCompactSearch={false} />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Link 
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Back to Home
            </Link>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Location Input */}
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold mb-2 text-gray-600 uppercase tracking-wide">
                    📍 Location
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Near you"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full h-10 pl-10 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Search Input */}
                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold mb-2 text-gray-600 uppercase tracking-wide">
                    🔍 Search
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search salons or services..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full h-10 pl-10 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div className="md:col-span-2 flex items-end">
                  <button
                    onClick={handleNewSearch}
                    className="w-full h-10 bg-sky-500 text-white text-sm font-semibold rounded-lg hover:bg-sky-600 transition-colors"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          {!isLoading && (
            <div className="text-center mb-6">
              {query ? (
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Search Results for "{query}"
                  {location && location !== 'Current Location' && (
                    <span className="text-gray-600"> near {location}</span>
                  )}
                </h1>
              ) : (
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Search Salons & Services
                </h1>
              )}
              
              {query && (
                <p className="text-gray-600">
                  Found {results.length} {results.length === 1 ? 'result' : 'results'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Searching...</p>
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && query && (
          <div>
            {results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.map((result, index) => (
                  <div key={index}>
                    <SalonCard 
                      salon={result.salon} 
                      showStatusBadge={false}
                      showSpecialOffer={false}
                      showDetailsButton={false}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600 mb-4">
                    We couldn't find any salons or services matching "{query}". 
                    Try searching with different keywords.
                  </p>
                  <div className="text-sm text-gray-500">
                    <p className="mb-2">Try searching for:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Hair Cut', 'Facial', 'Massage', 'Manicure', 'Spa'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setQuery(suggestion);
                            const params = new URLSearchParams();
                            params.set('q', suggestion);
                            if (location.trim()) params.set('location', location.trim());
                            router.push(`/search?${params.toString()}`);
                          }}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Query State */}
        {!isLoading && !query && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Find Your Perfect Salon</h3>
            <p className="text-gray-600 mb-6">Search for salons, services, or browse by location</p>
            
            <div className="max-w-md mx-auto">
              <p className="text-sm font-medium text-gray-700 mb-3">Popular searches:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Hair Cut', 'Hair Color', 'Facial', 'Massage', 'Manicure', 'Spa', 'Eyebrow Threading'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                      const params = new URLSearchParams();
                      params.set('q', suggestion);
                      if (location.trim()) params.set('location', location.trim());
                      router.push(`/search?${params.toString()}`);
                    }}
                    className="px-4 py-2 bg-white text-gray-700 rounded-full border hover:bg-gray-50 transition-colors text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}