'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, MessageCircle } from 'lucide-react';

export default function CustomerTestimonials() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-rotate testimonials
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      initials: "SJ",
      bgColor: "bg-pink-500",
      rating: 5,
      review: "Amazing experience! The booking was so easy and the stylist was incredibly talented. My hair has never looked better. Highly recommend this platform!",
      service: "Hair Color & Cut",
      salon: "Luxe Beauty Studio",
      location: "Downtown",
      date: "2 weeks ago"
    },
    {
      id: 2,
      name: "Emily Chen",
      initials: "EC",
      bgColor: "bg-teal-500",
      rating: 5,
      review: "I love how convenient it is to find and book spa appointments. The massage therapist was professional and the ambiance was perfect for relaxation.",
      service: "Full Body Massage",
      salon: "Zen Day Spa",
      location: "Wellness District",
      date: "1 week ago"
    },
    {
      id: 3,
      name: "Jessica Martinez",
      initials: "JM",
      bgColor: "bg-purple-500",
      rating: 5,
      review: "Found the perfect nail salon through this app! The staff was friendly, the place was clean, and my nails look absolutely stunning. Will definitely book again!",
      service: "Gel Manicure & Pedicure",
      salon: "Perfect Nails",
      location: "Fashion District",
      date: "3 days ago"
    },
    {
      id: 4,
      name: "Amanda Rodriguez",
      initials: "AR",
      bgColor: "bg-orange-500",
      rating: 5,
      review: "The facial treatment exceeded my expectations! Easy booking, great communication, and my skin is glowing. This platform makes self-care so accessible.",
      service: "Anti-Aging Facial",
      salon: "Glow Beauty Bar",
      location: "Uptown",
      date: "5 days ago"
    },
    {
      id: 5,
      name: "Rachel Thompson",
      initials: "RT",
      bgColor: "bg-blue-500",
      rating: 5,
      review: "Booked my wedding hair and makeup through this platform. The coordination was seamless and I felt absolutely beautiful on my special day. Thank you!",
      service: "Bridal Package",
      salon: "Elegance Bridal Studio",
      location: "Wedding District",
      date: "1 month ago"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <section className="py-12 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <div className="container-booksy">
        {/* Section Header */}
        <div className={`text-center mb-8 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h2 className="heading-lg text-2xl md:text-3xl font-bold mb-3">
            What Our Customers Say
          </h2>
          <p className="text-body text-gray-600 max-w-xl mx-auto">
            Real reviews from satisfied customers
          </p>
        </div>

        {/* Testimonials Slider */}
        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden rounded-2xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="w-full flex-shrink-0"
                >
                  <div className={`bg-white rounded-2xl p-5 md:p-6 shadow-lg border border-gray-100 transition-all duration-700 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}>
                    {/* Rating & Quote Icon Combined */}
                    <div className="flex justify-center items-center mb-4">
                      <div className="flex items-center space-x-1 bg-yellow-50 px-3 py-1 rounded-full">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>

                    {/* Review Text - More Compact */}
                    <blockquote className="text-gray-700 text-base leading-relaxed text-center mb-5 italic">
                      "{testimonial.review}"
                    </blockquote>

                    {/* Customer Info - More Compact */}
                    <div className="flex items-center justify-center space-x-3 mb-3">
                      <div className={`w-10 h-10 rounded-full ${testimonial.bgColor} flex items-center justify-center border-2 border-gray-200`}>
                        <span className="text-white font-semibold text-sm">{testimonial.initials}</span>
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold text-gray-900 text-sm">{testimonial.name}</h4>
                        <p className="text-xs text-gray-500">{testimonial.date}</p>
                      </div>
                    </div>

                    {/* Service Info - Compact */}
                    <div className="text-center">
                      <p className="text-xs text-sky-600 font-medium">{testimonial.service}</p>
                      <p className="text-xs text-gray-500">
                        {testimonial.salon}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border border-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border border-gray-100"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentSlide === index 
                  ? 'bg-sky-500 scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Compact Trust Stats */}
        <div className={`flex justify-center items-center space-x-8 mt-8 pt-6 border-t border-gray-200 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`} style={{ transitionDelay: '400ms' }}>
          <div className="text-center">
            <div className="text-2xl font-bold text-sky-600">4.9★</div>
            <div className="text-xs text-gray-600">Avg Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-sky-600">50k+</div>
            <div className="text-xs text-gray-600">Customers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-sky-600">15k+</div>
            <div className="text-xs text-gray-600">Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-sky-600">98%</div>
            <div className="text-xs text-gray-600">Satisfied</div>
          </div>
        </div>
      </div>
    </section>
  );
}
