'use client';

import { useState } from 'react';
import { X, Phone, Mail, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthProvider';
import OTPModal from './OTPModal';
import { sendOTP, verifyOTP } from '@/lib/auth-helpers';

export default function AuthModal({ isOpen, onClose, onSuccess, bookingData, initialMode = 'login' }) {
  const [authMode, setAuthMode] = useState('phone'); // 'phone' or 'email'
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [usePasswordless, setUsePasswordless] = useState(false); // Toggle for OTP vs password
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const { signIn, signUp, signInWithPhone, signUpWithPhone } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      
      // Passwordless OTP signin (login only)
      if (isLogin && usePasswordless) {
        const otpResult = await sendOTP({
          email: authMode === 'email' ? formData.email : null,
          phone: authMode === 'phone' ? formData.phone : null,
          name: formData.name || 'User'
        });
        
        if (!otpResult.success) {
          throw new Error(otpResult.error || 'Failed to send OTP');
        }
        
        setShowOTPModal(true);
        setLoading(false);
        return; // Wait for OTP verification
      }
      
      if (authMode === 'phone') {
        if (isLogin) {
          result = await signInWithPhone(formData.phone, formData.password);
        } else {
          if (formData.password !== formData.confirmPassword) {
            throw new Error('Passwords do not match');
          }
          if (!formData.name.trim()) {
            throw new Error('Name is required');
          }
          result = await signUpWithPhone(formData.phone, formData.password, formData.name.trim());
        }
      } else {
        if (isLogin) {
          result = await signIn(formData.email, formData.password);
        } else {
          if (formData.password !== formData.confirmPassword) {
            throw new Error('Passwords do not match');
          }
          if (!formData.name.trim()) {
            throw new Error('Name is required');
          }
          result = await signUp(formData.email, formData.password, { 
            name: formData.name.trim(),
            display_name: formData.name.trim()
          });
        }
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Success
      onSuccess(result.data);
      onClose();
      
    } catch (error) {
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (token, isResend = false) => {
    if (isResend) {
      try {
        const result = await sendOTP({
          email: authMode === 'email' ? formData.email : null,
          phone: authMode === 'phone' ? formData.phone : null,
          name: formData.name || 'User'
        });
        
        if (!result.success) {
          return { success: false, error: result.error };
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: 'Failed to resend code' };
      }
    }

    // Verify OTP
    try {
      const result = await verifyOTP({
        email: authMode === 'email' ? formData.email : null,
        phone: authMode === 'phone' ? formData.phone : null,
        token
      });

      if (result.success) {
        setShowOTPModal(false);
        // Success - user is now signed in
        onSuccess(result.user);
        onClose();
        return { success: true };
      }

      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Verification failed' };
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isLogin ? 'Sign in to continue' : 'Create your account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6">
            {isLogin 
              ? 'Sign in to complete your booking and track your appointments'
              : 'Create an account to book appointments and manage your visits'
            }
          </p>

          {/* Auth Mode Switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {authMode === 'phone' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setUsePasswordless(!usePasswordless)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {usePasswordless ? '← Use password instead' : '✨ Sign in with OTP (no password needed)'}
                </button>
              </div>
            )}

            {!usePasswordless && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                      placeholder="Enter your password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                        placeholder="Confirm your password"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Please wait...' : (
                isLogin && usePasswordless ? 'Send OTP Code' : (isLogin ? 'Sign In' : 'Create Account')
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setUsePasswordless(false);
                setError('');
                setFormData({
                  phone: '',
                  email: '',
                  password: '',
                  name: '',
                  confirmPassword: ''
                });
              }}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerify={handleOTPVerify}
        contactInfo={authMode === 'email' ? formData.email : formData.phone}
        verificationType={authMode}
      />
    </div>
  );
}