'use client';

import { useState, useEffect } from 'react';

export default function TopCategories() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const categories = [
    {
      id: 1,
      name: 'Hair',
      icon: '💇‍♀️',
      description: 'Cuts, Color & Styling',
      salonCount: 120,
      dealsCount: 25,
      gradient: 'from-pink-400 to-rose-500',
      hoverGradient: 'group-hover:from-pink-500 group-hover:to-rose-600'
    },
    {
      id: 2,
      name: 'Nails',
      icon: '💅',
      description: 'Manicure & Pedicure',
      salonCount: 85,
      dealsCount: 18,
      gradient: 'from-purple-400 to-indigo-500',
      hoverGradient: 'group-hover:from-purple-500 group-hover:to-indigo-600'
    },
    {
      id: 3,
      name: 'Massage',
      icon: '💆‍♀️',
      description: 'Relaxation & Therapy',
      salonCount: 65,
      dealsCount: 12,
      gradient: 'from-emerald-400 to-teal-500',
      hoverGradient: 'group-hover:from-emerald-500 group-hover:to-teal-600'
    },
    {
      id: 4,
      name: 'Spa',
      icon: '🧖‍♀️',
      description: 'Full Body Wellness',
      salonCount: 45,
      dealsCount: 15,
      gradient: 'from-blue-400 to-cyan-500',
      hoverGradient: 'group-hover:from-blue-500 group-hover:to-cyan-600'
    },
    {
      id: 5,
      name: 'Skin Care',
      icon: '✨',
      description: 'Facials & Treatments',
      salonCount: 78,
      dealsCount: 22,
      gradient: 'from-amber-400 to-orange-500',
      hoverGradient: 'group-hover:from-amber-500 group-hover:to-orange-600'
    },
    {
      id: 6,
      name: 'Bridal',
      icon: '👰‍♀️',
      description: 'Special Occasion',
      salonCount: 35,
      dealsCount: 8,
      gradient: 'from-rose-400 to-pink-500',
      hoverGradient: 'group-hover:from-rose-500 group-hover:to-pink-600'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container-booksy">
        {/* Section Header */}
        <div className={`text-center mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h2 className="heading-lg text-3xl md:text-4xl font-bold mb-4">
            Explore Services
          </h2>
          <p className="text-body text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the perfect beauty and wellness services for you
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className={`group cursor-pointer transition-all duration-700 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ 
                transitionDelay: `${index * 100}ms` 
              }}
            >
              <div className={`relative bg-gradient-to-br ${category.gradient} ${category.hoverGradient} rounded-2xl p-6 h-32 md:h-36 flex flex-col justify-between text-white transition-all duration-300 hover:scale-105 hover:shadow-xl transform`}>
                {/* Icon */}
                <div className="text-3xl md:text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  {category.icon}
                </div>
                
                {/* Category Info */}
                <div>
                  <h3 className="font-bold text-lg md:text-xl mb-1">
                    {category.name}
                  </h3>
                  <p className="text-xs md:text-sm opacity-90 mb-2">
                    {category.description}
                  </p>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs opacity-80">
                    <span>{category.salonCount} salons</span>
                    <span>{category.dealsCount} deals</span>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-2xl transition-all duration-300"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
