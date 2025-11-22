import { z } from 'zod';

// Domain error codes (expand gradually)
export const ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  SLOT_CONFLICT: 'SLOT_CONFLICT',
  INVALID_SHOP: 'INVALID_SHOP',
  INVALID_SERVICE: 'INVALID_SERVICE',
  INVALID_STAFF: 'INVALID_STAFF',
  INVALID_DURATION: 'INVALID_DURATION',
  ACCOUNT_EXISTS: 'ACCOUNT_EXISTS',
  GUEST_CUSTOMER_CREATE_FAILED: 'GUEST_CUSTOMER_CREATE_FAILED',
  CLAIM_NOT_FOUND: 'CLAIM_NOT_FOUND',
  CLAIM_CONFLICT: 'CLAIM_CONFLICT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  AUTO_CUSTOMER_CREATE_FAILED: 'AUTO_CUSTOMER_CREATE_FAILED',
  ANON_DISABLED: 'ANON_DISABLED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};
// Shop validation schema
export const ShopSchema = z.object({
  shopName: z.string()
    .min(1, 'Shop name is required')
    .max(255, 'Shop name must be less than 255 characters')
    .trim(),
  shopAddress: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address must be less than 500 characters')
    .trim(),
  shopPhone: z.string()
    .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits'),
  shopAbout: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
  shopImage: z.string().url('Invalid image URL').optional(),
  shopRating: z.number()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .optional(),
  services: z.array(z.object({
    name: z.string().min(1, 'Service name is required').max(255),
    description: z.string().max(500).optional(),
    category: z.string().min(1, 'Category is required'),
    price: z.number().positive('Price must be positive'),
    duration: z.number().positive('Duration must be positive')
  })).optional()
});

// Service validation schema
export const ServiceSchema = z.object({
  name: z.string()
    .min(1, 'Service name is required')
    .max(255, 'Service name must be less than 255 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters'),
  price: z.number()
    .positive('Price must be positive')
    .max(999999, 'Price is too high'),
  duration: z.number()
    .positive('Duration must be positive')
    .max(600, 'Duration cannot exceed 10 hours'),
  shopId: z.number().positive('Valid shop ID is required').optional()
});

// Booking validation schema
export const BookingSchema = z.object({
  customer_name: z.string()
    .min(1, 'Customer name is required')
    .max(255, 'Customer name must be less than 255 characters')
    .trim(),
  customer_email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .trim()
    .optional(),
  customer_phone: z.string()
    .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits'),
  customer_notes: z.string()
    .max(500, 'Customer notes must be less than 500 characters')
    .trim()
    .optional(),
  booking_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const bookingDate = new Date(date + 'T00:00:00'); // Force local timezone
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return bookingDate >= today;
    }, 'Booking date cannot be in the past'),
  booking_time: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format')
    .refine((time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
    }, 'Invalid time format'),
  service_id: z.number().positive('Service ID is required'),
  staff_id: z.number().positive('Staff ID is required').optional(),
  shop_id: z.number().positive('Shop ID is required'),
  discount_applied: z.number().min(0, 'Discount cannot be negative').optional().default(0),
  notes: z.string()
    .max(500, 'Admin notes must be less than 500 characters')
    .trim()
    .optional(),
  status: z.enum(['pending', 'confirmed', 'rejected', 'completed', 'cancelled', 'no_show'])
    .default('pending'),
  // For logged-in users we allow client to pass the Customer PK; server will trust only when present
  // nullish() allows undefined, null, or valid UUID
  customer_id: z.string().uuid('customer_id must be a UUID').nullish()
});

// Booking update schema (allows partial updates)
export const BookingUpdateSchema = BookingSchema.partial().omit({ 
  shop_id: true, 
  service_id: true, 
  customer_name: true, 
  customer_phone: true 
});

// Availability check schema
export const AvailabilitySchema = z.object({
  shop_id: z.number().positive('Shop ID is required'),
  service_id: z.number().positive('Service ID is required'),
  staff_id: z.number().positive('Staff ID is required').optional(),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const bookingDate = new Date(date + 'T00:00:00'); // Force local timezone
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return bookingDate >= today;
    }, 'Date cannot be in the past')
});

// Error response helper
export function createErrorResponse(message, httpStatus = 500, details = null, errorCode = ERROR_CODES.INTERNAL_ERROR) {
  return {
    success: false,
    error: message,
    error_code: errorCode,
    status: httpStatus,
    details,
    timestamp: new Date().toISOString()
  };
}

// Success response helper
export function createSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

// Validation middleware helper
export function validateRequest(schema, data) {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    console.error('Validation error caught:', error);
    console.error('Error type:', typeof error);
    console.error('Error instanceof z.ZodError:', error instanceof z.ZodError);
    console.error('Error.errors:', error.errors);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        error_code: ERROR_CODES.VALIDATION_FAILED,
        details: error.errors?.map(err => ({
          field: err.path?.join('.') || 'unknown',
          message: err.message || 'Validation error'
        })) || []
      };
    }
    return {
      success: false,
      error: 'Unknown validation error',
      error_code: ERROR_CODES.INTERNAL_ERROR,
      details: []
    };
  }
}