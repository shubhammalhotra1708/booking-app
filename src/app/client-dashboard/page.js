'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  MapPin, 
  Search,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function ClientDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('lookup'); // 'lookup', 'login'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Booking lookup form
  const [lookupForm, setLookupForm] = useState({
    bookingId: '',
    phone: '',
    email: ''
  });
  
  // Quick login form
  const [loginForm, setLoginForm] = useState({
    phone: '',
    email: '',
    password: '',
    showPassword: false
  });

  // Check if user is already logged in
  useEffect(() => {
    const savedSession = localStorage.getItem('clientSession');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        const sessionAge = new Date() - new Date(parsedSession.createdAt);
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        
        if (sessionAge < maxAge) {
          router.push('/my-bookings');
          return;
        } else {
          localStorage.removeItem('clientSession');
        }
      } catch (error) {
        localStorage.removeItem('clientSession');
      }
    }
  }, [router]);

  const handleBookingLookup = async (e) => {
    e.preventDefault();
    
    if (!lookupForm.bookingId || (!lookupForm.phone && !lookupForm.email)) {
      setError('Please provide booking ID and either phone number or email');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Redirect to booking status page with parameters
      const params = new URLSearchParams({
        booking_id: lookupForm.bookingId,
        ...(lookupForm.phone && { phone: lookupForm.phone }),
        ...(lookupForm.email && { email: lookupForm.email })
      });
      
      router.push(`/booking-status?${params.toString()}`);
    } catch (error) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleQuickLogin = async (e) => {
    e.preventDefault();
    
    if ((!loginForm.phone && !loginForm.email) || !loginForm.password) {
      setError('Please provide phone/email and password');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Simple client session for now (in production, use proper auth)
      const clientSession = {
        phone: loginForm.phone || null,
        email: loginForm.email || null,
        createdAt: new Date().toISOString(),
        type: 'client'
      };
      
      localStorage.setItem('clientSession', JSON.stringify(clientSession));
      setSuccess('Login successful! Redirecting...');
      
      setTimeout(() => {
        router.push('/my-bookings');
      }, 1000);
      
    } catch (error) {
      setError('Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Dashboard</h1>
            <p className="text-gray-600">
              Check your booking status or access your account
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
            <button
              onClick={() => setActiveTab('lookup')}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'lookup'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Search className="h-4 w-4 inline mr-2" />
              Quick Lookup
            </button>
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Account Login
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* Quick Booking Lookup */}
          {activeTab === 'lookup' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Find Your Booking</h2>
                <p className="text-gray-600 text-sm">
                  Enter your booking details to check status and get updates
                </p>
              </div>

              <form onSubmit={handleBookingLookup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booking ID
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={lookupForm.bookingId}
                      onChange={(e) => setLookupForm({...lookupForm, bookingId: e.target.value})}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your booking ID (e.g., #000123)"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={lookupForm.phone}
                      onChange={(e) => setLookupForm({...lookupForm, phone: e.target.value})}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500 my-2">OR</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={lookupForm.email}
                      onChange={(e) => setLookupForm({...lookupForm, email: e.target.value})}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Searching...' : 'Find My Booking'}
                </button>
              </form>
            </div>
          )}

          {/* Account Login */}
          {activeTab === 'login' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Login</h2>
                <p className="text-gray-600 text-sm">
                  Sign in to view all your bookings and account details
                </p>
              </div>

              <form onSubmit={handleQuickLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={loginForm.phone}
                      onChange={(e) => setLoginForm({...loginForm, phone: e.target.value})}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div className="text-center text-sm text-gray-500 my-2">OR</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={loginForm.showPassword ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setLoginForm({...loginForm, showPassword: !loginForm.showPassword})}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {loginForm.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account? Book a service to create one automatically.
                </p>
                <Link 
                  href="/search"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Book Now →
                </Link>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/search"
                className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Book New Appointment</span>
              </Link>
              <Link
                href="/booking-status"
                className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Clock className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Check Booking Status</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}