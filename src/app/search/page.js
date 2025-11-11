'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, ArrowLeft } from 'lucide-react';
import { useSearch } from '@/hooks/useApi';
// Keep as fallback
import { searchSalonsAndServices, getUserLocation } from '@/utils/searchUtils';
import SalonCard from '@/components/SalonCard';
import Navbar from '@/components/Navbar';

export default function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all salons by default, then filter based on search
  useEffect(() => {
    const loadAllSalons = async () => {
      try {
        setLoading(true);
        // Simple API call without complex filters for speed
        const response = await fetch('/api/shops?limit=20');
        const result = await response.json();
        
        if (result.success && result.data) {
          setSalons(result.data);
        } else {
          setError('Failed to load salons');
        }
      } catch (err) {
        console.error('Failed to load salons:', err);
        setError('Failed to load salons');
      } finally {
        setLoading(false);
      }
    };

    loadAllSalons();
  }, []);

  useEffect(() => {
    const searchQuery = searchParams.get('q') || '';
    const searchLocation = searchParams.get('location') || '';
    
    setQuery(searchQuery);
    setLocation(searchLocation);
  }, [searchParams]);

  // Filter salons based on search query
  const filteredSalons = query 
    ? salons.filter(salon => 
        salon.name.toLowerCase().includes(query.toLowerCase()) ||
        (salon.about && salon.about.toLowerCase().includes(query.toLowerCase()))
      )
    : salons;

  const results = filteredSalons;
  const isLoading = loading;
  const apiError = error;

  const handleNewSearch = () => {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set('q', query.trim());
    }
    if (location.trim()) {
      params.set('location', location.trim());
    }
    const queryString = params.toString();
    router.push(queryString ? `/search?${queryString}` : '/search');
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
              <ArrowLeft className="h-5 w-5 mr-1" />
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
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Near you"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full h-10 pl-10 pr-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  {/* Popular locations */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {['Pune, Maharashtra', 'Ludhiana, Punjab', 'Mumbai', 'Delhi', 'Bangalore'].map((city) => (
                      <button
                        key={city}
                        onClick={() => setLocation(city)}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Input */}
                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold mb-2 text-gray-600 uppercase tracking-wide">
                    🔍 Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                  {results.length} results for "{query}"
                </h1>
              ) : (
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  All Salons ({results.length})
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

        {/* API Error State */}
        {!isLoading && apiError && (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">⚠️ Search Error</div>
            <p className="text-gray-600 mb-4">{apiError}</p>
            <button 
              onClick={() => search(query, location)}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {!isLoading && !apiError && query && (
          <div>
            {results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.filter(Boolean).map((result, index) => (
                  <div key={result.id || index}>
                    <SalonCard 
                      salon={result} 
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
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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

        {/* Show all salons when no query */}
        {!isLoading && !query && results.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">All Salons Near You</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map((salon, index) => (
                <SalonCard key={salon.id || index} salon={salon} />
              ))}
            </div>
          </div>
        )}

        {/* No Query and No Salons State */}
        {!isLoading && !query && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
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