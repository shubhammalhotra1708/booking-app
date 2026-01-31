'use client';

import { useState, useEffect } from 'react';
import SalonCard from './SalonCard';
import { Flame, Star, TrendingUp } from 'lucide-react';

export default function TrendingSalons() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('trending');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const tabs = [
    {
      id: 'trending',
      label: 'Trending Now',
      icon: <TrendingUp className="h-4 w-4" />,
      badge: 'HOT'
    },
    {
      id: 'popular',
      label: 'Most Booked',
      icon: <Flame className="h-4 w-4" />,
      badge: 'POPULAR'
    },
    {
      id: 'rated',
      label: 'Top Rated',
      icon: <Star className="h-4 w-4 fill-current" />,
      badge: 'BEST'
    }
  ];

  // Note: No image property means SalonCard will use its fallback (/s1.jpeg)
  const salonsByCategory = {
    trending: [
      {
        id: 101,
        name: "Glow Beauty Bar",
        rating: 4.8,
        reviewCount: 127,
        price: "₹₹₹",
        services: ["Hair", "Facial", "Microblading"],
        address: "Downtown Plaza",
        distance: "0.3 miles",
        isOpen: true,
        nextAvailable: "Today 1:30 PM",
        specialOffer: "Trending this week",
        badge: "🔥 TRENDING"
      },
      {
        id: 102,
        name: "Urban Zen Spa",
        rating: 4.9,
        reviewCount: 89,
        price: "₹₹₹₹",
        services: ["Massage", "Facial", "Body Wrap"],
        address: "Wellness District",
        distance: "0.8 miles",
        isOpen: true,
        nextAvailable: "Today 3:00 PM",
        badge: "🔥 TRENDING"
      },
      {
        id: 103,
        name: "Chic Hair Lounge",
        rating: 4.7,
        reviewCount: 156,
        price: "₹₹",
        services: ["Hair", "Color", "Extensions"],
        address: "Fashion Avenue",
        distance: "1.1 miles",
        isOpen: true,
        nextAvailable: "Tomorrow 10:00 AM",
        badge: "🔥 TRENDING"
      },
      {
        id: 104,
        name: "Nail Artistry Studio",
        rating: 4.6,
        reviewCount: 93,
        price: "₹₹",
        services: ["Nails", "Nail Art", "Gel"],
        address: "Creative Quarter",
        distance: "1.5 miles",
        isOpen: false,
        nextAvailable: "Tomorrow 9:00 AM",
        closingTime: "Opens 9:00 AM",
        badge: "🔥 TRENDING"
      }
    ],
    popular: [
      {
        id: 201,
        name: "Elite Hair Studio",
        rating: 4.8,
        reviewCount: 203,
        price: "₹₹₹",
        services: ["Hair", "Color", "Keratin"],
        address: "Business District",
        distance: "0.6 miles",
        isOpen: true,
        nextAvailable: "Today 2:15 PM",
        badge: "⭐ MOST BOOKED"
      },
      {
        id: 202,
        name: "Bliss Day Spa",
        rating: 4.9,
        reviewCount: 178,
        price: "₹₹₹₹",
        services: ["Spa", "Massage", "Facial"],
        address: "Luxury Row",
        distance: "1.2 miles",
        isOpen: true,
        nextAvailable: "Today 4:00 PM",
        badge: "⭐ MOST BOOKED"
      },
      {
        id: 203,
        name: "Quick & Chic Salon",
        rating: 4.5,
        reviewCount: 245,
        price: "₹₹",
        services: ["Hair", "Blowout", "Styling"],
        address: "Express Lane",
        distance: "0.9 miles",
        isOpen: true,
        nextAvailable: "Today 1:00 PM",
        badge: "⭐ MOST BOOKED"
      },
      {
        id: 204,
        name: "Perfect Nails & More",
        rating: 4.7,
        reviewCount: 167,
        price: "₹₹",
        services: ["Nails", "Pedicure", "Waxing"],
        address: "Main Street",
        distance: "0.4 miles",
        isOpen: true,
        nextAvailable: "Today 3:30 PM",
        badge: "⭐ MOST BOOKED"
      }
    ],
    rated: [
      {
        id: 301,
        name: "Platinum Beauty Salon",
        rating: 5.0,
        reviewCount: 87,
        price: "₹₹₹₹",
        services: ["Hair", "Color", "Styling"],
        address: "Premium Plaza",
        distance: "1.8 miles",
        isOpen: true,
        nextAvailable: "Tomorrow 11:00 AM",
        badge: "👑 TOP RATED"
      },
      {
        id: 302,
        name: "Serenity Wellness Spa",
        rating: 4.9,
        reviewCount: 134,
        price: "₹₹₹",
        services: ["Spa", "Massage", "Aromatherapy"],
        address: "Zen Gardens",
        distance: "2.1 miles",
        isOpen: true,
        nextAvailable: "Today 5:00 PM",
        badge: "👑 TOP RATED"
      },
      {
        id: 303,
        name: "Artisan Hair Design",
        rating: 4.9,
        reviewCount: 112,
        price: "₹₹₹",
        services: ["Hair", "Creative Color", "Cuts"],
        address: "Artist Quarter",
        distance: "1.6 miles",
        isOpen: false,
        nextAvailable: "Tomorrow 10:30 AM",
        closingTime: "Opens 10:00 AM",
        badge: "👑 TOP RATED"
      },
      {
        id: 304,
        name: "Luxe Nail Boutique",
        rating: 4.8,
        reviewCount: 98,
        price: "₹₹₹",
        services: ["Nails", "Luxury Pedicure", "Nail Art"],
        address: "Boutique Row",
        distance: "1.3 miles",
        isOpen: true,
        nextAvailable: "Today 2:45 PM",
        badge: "👑 TOP RATED"
      }
    ]
  };

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container-booksy">
        {/* Section Header with Tabs */}
        <div className={`text-center mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h2 className="heading-lg text-3xl md:text-4xl font-bold mb-6">
            Discover Popular Salons
          </h2>
          
          {/* Tab Navigation */}
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-sky-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-sky-600 hover:bg-sky-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Salons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {salonsByCategory[activeTab].map((salon, index) => (
            <div
              key={salon.id}
              className={`transition-all duration-700 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ 
                transitionDelay: `${index * 100}ms` 
              }}
            >
              <SalonCard salon={salon} />
            </div>
          ))}
        </div>

        {/* View More Button */}
        <div className="text-center mt-12">
          <button className="btn-primary px-8 py-3 font-medium">
            View All {tabs.find(tab => tab.id === activeTab)?.label} Salons
          </button>
        </div>
      </div>
    </section>
  );
}
