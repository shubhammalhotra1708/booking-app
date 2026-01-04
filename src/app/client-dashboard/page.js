'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import Navbar from '@/components/Navbar';
import OTPModal from '@/components/OTPModal';
import { 
  getCurrentUser, 
  sendOTP, 
  verifyOTP,
  signInWithEmail,
  signUpWithEmail,
  signInWithPhone,
  signUpWithPhone
} from '@/lib/auth-helpers';

export default function ClientDashboard() {
  const router = useRouter();
  
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { user } = await getCurrentUser();
      if (user) {
        router.push('/my-bookings');
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate all fields are required
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSubmitLoading(true);

    try {
      const otpResult = await sendOTP({
        email: email.trim(),
        phone: phone.trim(), // Pass phone for customer record
        name: name.trim()
      });
      
      if (!otpResult.success) {
        // Show specific error for email vs phone conflicts
        if (otpResult.code === 'EMAIL_EXISTS') {
          setError('This email is already registered. Please use a different email or sign in with your existing account.');
        } else if (otpResult.code === 'PHONE_EXISTS') {
          setError('This phone number is already registered. Please use a different number or sign in with your existing account.');
        } else {
          setError(otpResult.error || 'Failed to send verification code');
        }
        setSubmitLoading(false);
        return;
      }
      
      setShowOTPModal(true);
    } catch (err) {
      setError(err.message || 'Failed to send code. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOTPVerify = async (token, isResend = false) => {
    if (isResend) {
      try {
        const result = await sendOTP({
          email: email.trim(),
          phone: phone.trim(),
          name: name.trim()
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
        email: email.trim(),
        phone: phone.trim(), // Pass phone for customer record
        token
      });

      if (result.success) {
        setShowOTPModal(false);
        router.push('/my-bookings');
        return { success: true };
      }

      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Verification failed' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome to BookEz</h1>
            <p className="text-gray-600">
              Sign in or create an account
            </p>
            <p className="text-sm text-gray-500 mt-2">
              We'll send a verification code to your email
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field - Now Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>

            {/* Phone Field - Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="9876543210"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-blue-600 text-white py-3.5 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-base"
            >
              {submitLoading ? 'Sending code...' : 'Continue with Email'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerify={handleOTPVerify}
        contactInfo={email}
        verificationType="email"
      />
    </div>
  );
}