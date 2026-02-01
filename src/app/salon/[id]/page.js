'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../../../components/Navbar';
import { useShopDetails } from '../../../hooks/useApi';
import { transformShopData, transformServiceData, transformStaffData, transformProductData } from '../../../utils/transformData';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
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
import ReviewSection from '../../../components/ReviewSection';

export default function SalonProfile() {
  const params = useParams();
  const router = useRouter();
  const salonId = params.id ? parseInt(params.id, 10) : null;

  // Early return if no valid salon ID
  if (!salonId || isNaN(salonId)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900">There was an error while loading the Salon</h1>
          <p className="text-gray-600 mt-2">Please go back and try again.</p>
        </div>
      </div>
    );
  }
  
  // Fetch real shop data from API
  const { shop: apiShop, services: apiServices, staff: apiStaff, products: apiProducts, loading, error } = useShopDetails(salonId);

  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [genderFilter, setGenderFilter] = useState('ALL');

  // Use API data
  let salon, services, staff, products;

  if (!loading && !error && apiShop) {
    // Transform API data
    salon = {
      ...transformShopData(apiShop),
      services: apiServices?.map(transformServiceData) || [],
      staff: apiStaff?.map(transformStaffData) || [],
      products: apiProducts?.map(transformProductData) || []
    };
    services = salon.services || [];
    staff = salon.staff || [];
    products = salon.products || [];
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
      
      <div className="container-booksy px-3 sm:px-4 py-4 sm:py-6">
        {/* Enhanced Image Gallery */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          {/* Main Image */}
          <div className="card-booksy overflow-hidden h-64 sm:h-80 lg:h-96 relative group mb-3 sm:mb-4">
            <img
              src={salonImages[selectedImageIndex]}
              alt={`${salon.name} - Image ${selectedImageIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/s1.jpeg';
              }}
            />
            
            {/* Image counter badge */}
            {salonImages.length > 1 && (
              <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/60 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                <CameraIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                {selectedImageIndex + 1} / {salonImages.length}
              </div>
            )}
            
            {/* Navigation arrows - visible on mobile, hover on desktop */}
            {salonImages.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? salonImages.length - 1 : prev - 1))}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 sm:p-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelectedImageIndex((prev) => (prev === salonImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 sm:p-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Image Navigation Dots */}
            {salonImages.length > 1 && salonImages.length <= 10 && (
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1.5 sm:space-x-2">
                {salonImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-2 sm:h-3 rounded-full transition-all ${
                      selectedImageIndex === index ? 'bg-white w-6 sm:w-8' : 'bg-white/50 hover:bg-white/75 w-2 sm:w-3'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Horizontal Thumbnail Gallery */}
          <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{salon.name}</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
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
              
              <p className="text-xs sm:text-sm lg:text-base text-gray-700 leading-relaxed">{salon.description}</p>
              
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <div className="flex items-center text-gray-600 text-xs sm:text-sm">
                  <PhoneIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span>{salon.phone}</span>
                </div>
                <div className="flex items-center text-gray-600 text-xs sm:text-sm">
                  <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
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
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Services & Pricing</h2>
                
                {/* Gender Filter Tabs */}
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-2 sm:pb-0">
                  <button
                    onClick={() => setGenderFilter('ALL')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      genderFilter === 'ALL'
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Services
                  </button>
                  <button
                    onClick={() => setGenderFilter('MALE')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      genderFilter === 'MALE'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Men
                  </button>
                  <button
                    onClick={() => setGenderFilter('FEMALE')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      genderFilter === 'FEMALE'
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Women
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {salon.services?.filter((service) => {
                  // Filter by gender
                  if (genderFilter === 'ALL') return true;
                  const serviceGender = service.targetgender?.[0] || service.targetGender?.[0];
                  return serviceGender === genderFilter || serviceGender === 'ALL';
                }).map((service) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-3 sm:p-3 sm:p-4">
                    {service.image_url && (
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-24 sm:h-32 object-cover rounded-lg mb-2 sm:mb-3"
                        onError={(e) => { 
                          e.target.style.display = 'none'; 
                        }}
                      />
                    )}
                    <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                      <div className="flex-1">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">{service.name}</h3>
                        {/* Gender Badge */}
                        {(() => {
                          const gender = service.targetgender?.[0] || service.targetGender?.[0] || 'ALL';
                          if (gender === 'MALE') {
                            return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">Men</span>;
                          } else if (gender === 'FEMALE') {
                            return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-50 text-pink-700">Women</span>;
                          } else {
                            return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">Unisex</span>;
                          }
                        })()}
                      </div>
                      <span className="text-base sm:text-lg font-bold text-teal-600">₹{service.price}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">{service.duration}</p>
                    <Link
                      href={`/salon/${salonId}/book?service=${service.id}`}
                      className="w-full py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors inline-block text-center text-xs sm:text-sm font-medium"
                    >
                      Book Now
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Products */}
            {products && products.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-6">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <ShoppingBagIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-900" />
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Products</h2>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mb-4">Available for purchase during your visit</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-24 sm:h-32 object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-24 sm:h-32 bg-gray-100 flex items-center justify-center">
                          <ShoppingBagIcon className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                      <div className="p-2 sm:p-3">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                        {product.category && (
                          <span className="text-xs text-gray-500">{product.category}</span>
                        )}
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-sm sm:text-base font-bold text-teal-600">₹{product.price}</span>
                          {product.track_inventory && !product.in_stock && (
                            <span className="text-xs text-red-500">Out of stock</span>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Our Team</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {salon.staff?.map((staffMember) => (
                  <div key={staffMember.id} className="flex flex-col items-center text-center h-full">
                    {/* Staff Avatar - with proper fallback to user icon */}
                    {staffMember.profile_image_url || staffMember.image ? (
                      <img
                        src={staffMember.profile_image_url || staffMember.image}
                        alt={staffMember.name}
                        className="w-24 h-24 rounded-full mb-4 object-cover border-2 border-gray-100 flex-shrink-0"
                        onError={(e) => {
                          // Hide broken image and show fallback
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    {/* Fallback user icon - shown when no image or image fails to load */}
                    <div
                      className={`w-24 h-24 rounded-full mb-4 bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center border-2 border-teal-100 flex-shrink-0 ${staffMember.profile_image_url || staffMember.image ? 'hidden' : ''}`}
                    >
                      <svg className="w-12 h-12 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    {/* Staff Info - fixed height sections for alignment */}
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1" title={staffMember.name}>{staffMember.name}</h3>
                    <p className="text-sm text-gray-600 mb-2 h-5">{staffMember.experience}</p>
                    <p className="text-xs text-teal-600 mb-2 h-8 line-clamp-2 px-2" title={staffMember.specialties?.join(', ') || 'General Services'}>
                      {staffMember.specialties?.join(', ') || 'General Services'}
                    </p>
                    <div className="flex items-center justify-center mb-2">
                      <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm">{staffMember.rating}</span>
                    </div>
                    {/* Book button at bottom - auto margin pushes to bottom */}
                    <Link
                      href={`/salon/${salonId}/book`}
                      className="mt-auto px-4 py-2 text-sm border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors inline-block text-center"
                    >
                      Book with {staffMember.name.split(' ')[0]}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <ReviewSection shopId={salonId} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-3 sm:p-4 lg:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Info</h3>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
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
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Opening Hours</h3>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
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
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Contact</h3>
              <div className="space-y-2 sm:space-y-2 sm:space-y-3">
                <div className="flex items-start">
                  <MapPinIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-600">{salon.address}</span>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3" />
                  <span className="text-xs sm:text-sm text-gray-600">{salon.phone}</span>
                </div>
              </div>
              <button className="w-full mt-3 sm:mt-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium">
                Get Directions
              </button>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}