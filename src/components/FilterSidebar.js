'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { serviceCategories, priceRanges } from '../data/mockData';

export default function FilterSidebar({ isOpen, onClose }) {
  const [expandedSections, setExpandedSections] = useState({
    services: true,
    price: true,
    rating: true,
    distance: true
  });

  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [selectedDistance, setSelectedDistance] = useState('');

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleServiceChange = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const clearFilters = () => {
    setSelectedServices([]);
    setSelectedPriceRange('');
    setSelectedRating('');
    setSelectedDistance('');
  };

  return (
    <>
      {/* Mobile/Desktop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Always slide in from left */}
      <div className={`
        fixed inset-y-0 left-0 z-50
        w-80 bg-white 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        overflow-y-auto card-booksy
      `} style={{ 
        boxShadow: 'var(--shadow-modal)',
        borderRadius: '0 12px 12px 0'
      }}>
        {/* Header */}
        <div className="p-5" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <div className="flex items-center justify-between">
            <h2 className="heading-md flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Filters
            </h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={clearFilters}
                className="text-sm hover:underline"
                style={{ color: 'var(--accent-primary)' }}
              >
                Clear All
              </button>
              <button
                onClick={onClose}
                className="text-2xl leading-none"
                style={{ color: 'var(--foreground-muted)' }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 space-y-6">
          {/* Services Filter */}
          <div>
            <button
              onClick={() => toggleSection('services')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-md font-medium text-gray-900">Services</h3>
              {expandedSections.services ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {expandedSections.services && (
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {serviceCategories.map((service) => (
                  <label key={service.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service.id)}
                      onChange={() => handleServiceChange(service.id)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {service.name}
                    </span>
                    <span className="ml-auto text-xs text-gray-500">
                      ({service.count})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Price Range Filter */}
          <div>
            <button
              onClick={() => toggleSection('price')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-md font-medium text-gray-900">Price Range</h3>
              {expandedSections.price ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {expandedSections.price && (
              <div className="mt-3 space-y-2">
                {priceRanges.map((range) => (
                  <label key={range.id} className="flex items-center">
                    <input
                      type="radio"
                      name="priceRange"
                      value={range.value}
                      checked={selectedPriceRange === range.value}
                      onChange={(e) => setSelectedPriceRange(e.target.value)}
                      className="border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {range.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Rating Filter */}
          <div>
            <button
              onClick={() => toggleSection('rating')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-md font-medium text-gray-900">Rating</h3>
              {expandedSections.rating ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {expandedSections.rating && (
              <div className="mt-3 space-y-2">
                {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                  <label key={rating} className="flex items-center">
                    <input
                      type="radio"
                      name="rating"
                      value={rating}
                      checked={selectedRating === rating.toString()}
                      onChange={(e) => setSelectedRating(e.target.value)}
                      className="border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 flex items-center">
                      {rating}+ ⭐
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Distance Filter */}
          <div>
            <button
              onClick={() => toggleSection('distance')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-md font-medium text-gray-900">Distance</h3>
              {expandedSections.distance ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {expandedSections.distance && (
              <div className="mt-3 space-y-2">
                {['1 km', '2 km', '5 km', '10 km', '25 km'].map((distance) => (
                  <label key={distance} className="flex items-center">
                    <input
                      type="radio"
                      name="distance"
                      value={distance}
                      checked={selectedDistance === distance}
                      onChange={(e) => setSelectedDistance(e.target.value)}
                      className="border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Within {distance}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Apply Button */}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors font-medium">
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
