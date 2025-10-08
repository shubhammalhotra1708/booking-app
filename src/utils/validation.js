// Input validation and sanitization utilities

// Email validation
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Phone validation (supports international formats)
export function isValidPhone(phone) {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Check if it's between 10-15 digits (international standard)
  return digits.length >= 10 && digits.length <= 15;
}

// Name validation
export function isValidName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100 && /^[a-zA-Z\s\-'\.]+$/.test(trimmed);
}

// Date validation (YYYY-MM-DD format)
export function isValidDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return false;
  
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date instanceof Date && 
         !isNaN(date) && 
         date >= today && 
         date.toISOString().split('T')[0] === dateString;
}

// Time validation (HH:MM format)
export function isValidTime(timeString) {
  if (!timeString || typeof timeString !== 'string') return false;
  
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(timeString);
}

// ID validation (positive integer)
export function isValidId(id) {
  const num = parseInt(id);
  return !isNaN(num) && num > 0 && num.toString() === id.toString();
}

// String sanitization
export function sanitizeString(str, maxLength = 255) {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Booking data validation
export function validateBookingData(data) {
  const errors = {};
  
  if (!data.shop_id || !isValidId(data.shop_id)) {
    errors.shop_id = 'Invalid shop ID';
  }
  
  if (!data.service_id || !isValidId(data.service_id)) {
    errors.service_id = 'Invalid service ID';
  }
  
  if (!data.booking_date || !isValidDate(data.booking_date)) {
    errors.booking_date = 'Invalid booking date';
  }
  
  if (!data.booking_time || !isValidTime(data.booking_time)) {
    errors.booking_time = 'Invalid booking time';
  }
  
  if (!data.customer_name || !isValidName(data.customer_name)) {
    errors.customer_name = 'Invalid customer name';
  }
  
  if (!data.customer_phone || !isValidPhone(data.customer_phone)) {
    errors.customer_phone = 'Invalid phone number';
  }
  
  if (data.customer_email && !isValidEmail(data.customer_email)) {
    errors.customer_email = 'Invalid email address';
  }
  
  if (data.staff_id && !isValidId(data.staff_id)) {
    errors.staff_id = 'Invalid staff ID';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Shop data validation
export function validateShopData(data) {
  const errors = {};
  
  if (!data.name || !isValidName(data.name)) {
    errors.name = 'Invalid shop name';
  }
  
  if (!data.address || sanitizeString(data.address).length < 10) {
    errors.address = 'Address must be at least 10 characters';
  }
  
  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Invalid phone number';
  }
  
  if (data.email && !isValidEmail(data.email)) {
    errors.email = 'Invalid email address';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// File upload validation
export function validateFileUpload(file, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], maxSize = 5 * 1024 * 1024) {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  if (file.size > maxSize) {
    errors.push(`File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// SQL injection prevention helpers
export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Rate limiting validation
export function validateRateLimit(clientId, endpoint, windowMs = 60000, maxRequests = 10) {
  // This would integrate with your rate limiting middleware
  // For now, return a simple validation
  return true;
}