'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import ReviewSection from '../../../components/ReviewSection';
import { useShopDetails } from '../../../hooks/useApi';
import { transformShopData, transformServiceData, transformStaffData } from '../../../utils/transformData';
// Keep as fallback
import { salonDetails, reviews } from '../../../data/mockData';
import { 
  StarIcon, 
  MapPinIcon, 
  PhoneIcon, 
  ClockIcon,
  HeartIcon,
  ShareIcon 
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

  // Use API data or fallback to mock data
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
  } else {
    // Fallback to mock data
    salon = salonDetails[salonId];
    services = salon?.services || [];
    staff = salon?.staff || [];
  }
  
  const salonReviews = reviews.filter(review => review.salonId === salonId);

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
  if (!salon || (error && !salonDetails[salonId])) {
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
            <div className="card-booksy overflow-hidden h-96 relative">
              <img
                src={salon.images?.[selectedImageIndex] || salon.image || '/s1.jpeg'}
                alt={salon.name}
                className="w-full h-full object-cover"
              />
              {/* Image Navigation Dots */}
              {salon.images && salon.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {salon.images?.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        selectedImageIndex === index ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Thumbnail Gallery */}
          <div className="space-y-4">
            {salon.images.slice(1, 4).map((image, index) => (
              <div 
                key={index} 
                className="card-interactive overflow-hidden h-28 cursor-pointer"
                onClick={() => setSelectedImageIndex(index + 1)}
              >
                <img
                  src={image}
                  alt={`${salon.name} ${index + 2}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
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

            {/* Staff */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {salon.staff?.map((staff) => (
                  <div key={staff.id} className="text-center">
                    <img
                      src={staff.image}
                      alt={staff.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
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
                      href={`/salon/${salonId}/book?staff=${staff.id}`}
                      className="mt-3 px-4 py-2 text-sm border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors inline-block text-center"
                    >
                      Book with {staff.name.split(' ')[0]}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <ReviewSection 
              reviews={salonReviews}
              averageRating={salon.rating}
              totalReviews={salon.reviewCount}
            />
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
