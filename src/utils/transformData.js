// Data transformation utilities for API responses
// Converts API responses to match mock data structure for UI compatibility

export const transformShopData = (apiShop) => {
  if (!apiShop) return null;
  
  const mainImage = apiShop.image || '/s1.jpeg';
  
  // Parse gallery_urls if it's a JSON string array
  let galleryUrls = [];
  if (apiShop.gallery_urls) {
    if (Array.isArray(apiShop.gallery_urls)) {
      // If it's already an array, parse each JSON string to get the URL
      galleryUrls = apiShop.gallery_urls
        .map(item => {
          if (typeof item === 'string') {
            try {
              const parsed = JSON.parse(item);
              return parsed.url || null;
            } catch (e) {
              // If not JSON, assume it's a plain URL
              return item;
            }
          }
          return item?.url || item;
        })
        .filter(url => url);
    }
  }
  
  // Get operating hours from API or use null (don't fake hours)
  const operatingHours = apiShop.operating_hours || null;

  return {
    id: apiShop.id,
    name: apiShop.name || 'Unnamed Salon',
    image: mainImage,
    images: galleryUrls.length > 0 ? galleryUrls : (mainImage ? [mainImage] : []),
    // New Supabase Storage fields
    logo_url: apiShop.logo_url || null,
    banner_url: apiShop.banner_url || null,
    gallery_urls: galleryUrls,
    // Use real data, don't fake ratings
    rating: apiShop.rating || null,
    reviewCount: apiShop.review_count || 0,
    price: transformPriceRange(apiShop.price_range),
    priceRange: apiShop.price_range || null, // Keep original for reference
    services: [], // Will be populated separately
    address: apiShop.address || null,
    city: apiShop.city || null,
    distance: calculateDistance(), // Returns null until geolocation implemented
    // Dynamic open status based on operating hours
    isOpen: isShopCurrentlyOpen(operatingHours),
    nextAvailable: getNextAvailableSlot(), // Returns null until availability API implemented
    specialOffer: apiShop.special_offer || null,
    phone: Array.isArray(apiShop.phone) ? apiShop.phone.join(', ') : (apiShop.phone || null),
    email: apiShop.email || null,
    description: apiShop.description || apiShop.about || null,
    openingHours: operatingHours
  };
};

export const transformServiceData = (apiService) => {
  if (!apiService) return null;
  return {
    id: apiService.id,
    name: apiService.name || 'Unnamed Service',
    price: apiService.price || 0,
    duration: apiService.duration ? `${apiService.duration} min` : '30 min',
    description: apiService.description || 'No description available',
    category: apiService.category || 'Other',
    targetgender: apiService.targetgender || ['ALL'],
    targetGender: apiService.targetgender || ['ALL'],
    // New Supabase Storage field
    image_url: apiService.image_url || null
  };
};

export const transformStaffData = (apiStaff) => {
  if (!apiStaff) return null;

  // Parse specialties if it's a JSON string
  let specialties = [];
  if (apiStaff.specialties) {
    try {
      specialties = typeof apiStaff.specialties === 'string'
        ? JSON.parse(apiStaff.specialties)
        : apiStaff.specialties;
    } catch (e) {
      specialties = [apiStaff.specialties];
    }
  }

  return {
    id: apiStaff.id,
    name: apiStaff.name || 'Staff Member',
    image: apiStaff.image || null, // Will use fallback icon in UI
    // New Supabase Storage field
    profile_image_url: apiStaff.profile_image_url || null,
    specialties: Array.isArray(specialties) && specialties.length > 0 ? specialties : null,
    experience: apiStaff.experience || null,
    rating: apiStaff.rating || null, // Don't fake ratings
    role: apiStaff.role || null,
    bio: apiStaff.bio || null
  };
};

export const transformProductData = (apiProduct) => {
  if (!apiProduct) return null;

  return {
    id: apiProduct.id,
    name: apiProduct.name || 'Unnamed Product',
    price: apiProduct.price || 0,
    description: apiProduct.description || '',
    image_url: apiProduct.image_url || null,
    category: apiProduct.category || 'Uncategorized',
    quantity: apiProduct.quantity || 0,
    track_inventory: apiProduct.track_inventory || false,
    in_stock: !apiProduct.track_inventory || (apiProduct.quantity > 0)
  };
};

export const transformProductsData = (apiProducts) => {
  if (!Array.isArray(apiProducts)) return [];
  return apiProducts.map(transformProductData).filter(Boolean);
};

// Helper functions
const transformPriceRange = (priceRange) => {
  const priceMap = {
    'low': '₹',
    'medium': '₹₹',
    'high': '₹₹₹',
    'premium': '₹₹₹₹'
  };
  return priceMap[priceRange] || '₹₹';
};

/**
 * Check if shop is currently open based on operating hours
 * @param {Object} operatingHours - Shop's operating hours object
 * @returns {boolean} - True if shop is currently open
 */
const isShopCurrentlyOpen = (operatingHours) => {
  if (!operatingHours || typeof operatingHours !== 'object') {
    return true; // Default to open if no hours configured
  }

  const now = new Date();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const dayHours = operatingHours[dayOfWeek];

  // Check if day exists and is marked as open
  if (!dayHours) return false;

  // Handle different formats
  if (typeof dayHours === 'string') {
    // Format: "10:00 AM - 8:00 PM" or "Closed"
    if (dayHours.toLowerCase() === 'closed') return false;
    // Parse time range string
    const match = dayHours.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      const openHour = parseInt(match[1]) + (match[3].toUpperCase() === 'PM' && match[1] !== '12' ? 12 : 0);
      const openMin = parseInt(match[2]);
      const closeHour = parseInt(match[4]) + (match[6].toUpperCase() === 'PM' && match[4] !== '12' ? 12 : 0);
      const closeMin = parseInt(match[5]);

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;

      return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    }
    return true; // If can't parse, assume open
  }

  // Handle object format: { open: "09:00", close: "18:00", isOpen: true }
  if (typeof dayHours === 'object') {
    if (dayHours.isOpen === false) return false;
    if (!dayHours.open || !dayHours.close) return false;

    // Parse 24-hour format times (e.g., "09:00", "18:00")
    const [openHour, openMin] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = dayHours.close.split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  return true; // Default to open
};

const calculateDistance = () => {
  // TODO: Implement real distance calculation using geolocation
  // For now, return null to hide distance badge when not available
  return null;
};

const getNextAvailableSlot = () => {
  // TODO: Implement real availability check via API
  // For now, return null to hide next available when not calculated
  return null;
};

// Transform multiple items
export const transformShopsData = (apiShops) => {
  if (!Array.isArray(apiShops)) return [];
  return apiShops.map(transformShopData).filter(Boolean);
};

export const transformServicesData = (apiServices) => {
  if (!Array.isArray(apiServices)) return [];
  return apiServices.map(transformServiceData).filter(Boolean);
};

export const transformStaffDataArray = (apiStaff) => {
  if (!Array.isArray(apiStaff)) return [];
  return apiStaff.map(transformStaffData).filter(Boolean);
};

// Complete shop details transformation with services and staff
export const transformCompleteShopDetails = (shop, services = [], staff = []) => {
  const transformedShop = transformShopData(shop);
  if (!transformedShop) return null;

  return {
    ...transformedShop,
    services: transformServicesData(services),
    staff: transformStaffDataArray(staff),
    // Use gallery if available, otherwise use main image
    images: transformedShop.gallery_urls?.length > 0
      ? transformedShop.gallery_urls
      : (transformedShop.image ? [transformedShop.image] : [])
    // openingHours is already set from transformShopData (real data or null)
  };
};