'use client';

import { useState } from 'react';
import { User, Phone, Mail, Lock } from 'lucide-react';

export default function SimpleClientAuth({ onAuth, bookingData }) {
  const [authMode, setAuthMode] = useState('phone'); // 'phone' or 'email'
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
    name: ''
  });
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const authData = {
        mode: authMode,
        isLogin,
        ...formData
      };

      // Generate a simple session token
      const sessionToken = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store client info in localStorage for session management
      const clientSession = {
        token: sessionToken,
        phone: formData.phone,
        email: formData.email,
        name: formData.name || 'Guest',
        createdAt: new Date().toISOString(),
        bookings: [] // Will store booking IDs for this client
      };

      localStorage.setItem('clientSession', JSON.stringify(clientSession));
      
      // Call parent component with auth data
      onAuth({
        success: true,
        session: clientSession,
        isNewUser: !isLogin
      });

    } catch (error) {
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isLogin ? 'Welcome Back' : 'Quick Signup'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isLogin 
            ? 'Enter your details to view your bookings' 
            : 'Just basic info to track your appointment'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Auth Mode Switcher */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setAuthMode('phone')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              authMode === 'phone'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Phone className="h-4 w-4 inline mr-1" />
            Phone
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('email')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              authMode === 'email'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Mail className="h-4 w-4 inline mr-1" />
            Email
          </button>
        </div>

        {/* Name (for new users) */}
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
                required={!isLogin}
              />
            </div>
          </div>
        )}

        {/* Phone/Email Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {authMode === 'phone' ? 'Phone Number' : 'Email Address'}
          </label>
          <div className="relative">
            {authMode === 'phone' ? (
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            ) : (
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            )}
            <input
              type={authMode === 'phone' ? 'tel' : 'email'}
              value={authMode === 'phone' ? formData.phone : formData.email}
              onChange={(e) => setFormData({ 
                ...formData, 
                [authMode]: e.target.value 
              })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={authMode === 'phone' ? '+1 (555) 123-4567' : 'you@example.com'}
              required
            />
          </div>
        </div>

        {/* Simple Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isLogin ? 'Password' : 'Create Password'}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              required
              minLength={4}
            />
          </div>
          {!isLogin && (
            <p className="text-xs text-gray-500 mt-1">
              Just 4+ characters - keep it simple!
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Quick Signup')}
        </button>

        {/* Toggle Login/Signup */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {isLogin 
              ? "Don't have an account? Quick signup" 
              : "Already have an account? Sign in"
            }
          </button>
        </div>
      </form>

      {/* Skip Option for Testing */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <button
          onClick={() => onAuth({ 
            success: true, 
            session: { 
              token: `guest_${Date.now()}`, 
              name: 'Guest User', 
              isGuest: true 
            }, 
            isGuest: true 
          })}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Continue as Guest (Testing)
        </button>
      </div>
    </div>
  );
}