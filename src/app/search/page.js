'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowLeft } from 'lucide-react';
import { useSearch } from '@/hooks/useApi';
// Keep as fallback
import { searchSalonsAndServices } from '@/utils/searchUtils';
import SalonCard from '@/components/SalonCard';
import Navbar from '@/components/Navbar';

function SearchResultsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState('');
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
    setQuery(searchQuery);
  }, [searchParams]);

  // Enhanced fuzzy matching with typo tolerance
  const fuzzyMatch = (text, searchTerm) => {
    // Calculate Levenshtein distance for typo tolerance
    const levenshtein = (a, b) => {
      const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
      for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
      for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
      for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1,
            matrix[j - 1][i] + 1,
            matrix[j - 1][i - 1] + cost
          );
        }
      }
      return matrix[b.length][a.length];
    };

    const normalizedText = text.toLowerCase().replace(/\s+/g, '');
    const normalizedSearch = searchTerm.toLowerCase().replace(/\s+/g, '');
    
    // Direct match
    if (normalizedText.includes(normalizedSearch)) return true;
    
    // Word-by-word matching
    const textWords = text.toLowerCase().split(/\s+/);
    const searchWords = searchTerm.toLowerCase().split(/\s+/);
    
    // Check if all search words match (allowing typos)
    const allWordsMatch = searchWords.every(searchWord => {
      return textWords.some(textWord => {
        if (textWord.includes(searchWord) || searchWord.includes(textWord)) return true;
        // Allow 1-2 character differences for typos (depending on word length)
        const maxDistance = searchWord.length <= 4 ? 1 : 2;
        return levenshtein(textWord, searchWord) <= maxDistance;
      });
    });
    
    if (allWordsMatch) return true;
    
    // Substring matching: "cut" matches "haircut"
    if (searchWords.some(word => word.length > 2 && textWords.some(tw => tw.includes(word)))) {
      return true;
    }
    
    return false;
  };

  // Filter salons with enhanced fuzzy matching
  const filteredSalons = query 
    ? salons.filter(salon => {
        const searchableText = [
          salon.name || '',
          salon.about || '',
          ...(salon.services || []),
        ].join(' ');
        
        return fuzzyMatch(searchableText, query);
      })
    : salons;

  const results = filteredSalons;
  const isLoading = loading;
  const apiError = error;

  const handleNewSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/search');
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
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Search Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center mb-3 sm:mb-4">
            <Link 
              href="/"
              className="flex items-center text-xs sm:text-sm text-gray-600 hover:text-gray-900 mr-3 sm:mr-4"
            >
              <ArrowLeft className="h-3 w-3 sm:h-5 sm:w-5 mr-1" />
              Back to Home
            </Link>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-4 sm:mb-6">
            <div className="bg-white rounded-xl p-2.5 sm:p-3 md:p-4 shadow-sm border">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                {/* Search Input */}
                <div className="flex-1">
                  <label className="block text-[10px] sm:text-xs font-semibold mb-1.5 sm:mb-2 text-gray-600 uppercase tracking-wide">
                    🔍 Search Salons
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by salon name or services..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full h-9 sm:h-10 pl-8 sm:pl-10 pr-3 text-xs sm:text-sm border border-gray-200 rounded-lg placeholder:text-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex items-end">
                  <button
                    onClick={handleNewSearch}
                    className="w-full sm:w-auto h-9 sm:h-10 px-4 sm:px-6 bg-sky-500 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-sky-600 transition-colors"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
              <div className="text-center py-8 sm:py-12">
                <div className="max-w-md mx-auto px-3">
                  <Search className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4">
                    We couldn't find any salons or services matching "{query}". 
                    Try searching with different keywords.
                  </p>
                  <div className="text-xs sm:text-sm text-gray-500">
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
                          className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
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
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">All Salons Near You</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {results.map((salon, index) => (
                <SalonCard key={salon.id || index} salon={salon} />
              ))}
            </div>
          </div>
        )}

        {/* No Query and No Salons State */}
        {!isLoading && !query && results.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <Search className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">Find Your Perfect Salon</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-3">Search for salons, services, or browse by location</p>
            
            <div className="max-w-md mx-auto px-3">
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-3">Popular searches:</p>
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
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-gray-700 rounded-full border hover:bg-gray-50 transition-colors text-xs sm:text-sm"
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

export default function SearchResults() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-sky-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading search...</p>
        </div>
      </div>
    }>
      <SearchResultsInner />
    </Suspense>
  );
}