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
import { ConnectionError, EmptyState, LoadingSkeleton } from '@/components/ErrorStates';

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
        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load salons:', err);
        }
        setError('Unable to connect to salon directory. Please try again later.');
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

  // Elastic search function with fuzzy matching
  const elasticSearch = (searchTerm, salons) => {
    if (!searchTerm.trim()) return salons;
    
    const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.length > 0);
    
    return salons.map(salon => {
      let score = 0;
      const salonName = salon.name.toLowerCase();
      const salonAbout = (salon.about || '').toLowerCase();
      const salonAddress = (salon.address || '').toLowerCase();
      
      searchWords.forEach(word => {
        // Exact match gets highest score
        if (salonName.includes(word)) score += 10;
        if (salonAbout.includes(word)) score += 5;
        if (salonAddress.includes(word)) score += 3;
        
        // Fuzzy matching for typos (simple character substitution)
        if (word.length >= 3) {
          // Check if salon name contains most characters of the search word
          const matchingChars = word.split('').filter(char => salonName.includes(char)).length;
          if (matchingChars >= Math.ceil(word.length * 0.7)) {
            score += 3; // Fuzzy match bonus
          }
          
          // Check for reversed characters (sm-shop should match ms-shop)
          const reversedWord = word.split('').reverse().join('');
          if (salonName.includes(reversedWord)) score += 8;
          
          // Check for missing hyphens/spaces (smshop should match sm-shop)
          const spacedWord = word.replace(/[-\s]/g, '');
          const spacedSalon = salonName.replace(/[-\s]/g, '');
          if (spacedSalon.includes(spacedWord) || spacedWord.includes(spacedSalon)) {
            score += 7;
          }
        }
      });
      
      return { ...salon, searchScore: score };
    })
    .filter(salon => salon.searchScore > 0)
    .sort((a, b) => b.searchScore - a.searchScore);
  };

  // Filter salons using elastic search
  const filteredSalons = elasticSearch(query, salons);

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
        {isLoading && <LoadingSkeleton count={6} type="card" />}

        {/* API Error State */}
        {!isLoading && apiError && (
          <ConnectionError onRetry={() => search(query, location)} />
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
              <EmptyState
                title="No results found"
                message={`We couldn't find any salons matching "${query}". Try searching with different keywords.`}
                suggestions={['Hair Cut', 'Facial', 'Massage', 'Manicure', 'Spa']}
                onSuggestionClick={(suggestion) => {
                  setQuery(suggestion);
                  const params = new URLSearchParams();
                  params.set('q', suggestion);
                  if (location.trim()) params.set('location', location.trim());
                  router.push(`/search?${params.toString()}`);
                }}
              />
            )}
          </div>
        )}

        {/* No Query State */}
        {!isLoading && !query && (
          <EmptyState
            title="Find Your Perfect Salon"
            message="Search for salons, services, or browse by location"
            suggestions={['Hair Cut', 'Hair Color', 'Facial', 'Massage', 'Manicure', 'Spa', 'Eyebrow Threading']}
            onSuggestionClick={(suggestion) => {
              setQuery(suggestion);
              const params = new URLSearchParams();
              params.set('q', suggestion);
              if (location.trim()) params.set('location', location.trim());
              router.push(`/search?${params.toString()}`);
            }}
            showSearchButton={false}
          />
        )}
      </div>
    </div>
  );
}