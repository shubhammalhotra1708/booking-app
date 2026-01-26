'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Mail, Phone, ArrowLeft } from 'lucide-react';

export default function OTPModal({ isOpen, onClose, onVerify, contactInfo, verificationType = 'email' }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  // Get rate limit key for this contact
  const getRateLimitKey = () => {
    const contact = typeof contactInfo === 'string'
      ? contactInfo
      : verificationType === 'email'
        ? contactInfo?.email
        : contactInfo?.phone;
    return `otp_last_sent_${contact}`;
  };

  // Calculate remaining time from localStorage
  const getRemainingTime = () => {
    const key = getRateLimitKey();
    const lastSent = localStorage.getItem(key);
    if (!lastSent) return 0;

    const timeSince = Date.now() - parseInt(lastSent);
    const RATE_LIMIT_DURATION = 120000; // 2 minutes

    if (timeSince < RATE_LIMIT_DURATION) {
      return Math.ceil((RATE_LIMIT_DURATION - timeSince) / 1000);
    }
    return 0;
  };

  // Countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Start countdown when modal opens (check localStorage for existing rate limit)
  useEffect(() => {
    if (isOpen) {
      const remainingTime = getRemainingTime();
      setCountdown(remainingTime || 120); // 2 minutes default
      setOtp(['', '', '', '', '', '']);
      setError('');
    }
  }, [isOpen]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (index === 5 && value && newOtp.every(digit => digit)) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);

    // Focus last filled input or verify if complete
    const lastIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();

    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (code) => {
    const otpCode = code || otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await onVerify(otpCode);
      if (!result.success) {
        setError(result.error || 'Invalid verification code. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setError('');

    try {
      // Call parent's resend function (will be passed via props)
      await onVerify(null, true); // null code = resend signal
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (!isOpen) return null;

  // Extract email/phone from contactInfo (can be string or object)
  const displayContact = typeof contactInfo === 'string' 
    ? contactInfo 
    : verificationType === 'email' 
      ? contactInfo?.email 
      : contactInfo?.phone;

  const Icon = verificationType === 'email' ? Mail : Phone;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Verify Your {verificationType === 'email' ? 'Email' : 'Phone'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 rounded-full p-3">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-center text-gray-600 mb-2">
            We've sent a 6-digit code to
          </p>
          <p className="text-center font-semibold text-gray-900 mb-4">
            {displayContact}
          </p>
          <p className="text-center text-sm text-gray-500">
            Enter the code below to verify your {verificationType === 'email' ? 'email' : 'phone number'}
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <div className="flex justify-center gap-2 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`w-12 h-14 text-center text-2xl font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  error
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                disabled={loading}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            onClick={() => handleVerify()}
            disabled={loading || otp.some(digit => !digit)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Verifying...
              </span>
            ) : (
              'Verify Code'
            )}
          </button>
        </div>

        {/* Resend */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
          {countdown > 0 ? (
            <p className="text-sm text-gray-500">
              Resend code in <span className="font-semibold">{countdown}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
