'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Menu, X, Search, ChevronDown } from 'lucide-react';
import { getCurrentUser, signOut, ensureCustomerRecord } from '@/lib/auth-helpers';

export default function Navbar({ showCompactSearch = false }) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showScrollSearch, setShowScrollSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  // Compute search disabled state
  const searchDisabled = !searchQuery.trim();

  useEffect(() => {
    const handleScroll = () => {
      // Show search bar when user scrolls past the hero section (approximately 500px)
      const scrolled = window.scrollY > 500;
      setShowScrollSearch(scrolled);
    };

    // Check auth status
    checkAuth();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkAuth = async () => {
    const { user: authUser } = await getCurrentUser();
    setUser(authUser);
    
    if (authUser) {
      const res = await ensureCustomerRecord();
      if (res?.success) setCustomer(res.data);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Navigate to search page with query parameter
    const params = new URLSearchParams();
    params.set('q', searchQuery.trim());
    
    router.push(`/search?${params.toString()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

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
              BookEz
            </Link>
          </div>

          {/* Scroll-based Search Bar or Compact Search */}
          {(showScrollSearch || showCompactSearch) && (
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full flex items-center">
                <div className="flex w-full h-10 rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb', background: 'white', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
                  {/* Search Input */}
                  <div className="flex-1 flex items-center px-3">
                    <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search salons or services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 ml-2 text-sm border-0 focus:ring-0 focus:outline-none text-gray-700 bg-transparent"
                    />
                  </div>
                </div>
                
                {/* Search Button - Separate with margin */}
                <button 
                  onClick={handleSearch}
                  disabled={!searchQuery.trim()}
                  className="ml-3 h-10 px-6 bg-sky-500 text-white text-sm font-medium rounded-xl hover:bg-sky-600 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Search
                </button>
              </div>
            </div>
          )}

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/my-bookings" 
              className={`text-sm font-medium transition-colors ${
                showScrollSearch || showCompactSearch 
                  ? 'text-gray-700 hover:text-gray-900' 
                  : 'text-gray-800 hover:text-gray-900'
              }`}
            >
              My Bookings
            </Link>
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
            
            {/* User Account Element */}
            <div className="relative">
              {user ? (
                <div>
                  <button 
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
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
                      {(() => {
                        if (customer?.name && customer.name !== 'Customer') return customer.name;
                        const email = user?.email || '';
                        const isPhoneAlias = email.endsWith('@phone.local');
                        if (customer?.phone) return customer.phone;
                        return isPhoneAlias ? 'Account' : (email || 'Account');
                      })()}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>

                  {/* Account Dropdown */}
                  {showAccountMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        href="/my-bookings/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/my-bookings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowAccountMenu(false)}
                      >
                        My Bookings
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={async () => {
                          await signOut();
                          setUser(null);
                          setCustomer(null);
                          setShowAccountMenu(false);
                          router.push('/');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/client-dashboard"
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
                    Sign In
                  </span>
                </Link>
              )}
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
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar - shows on scroll or compact mode */}
        {(showScrollSearch || showCompactSearch) && (
          <div className="md:hidden pb-6 pt-2">
            <div className="space-y-3">
              {/* Search Input with Button */}
              <div className="relative flex items-center space-x-3">
                <div className="flex-1 flex items-center h-10 rounded-lg px-3" style={{ border: '1px solid #e5e7eb', background: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)' }}>
                  <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search salons, services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 ml-2 text-sm border-0 focus:ring-0 focus:outline-none text-gray-700 bg-transparent"
                  />
                </div>
                <button 
                  onClick={handleSearch}
                  disabled={searchDisabled}
                  className={`h-10 px-6 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                    searchDisabled 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-sky-500 hover:bg-sky-600'
                  }`}
                >
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
