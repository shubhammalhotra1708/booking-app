'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserIcon, Bars3Icon, XMarkIcon, MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';

export default function Navbar({ showCompactSearch = false }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showScrollSearch, setShowScrollSearch] = useState(false);
  const [location, setLocation] = useState('');
  const [service, setService] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      // Show search bar when user scrolls past the hero section (approximately 500px)
      const scrolled = window.scrollY > 500;
      setShowScrollSearch(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        showScrollSearch || showCompactSearch 
          ? 'bg-gray-50/95 backdrop-blur-md' 
          : 'bg-transparent'
      }`}
      style={{ 
        boxShadow: showScrollSearch || showCompactSearch 
          ? '0 2px 10px -2px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)' 
          : 'none',
        borderBottom: showScrollSearch || showCompactSearch 
          ? '1px solid rgba(229, 231, 235, 0.6)' 
          : 'none',
        borderRadius: '0',
        backdropFilter: !showScrollSearch && !showCompactSearch ? 'blur(10px)' : 'none'
      }}
    >
      <div className="container-booksy">
        <div className="flex justify-between items-center h-16 py-3">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link 
              href="/" 
              className={`text-xl font-semibold transition-colors ${
                showScrollSearch || showCompactSearch ? 'text-sky-500' : 'text-gray-800'
              }`}
            >
              BeautyBook
            </Link>
          </div>

          {/* Scroll-based Search Bar or Compact Search */}
          {(showScrollSearch || showCompactSearch) && (
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full flex items-center">
                <div className="flex w-full h-10 rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb', background: 'white', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
                  {/* Location Input */}
                  <div className="flex-1 flex items-center border-r border-gray-200 px-3">
                    <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="flex-1 ml-2 text-sm border-0 focus:ring-0 focus:outline-none text-gray-700 bg-transparent"
                    />
                  </div>
                  
                  {/* Service Input */}
                  <div className="flex-1 flex items-center px-3">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="flex-1 ml-2 text-sm border-0 focus:ring-0 focus:outline-none text-gray-700 bg-transparent"
                    />
                  </div>
                </div>
                
                {/* Search Button - Separate with margin */}
                <button className="ml-3 h-10 px-6 bg-sky-500 text-white text-sm font-medium rounded-xl hover:bg-sky-600 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5">
                  Search
                </button>
              </div>
            </div>
          )}

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/business" 
              className={`text-sm font-medium transition-colors ${
                showScrollSearch || showCompactSearch 
                  ? 'text-gray-700 hover:text-gray-900' 
                  : 'text-gray-800 hover:text-gray-900'
              }`}
            >
              For Business
            </Link>
            <Link 
              href="/help" 
              className={`text-sm font-medium transition-colors ${
                showScrollSearch || showCompactSearch 
                  ? 'text-gray-700 hover:text-gray-900' 
                  : 'text-gray-800 hover:text-gray-900'
              }`}
            >
              Help
            </Link>
            
            {/* Single User Account Element */}
            <div className="flex items-center">
              <button 
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  showScrollSearch || showCompactSearch 
                    ? 'hover:bg-gray-100 border border-gray-200 hover:border-gray-300' 
                    : 'hover:bg-gray-100 border border-gray-300 hover:border-gray-400'
                }`}
              >
                <span className="text-lg">👤</span>
                <span 
                  className={`text-sm font-medium transition-colors ${
                    showScrollSearch || showCompactSearch 
                      ? 'text-gray-700' 
                      : 'text-gray-800'
                  }`}
                >
                  Account
                </span>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 transition-colors ${
                showScrollSearch || showCompactSearch 
                  ? 'text-gray-700 hover:text-gray-900' 
                  : 'text-gray-800 hover:text-gray-900'
              }`}
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar - shows on scroll or compact mode */}
        {(showScrollSearch || showCompactSearch) && (
          <div className="md:hidden pb-6 pt-2">
            <div className="space-y-3">
              {/* Location Input */}
              <div className="relative">
                <div className="flex items-center h-10 rounded-lg px-3" style={{ border: '1px solid #e5e7eb', background: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)' }}>
                  <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-1 ml-2 text-sm border-0 focus:ring-0 focus:outline-none text-gray-700 bg-transparent"
                  />
                </div>
              </div>
              
              {/* Service Input with Button */}
              <div className="relative flex items-center space-x-3">
                <div className="flex-1 flex items-center h-10 rounded-lg px-3" style={{ border: '1px solid #e5e7eb', background: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)' }}>
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="flex-1 ml-2 text-sm border-0 focus:ring-0 focus:outline-none text-gray-700 bg-transparent"
                  />
                </div>
                <button className="h-10 px-6 bg-sky-500 text-white text-sm font-medium rounded-lg hover:bg-sky-600 transition-all duration-200 shadow-sm hover:shadow-md">
                  Search
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden animate-slide-up" style={{ background: 'var(--background)', borderTop: '1px solid var(--border-light)' }}>
          <div className="px-6 pt-4 pb-6 space-y-2">
            <Link
              href="/business"
              className="block px-4 py-3 text-body hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50"
            >
              For Business
            </Link>
            <Link
              href="/help"
              className="block px-4 py-3 text-body hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50"
            >
              Help
            </Link>
            <Link
              href="/login"
              className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50 text-center"
            >
              👤 Account
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
