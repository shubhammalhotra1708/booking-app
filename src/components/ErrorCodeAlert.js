'use client';

import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

// Maps backend error codes to user-friendly UI metadata
const CODE_MAP = {
  VALIDATION_FAILED: {
    title: 'Invalid Information',
    description: 'Please check your information and try again. All required fields must be filled correctly.',
    tone: 'warn'
  },
  SLOT_CONFLICT: {
    title: 'Time Slot Unavailable',
    description: 'That time was just taken. Please pick a different slot.',
    tone: 'warn'
  },
  INVALID_STAFF: {
    title: 'Staff Not Available',
    description: 'Selected staff no longer provides this service. Please reselect.',
    tone: 'warn'
  },
  ACCOUNT_EXISTS: {
    title: 'Account Already Exists',
    description: 'An account with this email or phone already exists. Please sign in to link your bookings.',
    tone: 'info'
  },
  CLAIM_CONFLICT: {
    title: 'Claim Conflict',
    description: 'Another account already claimed this phone/email. Use the original account.',
    tone: 'error'
  },
  CLAIM_NOT_FOUND: {
    title: 'Profile Not Found',
    description: 'No guest profile found to claim for these details.',
    tone: 'info'
  },
  GUEST_CUSTOMER_CREATE_FAILED: {
    title: 'Guest Setup Failed',
    description: 'We could not create your guest profile. Please retry or sign in.',
    tone: 'error'
  },
  AUTO_CUSTOMER_CREATE_FAILED: {
    title: 'Account Setup Issue',
    description: 'Account setup incomplete. Please refresh or contact support.',
    tone: 'error'
  },
  ANON_DISABLED: {
    title: 'Guest Mode Active',
    description: 'Booking saved as guest. You can create an account later to track your bookings.',
    tone: 'info'
  },
  INTERNAL_ERROR: {
    title: 'Server Error',
    description: 'Something went wrong. Please try again shortly.',
    tone: 'error'
  },
  NETWORK_ERROR: {
    title: 'Network Issue',
    description: 'Connection problem. Check your internet and retry.',
    tone: 'warn'
  }
};

function toneStyles(tone) {
  switch (tone) {
    case 'error':
      return 'bg-red-50 border-red-200 text-red-700';
    case 'warn':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'info':
      return 'bg-blue-50 border-blue-200 text-blue-700';
    case 'success':
      return 'bg-green-50 border-green-200 text-green-700';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-700';
  }
}

function iconForTone(tone) {
  switch (tone) {
    case 'error':
      return <XCircle className="h-5 w-5" />;
    case 'warn':
      return <AlertTriangle className="h-5 w-5" />;
    case 'info':
      return <Info className="h-5 w-5" />;
    case 'success':
      return <CheckCircle className="h-5 w-5" />;
    default:
      return <Info className="h-5 w-5" />;
  }
}

export default function ErrorCodeAlert({ code, message }) {
  const meta = CODE_MAP[code] || {
    title: message || 'Notice',
    description: message || 'An issue occurred.',
    tone: 'error'
  };
  const { title, description, tone } = meta;
  return (
    <div className={`border px-4 py-3 rounded-md flex items-start space-x-3 ${toneStyles(tone)}`}>      
      <div className="mt-0.5">{iconForTone(tone)}</div>
      <div className="flex-1">
        <div className="font-medium text-sm">{title}</div>
        {description && description !== title && (
          <div className="text-xs mt-1 leading-relaxed">{description}</div>
        )}
        {/* {code && (
          <div className="text-[10px] uppercase tracking-wide mt-2 opacity-60">{code}</div>
        )} */}
      </div>
    </div>
  );
}
