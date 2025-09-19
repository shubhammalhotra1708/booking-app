// Search utility functions for salon and service searches
import { featuredSalons } from '@/data/mockData';

// Define keyword synonyms and related terms for flexible search
const searchSynonyms = {
  'hair': ['hair', 'hairstyle', 'haircut', 'salon', 'hair salon', 'barber'],
  'salon': ['salon', 'hair salon', 'beauty salon', 'hair', 'hairstyle', 'haircut'],
  'hair salon': ['salon', 'hair salon', 'beauty salon', 'hair', 'hairstyle', 'haircut'],
  'beauty': ['beauty', 'salon', 'spa', 'facial', 'skincare'],
  'spa': ['spa', 'massage', 'facial', 'relaxation', 'wellness'],
  'cut': ['cut', 'haircut', 'trim', 'hair cut', 'style'],
  'color': ['color', 'coloring', 'dye', 'highlights', 'hair color'],
  'nail': ['nail', 'manicure', 'pedicure', 'nails'],
  'facial': ['facial', 'skincare', 'beauty', 'spa'],
  'massage': ['massage', 'spa', 'relaxation', 'therapy']
};

// Normalize search terms and get related keywords
const getSearchKeywords = (query) => {
  const normalizedQuery = query.toLowerCase().trim();
  const keywords = new Set([normalizedQuery]);
  
  // Add direct synonyms
  if (searchSynonyms[normalizedQuery]) {
    searchSynonyms[normalizedQuery].forEach(synonym => keywords.add(synonym));
  }
  
  // Add partial matches from synonyms
  Object.entries(searchSynonyms).forEach(([key, synonyms]) => {
    if (key.includes(normalizedQuery) || normalizedQuery.includes(key)) {
      synonyms.forEach(synonym => keywords.add(synonym));
    }
  });
  
  // Split multi-word queries and add individual words
  const words = normalizedQuery.split(/\s+/);
  words.forEach(word => {
    if (word.length > 2) { // Only add meaningful words
      keywords.add(word);
      // Add synonyms for individual words
      if (searchSynonyms[word]) {
        searchSynonyms[word].forEach(synonym => keywords.add(synonym));
      }
    }
  });
  
  return Array.from(keywords);
};

// Check if text matches any of the search keywords (flexible matching)
const matchesKeywords = (text, keywords) => {
  const normalizedText = text.toLowerCase();
  return keywords.some(keyword => {
    // Exact match
    if (normalizedText.includes(keyword)) return true;
    
    // Word boundary match (more flexible)
    const words = normalizedText.split(/\s+/);
    return words.some(word => 
      word.includes(keyword) || keyword.includes(word)
    );
  });
};

// Mock user location - in real app, this would come from localStorage or user profile
const getUserLocation = () => {
  const savedLocation = typeof window !== 'undefined' ? localStorage.getItem('userLocation') : null;
  return savedLocation || 'Current Location';
};

// Set user location
export const setUserLocation = (location) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userLocation', location);
  }
};

// Main search function that searches both salons and services
export const searchSalonsAndServices = (query, location = null) => {
  if (!query.trim()) return [];

  const searchKeywords = getSearchKeywords(query);
  const results = [];

  // Search through all salons
  featuredSalons.forEach(salon => {
    let relevanceScore = 0;
    const matchedServices = [];
    let nameMatch = false;
    let locationMatch = false;

    // Check salon name match (flexible)
    if (matchesKeywords(salon.name, searchKeywords)) {
      relevanceScore += 3; // High relevance for name match
      nameMatch = true;
    }

    // Check services match (flexible)
    salon.services.forEach(service => {
      if (matchesKeywords(service, searchKeywords)) {
        relevanceScore += 2; // Medium relevance for service match
        matchedServices.push(service);
      }
    });

    // Check address/location match (flexible)
    if (matchesKeywords(salon.address, searchKeywords)) {
      relevanceScore += 1; // Low relevance for location match
      locationMatch = true;
    }

    // Bonus points for salons that match hair-related terms (since most are hair salons)
    const hairKeywords = ['hair', 'salon', 'hair salon', 'cut', 'style'];
    if (searchKeywords.some(keyword => hairKeywords.includes(keyword))) {
      relevanceScore += 0.5; // Small bonus for hair-related searches
    }

    // If there's any match, add to results
    if (relevanceScore > 0) {
      results.push({
        type: 'salon',
        salon,
        relevanceScore,
        matchedServices,
        matchReason: matchedServices.length > 0 
          ? `Offers: ${matchedServices.join(', ')}` 
          : nameMatch 
            ? 'Salon name match' 
            : locationMatch
              ? 'Location match'
              : 'Related services'
      });
    }
  });

  // Sort by relevance score (highest first)
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return results;
};

// Get search suggestions based on partial input
export const getSearchSuggestions = (query) => {
  if (!query.trim() || query.length < 2) return [];

  const searchKeywords = getSearchKeywords(query);
  const suggestions = new Set();

  // Add salon names (flexible matching)
  featuredSalons.forEach(salon => {
    if (matchesKeywords(salon.name, searchKeywords)) {
      suggestions.add(salon.name);
    }

    // Add matching services (flexible matching)
    salon.services.forEach(service => {
      if (matchesKeywords(service, searchKeywords)) {
        suggestions.add(service);
      }
    });
  });

  // Add common related terms based on input
  const commonTerms = ['Hair Salon', 'Hair Cut', 'Hair Color', 'Hair Styling', 'Beauty Salon'];
  const queryLower = query.toLowerCase();
  commonTerms.forEach(term => {
    if (term.toLowerCase().includes(queryLower) || queryLower.includes(term.toLowerCase().split(' ')[0])) {
      suggestions.add(term);
    }
  });

  // Convert to array and limit to 8 suggestions
  return Array.from(suggestions).slice(0, 8);
};

// Get popular searches (for empty state)
export const getPopularSearches = () => {
  return [
    'Hair Cut',
    'Hair Color',
    'Facial',
    'Massage',
    'Manicure',
    'Spa',
    'Eyebrow Threading',
    'Hair Styling'
  ];
};

export { getUserLocation };