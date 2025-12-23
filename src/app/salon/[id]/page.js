'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../../../components/Navbar';
import { useShopDetails } from '../../../hooks/useApi';
import { transformShopData, transformServiceData, transformStaffData } from '../../../utils/transformData';
import { 
  StarIcon, 
  MapPinIcon, 
  PhoneIcon, 
  ClockIcon,
  HeartIcon,
  ShareIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

export default function SalonProfile() {
  const params = useParams();
  const router = useRouter();
  const salonId = parseInt(params.id);
  
  // Fetch real shop data from API
  const { shop: apiShop, services: apiServices, staff: apiStaff, loading, error } = useShopDetails(salonId);
  
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Use API data
  let salon, services, staff;
  
  if (!loading && !error && apiShop) {
    // Transform API data
    salon = {
      ...transformShopData(apiShop),
      services: apiServices?.map(transformServiceData) || [],
      staff: apiStaff?.map(transformStaffData) || []
    };
    services = salon.services || [];
    staff = salon.staff || [];
  }
  
  // Build image array with real images from DB + fallbacks
  const salonImages = useMemo(() => {
    const images = [];
    
    // Priority 1: Banner image (hero)
    if (salon?.banner_url) {
      images.push(salon.banner_url);
    }
    
    // Priority 2: Gallery images
    if (salon?.gallery_urls && Array.isArray(salon.gallery_urls)) {
      const validGallery = salon.gallery_urls.filter(url => url);
      images.push(...validGallery);
    }
    
    // Priority 3: Logo as fallback
    if (salon?.logo_url && images.length === 0) {
      images.push(salon.logo_url);
    }
    
    // Priority 4: Old format images (if any)
    if (salon?.images && Array.isArray(salon.images) && images.length === 0) {
      images.push(...salon.images);
    }
    
    // Priority 5: Single image fallback
    if (salon?.image && images.length === 0) {
      images.push(salon.image);
    }
    
    // Final fallback: placeholder
    if (images.length === 0) {
      images.push('/s1.jpeg');
    }
    
    return images;
  }, [salon?.banner_url, salon?.gallery_urls, salon?.logo_url, salon?.images, salon?.image]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showCompactSearch={true} />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading salon details...</p>
        </div>
      </div>
    );
  }

  // Error or not found state
  if (!salon || error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showCompactSearch={true} />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Salon not found</h1>
          <p className="text-gray-600 mt-2">
            {error ? 'Unable to load salon details. Please try again.' : "The salon you're looking for doesn't exist."}
          </p>
          {error && (
            <div className="mt-4">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background-secondary)' }}>
      <Navbar showCompactSearch={true} />
      
      <div className="container-booksy section-padding-sm">
        {/* Enhanced Image Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            <div className="card-booksy overflow-hidden h-96 relative group">
              <img
                src={salonImages[selectedImageIndex]}
                alt={`${salon.name} - Image ${selectedImageIndex + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/s1.jpeg'; // Fallback on error
                }}
              />
              
              {/* Image counter badge */}
              {salonImages.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <CameraIcon className="h-4 w-4" />
                  {selectedImageIndex + 1} / {salonImages.length}
                </div>
              )}
              
              {/* Navigation arrows for desktop */}
              {salonImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? salonImages.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((prev) => (prev === salonImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              
              {/* Image Navigation Dots */}
              {salonImages.length > 1 && salonImages.length <= 10 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {salonImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        selectedImageIndex === index ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Thumbnail Gallery */}
          <div className="space-y-4">
            {salonImages.slice(1, 4).map((image, index) => (
              <div 
                key={index} 
                className="card-interactive overflow-hidden h-28 cursor-pointer relative"
                onClick={() => setSelectedImageIndex(index + 1)}
              >
                <img
                  src={image}
                  alt={`${salon.name} thumbnail ${index + 2}`}
                  className={`w-full h-full object-cover transition-all ${
                    selectedImageIndex === index + 1 ? 'ring-4 ring-teal-500' : ''
                  }`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/s1.jpeg';
                  }}
                />
              </div>
            ))}
            
            {/* "View All" button if more than 4 images */}
            {salonImages.length > 4 && (
              <button
                onClick={() => {
                  // Cycle through remaining images or show modal
                  setSelectedImageIndex(4);
                }}
                className="card-interactive overflow-hidden h-28 w-full bg-gray-900/80 hover:bg-gray-900 flex flex-col items-center justify-center text-white transition-colors"
              >
                <CameraIcon className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">+{salonImages.length - 4} more</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{salon.name}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                      <span className="font-medium">{salon.rating}</span>
                      <span className="ml-1">({salon.reviewCount} reviews)</span>
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-1" />
                      <span>{salon.address}</span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/salon/${salonId}/book`}
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium inline-block text-center"
                >
                  Book Appointment
                </Link>
              </div>
              
              <p className="text-gray-700 leading-relaxed">{salon.description}</p>
              
              <div className="mt-6 flex items-center space-x-6">
                <div className="flex items-center text-gray-600">
                  <PhoneIcon className="h-5 w-5 mr-2" />
                  <span>{salon.phone}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  <span>Open Today: {
                    (() => {
                      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                      const todaySchedule = salon.openingHours?.[today];
                      if (todaySchedule) {
                        if (typeof todaySchedule === 'string') {
                          return todaySchedule;
                        } else if (todaySchedule.isOpen && todaySchedule.open && todaySchedule.close) {
                          return `${todaySchedule.open} - ${todaySchedule.close}`;
                        } else if (todaySchedule.isOpen === false) {
                          return 'Closed';
                        }
                      }
                      return '10:00 AM - 8:00 PM';
                    })()
                  }</span>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Services & Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {salon.services?.map((service) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                    {service.image_url && (
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                        onError={(e) => { 
                          e.target.style.display = 'none'; 
                        }}
                      />
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <span className="text-lg font-bold text-teal-600">₹{service.price}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{service.duration}</p>
                    <Link
                      href={`/salon/${salonId}/book?service=${service.id}`}
                      className="w-full py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors inline-block text-center"
                    >
                      Book Now
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Photos Gallery */}
            {salonImages.length > 1 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <CameraIcon className="h-6 w-6 text-gray-900" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Photos ({salonImages.length})
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {salonImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className="card-interactive aspect-square overflow-hidden rounded-lg bg-gray-100 hover:ring-2 hover:ring-teal-500 transition-all"
                    >
                      <img
                        src={image}
                        alt={`${salon.name} - Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { 
                          e.target.onerror = null; 
                          e.target.src = '/s1.jpeg'; 
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Staff */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {salon.staff?.map((staff) => (
                  <div key={staff.id} className="text-center">
                    <img
                      src={staff.profile_image_url || staff.image || '/default-avatar.png'}
                      alt={staff.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                      onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = '/default-avatar.png'; 
                      }}
                    />
                    <h3 className="font-semibold text-gray-900 mb-1">{staff.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{staff.experience}</p>
                    <p className="text-xs text-teal-600 mb-2">
                      {staff.specialties?.join(', ') || 'General Services'}
                    </p>
                    <div className="flex items-center justify-center">
                      <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm">{staff.rating}</span>
                    </div>
                    <Link
                      href={`/book-flow?shopId=${salonId}&staffId=${staff.id}`}
                      className="mt-3 px-4 py-2 text-sm border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors inline-block text-center"
                    >
                      Book with {staff.name.split(' ')[0]}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rating</span>
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="font-medium">{salon.rating}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reviews</span>
                  <span className="font-medium">{salon.reviewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price Range</span>
                  <span className="font-medium">₹500 - ₹3000</span>
                </div>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Opening Hours</h3>
              <div className="space-y-2">
                {daysOfWeek.map((day) => {
                  const daySchedule = salon.openingHours?.[day];
                  let displayTime = 'Closed';
                  
                  if (daySchedule) {
                    if (typeof daySchedule === 'string') {
                      displayTime = daySchedule;
                    } else if (daySchedule.isOpen && daySchedule.open && daySchedule.close) {
                      displayTime = `${daySchedule.open} - ${daySchedule.close}`;
                    } else if (daySchedule.isOpen === false) {
                      displayTime = 'Closed';
                    }
                  }
                  
                  return (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="capitalize text-gray-600">{day}</span>
                      <span className="font-medium">{displayTime}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{salon.address}</span>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">{salon.phone}</span>
                </div>
              </div>
              <button className="w-full mt-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Get Directions
              </button>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}