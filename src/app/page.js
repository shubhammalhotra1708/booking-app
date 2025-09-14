'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FeaturedSalons from '../components/FeaturedSalons';
import PromotionsDeals from '../components/PromotionsDeals';
import CustomerTestimonials from '../components/CustomerTestimonials';
import HowItWorks from '../components/HowItWorks';
import FilterSidebar from '../components/FilterSidebar';
import SalonGrid from '../components/SalonGrid';
import { featuredSalons } from '../data/mockData';

export default function Home() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #f8fafc 0%, #ffffff 30%, #f9fafb 100%)' }}>
      <Navbar />
      <HeroSection />
      
      {/* Featured Salons - Immediately visible */}
      <FeaturedSalons />
      
      {/* Promotions & Deals Section */}
      <PromotionsDeals />
      
      {/* Customer Testimonials Section */}
      <CustomerTestimonials />
      
      {/* How It Works Section */}
      <HowItWorks />
      
      {/* Scroll trigger point - invisible element to trigger search bar */}
      <div id="services-section" className="absolute" style={{ top: '400px' }}></div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-teal-400 mb-4">BeautyBook</h3>
              <p className="text-gray-300">
                Find and book the best beauty services near you. Trusted by thousands across India.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Customers</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Download App</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Business</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Partner with us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Business App</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Resources</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 BeautyBook. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}