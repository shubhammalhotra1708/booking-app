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
  
  return {
    id: apiShop.id,
    name: apiShop.name || 'Unnamed Salon',
    image: mainImage,
    images: [mainImage, '/s2.jpeg', '/s3.jpeg'], // Create array with main image and fallbacks
    // New Supabase Storage fields
    logo_url: apiShop.logo_url || null,
    banner_url: apiShop.banner_url || null,
    gallery_urls: galleryUrls,
    rating: apiShop.rating || 4.5,
    reviewCount: apiShop.review_count || 0,
    price: transformPriceRange(apiShop.price_range),
    services: [], // Will be populated separately
    address: apiShop.address || 'Address not available',
    city: apiShop.city || 'City not specified',
    distance: calculateDistance(), // Mock distance for now
    isOpen: true, // Default to open for now
    nextAvailable: getNextAvailableSlot(),
    specialOffer: apiShop.special_offer || null,
    phone: Array.isArray(apiShop.phone) ? apiShop.phone.join(', ') : (apiShop.phone || 'Phone not available'),
    email: apiShop.email || 'Email not available',
    description: apiShop.description || apiShop.about || 'Description not available',
    openingHours: apiShop.operating_hours || {
      monday: "10:00 AM - 8:00 PM",
      tuesday: "10:00 AM - 8:00 PM",
      wednesday: "10:00 AM - 8:00 PM",
      thursday: "10:00 AM - 8:00 PM",
      friday: "10:00 AM - 9:00 PM",
      saturday: "9:00 AM - 9:00 PM",
      sunday: "11:00 AM - 7:00 PM"
    }
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
    image: apiStaff.image || '/api/placeholder/150/150',
    // New Supabase Storage field
    profile_image_url: apiStaff.profile_image_url || null,
    specialties: Array.isArray(specialties) ? specialties : ['General Services'],
    experience: apiStaff.experience || 'Experience not specified',
    rating: apiStaff.rating || 4.5,
    role: apiStaff.role || 'Stylist',
    bio: apiStaff.bio || 'Bio not available'
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

const calculateDistance = () => {
  // Mock distance calculation - in real app would use geolocation
  const distances = ['0.5 miles', '1.2 miles', '2.1 miles', '1.8 miles', '3.0 miles'];
  return distances[Math.floor(Math.random() * distances.length)];
};

const getNextAvailableSlot = () => {
  // Mock next available slot - in real app would check actual availability
  const today = new Date();
  const slots = [
    'Today 2:00 PM',
    'Today 4:30 PM',
    'Today 6:00 PM',
    'Tomorrow 10:00 AM',
    'Tomorrow 11:30 AM'
  ];
  return slots[Math.floor(Math.random() * slots.length)];
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
    images: [transformedShop.image, '/api/placeholder/400/300', '/api/placeholder/400/300'],
    openingHours: {
      monday: "10:00 AM - 8:00 PM",
      tuesday: "10:00 AM - 8:00 PM",
      wednesday: "10:00 AM - 8:00 PM",
      thursday: "10:00 AM - 8:00 PM",
      friday: "10:00 AM - 9:00 PM",
      saturday: "9:00 AM - 9:00 PM",
      sunday: "11:00 AM - 7:00 PM"
    }
  };
};