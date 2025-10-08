'use client';

import { useState, useEffect } from 'react';
import { Search, Store, Calendar, CheckCircle } from 'lucide-react';

export default function HowItWorks() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const steps = [
    {
      id: 1,
      title: "Choose Your Service",
      description: "Browse through hundreds of beauty services including hair, nails, massage, facial treatments and more",
      icon: <Search className="h-8 w-8" />,
      gradient: "from-pink-400 to-rose-500",
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600"
    },
    {
      id: 2,
      title: "Select Your Salon",
      description: "Pick from top-rated salons near you with real reviews, photos, and availability in real-time",
      icon: <Store className="h-8 w-8" />,
      gradient: "from-blue-400 to-indigo-500",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      id: 3,
      title: "Book Your Appointment",
      description: "Choose your preferred time slot and book instantly. Get confirmation and reminders via SMS",
      icon: <Calendar className="h-8 w-8" />,
      gradient: "from-emerald-400 to-teal-500",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container-booksy">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h2 className="heading-lg text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-body text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Book your perfect beauty appointment in just 3 simple steps
          </p>
          
          {/* Success Badge */}
          <div className="inline-flex items-center bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-200">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Over 10,000 appointments booked monthly</span>
          </div>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Lines - Hidden on mobile */}
          <div className="hidden md:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
            <div className="flex justify-between items-center px-32">
              <div className="w-24 h-0.5 bg-gradient-to-r from-pink-300 to-blue-300"></div>
              <div className="w-24 h-0.5 bg-gradient-to-r from-blue-300 to-emerald-300"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`text-center transition-all duration-700 ${
                  isVisible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ 
                  transitionDelay: `${index * 200}ms` 
                }}
              >
                {/* Step Number Circle */}
                <div className="relative mb-6">
                  <div className={`w-20 h-20 mx-auto ${step.bgColor} rounded-full flex items-center justify-center relative z-10 border-4 border-white shadow-lg`}>
                    <div className={`${step.iconColor}`}>
                      {step.icon}
                    </div>
                  </div>
                  
                  {/* Step Number Badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg z-20">
                    {step.id}
                  </div>
                </div>

                {/* Content */}
                <div className="px-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Visual Enhancement */}
                <div className="mt-6">
                  <div className={`h-1 w-16 mx-auto rounded-full bg-gradient-to-r ${step.gradient}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className={`text-center mt-16 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`} style={{ transitionDelay: '800ms' }}>
          <button className="btn-primary px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
            Start Booking Now
          </button>
          <p className="text-sm text-gray-500 mt-3">
            No registration required • Instant confirmation • Free cancellation
          </p>
        </div>

        {/* Features Grid */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t border-gray-100 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`} style={{ transitionDelay: '1000ms' }}>
          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-sm font-semibold text-gray-800 mb-1">Instant Booking</div>
            <div className="text-xs text-gray-600">Book in under 60 seconds</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🔒</div>
            <div className="text-sm font-semibold text-gray-800 mb-1">Secure Payment</div>
            <div className="text-xs text-gray-600">Protected transactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">📱</div>
            <div className="text-sm font-semibold text-gray-800 mb-1">SMS Reminders</div>
            <div className="text-xs text-gray-600">Never miss appointments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">❌</div>
            <div className="text-sm font-semibold text-gray-800 mb-1">Free Cancellation</div>
            <div className="text-xs text-gray-600">Cancel up to 24h before</div>
          </div>
        </div>
      </div>
    </section>
  );
}
