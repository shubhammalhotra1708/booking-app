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
import { signUpWithEmail, signInWithEmail, signUpWithPhone, signInWithPhone, getCurrentUser } from '@/lib/auth-helpers';

export default function ClientDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Auth form (signup/login)
  const [authForm, setAuthForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    loginIdentifier: '', // For login: can be email OR phone
    authMode: 'email' // 'email' or 'phone'
  });

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Clear old localStorage session first (migration cleanup)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('clientSession');
      }
      
      const { user } = await getCurrentUser();
      if (user) {
        router.push('/my-bookings');
      }
    } catch (error) {
      // User not logged in, stay on this page
    }
  };

  // Removed booking lookup flow: booking status is visible in My Bookings after login

  const handleQuickLogin = async (e) => {
    e.preventDefault();
    
    const isSignup = activeTab === 'signup';
    
    // Validation for Signup
    if (isSignup) {
      if (!authForm.name.trim()) {
        setError('Name is required');
        return;
      }
      
      if (!authForm.email.trim()) {
        setError('Email is required');
        return;
      }
      
      if (!/\S+@\S+\.\S+/.test(authForm.email)) {
        setError('Please enter a valid email address');
        return;
      }
      
      if (!authForm.phone.trim()) {
        setError('Phone number is required');
        return;
      }
      
      if (!/^\d{10}$/.test(authForm.phone.replace(/\D/g, ''))) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }
      
      if (!authForm.password || authForm.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      
      if (authForm.password !== authForm.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    } else {
      // Validation for Login
      if (!authForm.loginIdentifier.trim()) {
        setError('Email or phone number is required');
        return;
      }
      
      if (!authForm.password) {
        setError('Password is required');
        return;
      }
    }

    setLoading(true);
    setError('');
    
    try {
      let result;
      
      if (isSignup) {
        // Signup: Always use email as primary, phone as secondary
        result = await signUpWithEmail({
          email: authForm.email,
          password: authForm.password,
          name: authForm.name,
          phone: authForm.phone
        });
      } else {
        // Login: Detect if identifier is email or phone
        const identifier = authForm.loginIdentifier.trim();
        const isEmail = /\S+@\S+\.\S+/.test(identifier);
        
        if (isEmail) {
          result = await signInWithEmail({
            email: identifier,
            password: authForm.password
          });
        } else {
          result = await signInWithPhone({
            phone: identifier,
            password: authForm.password
          });
        }
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Authentication failed');
      }
      
      // Check if session exists (auto-login) or email confirmation required
      if (result.data?.session) {
        setSuccess(isSignup ? 'Account created! Redirecting...' : 'Login successful! Redirecting...');
        
        setTimeout(() => {
          router.push('/my-bookings');
        }, 1000);
      } else if (isSignup) {
        // Email confirmation required
        setSuccess('Account created! Please check your email to confirm your account before logging in.');
        setLoading(false);
      } else {
        // Shouldn't happen for login
        throw new Error('No session returned');
      }
      
    } catch (error) {
      setError(error.message || 'Authentication failed. Please try again.');
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to BookEz</h1>
            <p className="text-gray-600">
              Sign in to manage your bookings or create a new account
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Login
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'signup'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Sign Up
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

          {/* Quick Booking Lookup removed */}

          {/* Account Login & Signup */}
          {(activeTab === 'login' || activeTab === 'signup') && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {activeTab === 'signup' ? 'Create Account' : 'Account Login'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {activeTab === 'signup' 
                    ? 'Sign up to book and manage your appointments'
                    : 'Sign in to view all your bookings and account details'
                  }
                </p>
              </div>

              <form onSubmit={handleQuickLogin} className="space-y-4">
                {/* Signup Fields */}
                {activeTab === 'signup' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={authForm.name}
                          onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="email"
                          value={authForm.email}
                          onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your email address"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="tel"
                          value={authForm.phone}
                          onChange={(e) => setAuthForm({...authForm, phone: e.target.value})}
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Login Field - Single identifier (email or phone) */}
                {activeTab === 'login' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email or Phone Number *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={authForm.loginIdentifier}
                        onChange={(e) => setAuthForm({...authForm, loginIdentifier: e.target.value})}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your email or phone number"
                      />
                    </div>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={authForm.showPassword ? 'text' : 'password'}
                      value={authForm.password}
                      onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setAuthForm({...authForm, showPassword: !authForm.showPassword})}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {authForm.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (signup only) */}
                {activeTab === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={authForm.showPassword ? 'text' : 'password'}
                        value={authForm.confirmPassword}
                        onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Forgot Password Link (login only) */}
                {activeTab === 'login' && (
                  <div className="text-right">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full text-white py-3 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center ${
                    activeTab === 'signup' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 mr-2" />
                  )}
                  {loading 
                    ? (activeTab === 'signup' ? 'Creating Account...' : 'Signing In...') 
                    : (activeTab === 'signup' ? 'Create Account' : 'Sign In')
                  }
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {activeTab === 'signup' 
                    ? 'Already have an account?' 
                    : "Don't have an account?"
                  }
                  {' '}
                  <button
                    onClick={() => setActiveTab(activeTab === 'signup' ? 'login' : 'signup')}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {activeTab === 'signup' ? 'Login here' : 'Sign up here'}
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}