'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Star, 
  MapPin,
  CheckCircle,
  Clock
} from 'lucide-react';
import { salonDetails } from '@/data/mockData';
import { useShopDetails } from '@/hooks/useApi';
import { transformShopData, transformServiceData } from '@/utils/transformData';


export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const salonId = parseInt(params.id);
  
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Start with mock data for fast load
  const [salon, setSalon] = useState(salonDetails[salonId] || salonDetails[1]);
  const [services, setServices] = useState(salon?.services || []);
  
  useEffect(() => {
    // Load real data progressively
    const loadRealData = async () => {
      try {
        setLoading(true);
        
        // Fetch basic shop info first
        const shopResponse = await fetch(`/api/shops?shop_id=${salonId}&basic=true`);
        const shopResult = await shopResponse.json();
        
        if (shopResult.success && shopResult.data?.[0]) {
          const realSalon = transformShopData(shopResult.data[0]);
          setSalon(prev => ({ ...prev, ...realSalon }));
        }
        
        // Then fetch services
        const servicesResponse = await fetch(`/api/services?shop_id=${salonId}`);
        const servicesResult = await servicesResponse.json();
        
        if (servicesResult.success && servicesResult.data) {
          const realServices = servicesResult.data.map(transformServiceData);
          setServices(realServices);
        }
        
      } catch (err) {
        setError('Using sample data');
      } finally {
        setLoading(false);
      }
    };
    
    if (salonId) {
      loadRealData();
    }
  }, [salonId]);

  const handleServiceSelect = (service) => {
    // Redirect to new page-based booking flow
    router.push(`/book-flow?shop_id=${salonId}&service_id=${service.id}&step=1`);
  };

  const handleBookingSuccess = (booking) => {
    setBookingDetails(booking);
    setBookingSuccess(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load salon details</p>
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-800"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-gray-600 mb-6">
              Your appointment has been successfully booked.
            </p>
            
            {bookingDetails && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold mb-2">Booking Details:</h3>
                <p><strong>Service:</strong> {selectedService?.name}</p>
                <p><strong>Date:</strong> {new Date(bookingDetails.booking_date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {bookingDetails.booking_time}</p>
                <p><strong>Salon:</strong> {salon.name}</p>
                <p><strong>Booking ID:</strong> {bookingDetails.id}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/booking-status?booking_id=${bookingDetails?.id}`)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Booking Status
              </button>
              <Link
                href="/"
                className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link
              href="/"
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">
              Book Appointment
            </h1>
          </div>
        </div>
      </div>

      {/* Salon Information */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start space-x-4">
            <img
              src={salon.logo_url || salon.banner_url || salon.image || '/s1.jpeg'}
              alt={salon.name}
              className="w-20 h-20 rounded-lg object-cover"
              onError={(e) => { 
                e.target.onerror = null; 
                e.target.src = '/s1.jpeg'; 
              }}
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{salon.name}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                  <span>{salon.rating}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{salon.address}</span>
                </div>
              </div>
              <p className="text-gray-700">{salon.description}</p>
            </div>
          </div>
        </div>

        {/* Service Selection */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Choose a Service
            </h3>
            <p className="text-gray-600 mt-1">
              Select the service you'd like to book
            </p>
          </div>
          
          <div className="p-6">
            {services.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No services available at this salon.
              </p>
            ) : (
              <div className="grid gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleServiceSelect(service)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4 flex-1">
                        {service.image_url && (
                          <img
                            src={service.image_url}
                            alt={service.name}
                            className="w-16 h-16 rounded-lg object-cover"
                            onError={(e) => { 
                              e.target.style.display = 'none'; 
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {service.name}
                          </h4>
                          <p className="text-gray-600 text-sm mb-3">
                            {service.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{service.duration}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="mr-1">₹</span>
                              <span>{service.price}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}