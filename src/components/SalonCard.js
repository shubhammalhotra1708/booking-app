'use client';

import Link from 'next/link';
import { StarIcon, MapPinIcon, ClockIcon, HeartIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon, ClockIcon as ClockOutlineIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function SalonCard({ salon }) {
  const [isFavorited, setIsFavorited] = useState(false);

  // Ensure consistent pricing display
  const displayPrice = salon.price || salon.priceRange || '$$';
  
  // Limit services display and calculate overflow
  const maxServices = 2;
  const displayServices = salon.services.slice(0, maxServices);
  const extraServicesCount = Math.max(0, salon.services.length - maxServices);

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 group h-[380px] flex flex-col">
      {/* Image Container - Fixed Height */}
      <div className="relative h-32 overflow-hidden flex-shrink-0">
        <img
          src={salon.image}
          alt={salon.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-lg ${
            salon.isOpen 
              ? 'bg-emerald-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {salon.isOpen ? '● OPEN' : '● CLOSED'}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => setIsFavorited(!isFavorited)}
          className="absolute top-3 left-3 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all hover:scale-110 hover:bg-white"
        >
          {isFavorited ? (
            <HeartIcon className="h-4 w-4 text-red-500" />
          ) : (
            <HeartOutlineIcon className="h-4 w-4 text-gray-600" />
          )}
        </button>

        {/* Distance Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="px-2 py-1 text-white text-xs font-medium rounded-md bg-black/70 backdrop-blur-sm">
            {salon.distance}
          </span>
        </div>

        {/* Special Offer Badge */}
        {salon.specialOffer && (
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-1 text-xs font-bold bg-orange-500 text-white rounded-md shadow-lg">
              {salon.specialOffer}
            </span>
          </div>
        )}
      </div>

      {/* Content Container - Flexible Height */}
      <div className="p-4 flex flex-col flex-1">
        {/* Header - Fixed Height */}
        <div className="flex justify-between items-start mb-3 min-h-[40px]">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 flex-1 mr-3 leading-tight">
            {salon.name}
          </h3>
          <div className="flex items-center flex-shrink-0 bg-yellow-50 px-2.5 py-1.5 rounded-full border border-yellow-200">
            <StarIcon className="h-3 w-3 text-yellow-500" />
            <span className="text-xs font-bold ml-1 text-gray-900">
              {salon.rating}
            </span>
            <span className="text-xs text-gray-500 ml-0.5">
              ({salon.reviewCount})
            </span>
          </div>
        </div>

        {/* Location & Price - Fixed Height */}
        <div className="flex items-center justify-between mb-3 h-5">
          <div className="flex items-center flex-1 min-w-0">
            <MapPinIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-600 ml-1 truncate">{salon.address}</span>
          </div>
          <div className="flex items-center ml-2 flex-shrink-0">
            <span className="text-xs font-bold text-emerald-600">
              {displayPrice}
            </span>
          </div>
        </div>

        {/* Services - Fixed Height Container */}
        <div className="mb-3 h-8 flex items-start">
          <div className="flex flex-wrap gap-1">
            {displayServices.map((service, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200"
              >
                {service}
              </span>
            ))}
            {extraServicesCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                +{extraServicesCount} more
              </span>
            )}
          </div>
        </div>

        {/* Availability - Fixed Height */}
        <div className="mb-4 h-6 flex items-center">
          <ClockIcon className="h-3 w-3 text-gray-400 mr-1" />
          <span className="text-xs text-gray-600">
            {salon.nextAvailable || 'Call for availability'}
          </span>
        </div>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1"></div>

        {/* Action Buttons - Fixed at Bottom */}
        <div className="flex space-x-2 mt-auto">
          <Link
            href={`/salon/${salon.id}`}
            className="flex-1 py-2.5 px-3 text-center text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
          >
            Details
          </Link>
          <Link
            href={`/salon/${salon.id}/book`}
            className="flex-1 py-2.5 px-3 text-center text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
