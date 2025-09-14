'use client';

import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, TagIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function PromotionsDeals() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const deals = [
    {
      id: 1,
      title: '20% Off First Visit',
      description: 'New customers get 20% off their first appointment',
      image: '/api/placeholder/400/200',
      validUntil: 'Valid until Dec 31',
      salonsCount: 45,
      gradient: 'from-red-400 to-pink-500',
      badge: 'NEW CUSTOMER',
      badgeColor: 'bg-red-500'
    },
    {
      id: 2,
      title: 'Holiday Spa Package',
      description: 'Massage + Facial + Manicure combo deals',
      image: '/api/placeholder/400/200',
      validUntil: 'Limited time offer',
      salonsCount: 28,
      gradient: 'from-emerald-400 to-teal-500',
      badge: 'COMBO DEAL',
      badgeColor: 'bg-emerald-500'
    },
    {
      id: 3,
      title: 'Bridal Beauty Package',
      description: 'Complete bridal preparation services',
      image: '/api/placeholder/400/200',
      validUntil: 'Book 30 days ahead',
      salonsCount: 18,
      gradient: 'from-purple-400 to-pink-500',
      badge: 'SPECIAL EVENT',
      badgeColor: 'bg-purple-500'
    },
    {
      id: 4,
      title: 'Student Discounts',
      description: '15% off with valid student ID',
      image: '/api/placeholder/400/200',
      validUntil: 'Year-round offer',
      salonsCount: 67,
      gradient: 'from-blue-400 to-indigo-500',
      badge: 'STUDENT',
      badgeColor: 'bg-blue-500'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(deals.length / 2));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(deals.length / 2)) % Math.ceil(deals.length / 2));
  };

  return (
    <section className="py-16 bg-white">
      <div className="container-booksy">
        {/* Section Header */}
        <div className={`flex justify-between items-center mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <div>
            <h2 className="heading-lg text-3xl md:text-4xl font-bold mb-2">
              Current Promotions
            </h2>
            <p className="text-body text-lg text-gray-600">
              Don't miss out on these amazing deals
            </p>
          </div>
          
          {/* Navigation */}
          <div className="hidden md:flex space-x-2">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Deals Carousel */}
        <div className="relative">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {Array.from({ length: Math.ceil(deals.length / 2) }, (_, slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {deals.slice(slideIndex * 2, (slideIndex + 1) * 2).map((deal, index) => (
                      <div
                        key={deal.id}
                        className={`group cursor-pointer transition-all duration-700 ${
                          isVisible 
                            ? 'opacity-100 translate-y-0' 
                            : 'opacity-0 translate-y-8'
                        }`}
                        style={{ 
                          transitionDelay: `${(slideIndex * 2 + index) * 150}ms` 
                        }}
                      >
                        <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                          {/* Image with Gradient Overlay */}
                          <div className="relative h-48">
                            <img
                              src={deal.image}
                              alt={deal.title}
                              className="w-full h-full object-cover"
                            />
                            <div className={`absolute inset-0 bg-gradient-to-br ${deal.gradient} opacity-80`}></div>
                            
                            {/* Badge */}
                            <div className="absolute top-4 left-4">
                              <span className={`${deal.badgeColor} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg`}>
                                {deal.badge}
                              </span>
                            </div>

                            {/* Deal Icon */}
                            <div className="absolute top-4 right-4">
                              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                                <TagIcon className="h-5 w-5 text-white" />
                              </div>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-sky-600 transition-colors">
                              {deal.title}
                            </h3>
                            <p className="text-gray-600 mb-4">
                              {deal.description}
                            </p>
                            
                            {/* Details */}
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-sm text-gray-500">
                                {deal.validUntil}
                              </span>
                              <span className="text-sm font-medium text-sky-600">
                                {deal.salonsCount} participating salons
                              </span>
                            </div>

                            {/* CTA Button */}
                            <button className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:shadow-lg">
                              View Deals
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Navigation Dots */}
          <div className="md:hidden flex justify-center mt-6 space-x-2">
            {Array.from({ length: Math.ceil(deals.length / 2) }, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentSlide === index ? 'bg-sky-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-8">
          <button className="btn-secondary px-8 py-3 font-medium">
            View All Promotions
          </button>
        </div>
      </div>
    </section>
  );
}
