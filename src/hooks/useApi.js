// API integration hooks for booking app
'use client';

import { useState, useEffect } from 'react';
import { 
  transformShopsData, 
  transformCompleteShopDetails, 
  transformServicesData, 
  transformStaffDataArray,
  transformShopData,
  transformServiceData,
  transformStaffData
} from '../utils/transformData';

// Custom hook for fetching shops with their services
export const useShops = (filters = {}) => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShopsWithServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query parameters for shops
        const params = new URLSearchParams();
        if (filters.city) params.append('city', filters.city);
        if (filters.category) params.append('category', filters.category);
        if (filters.limit) params.append('limit', filters.limit);
        if (filters.offset) params.append('offset', filters.offset);
        
        // Fetch shops
        const shopsResponse = await fetch(`/api/shops?${params.toString()}`);
        const shopsData = await shopsResponse.json();
        
        if (!shopsData.success) {
          setError(shopsData.error || 'Failed to fetch shops');
          return;
        }

        // Transform all shops - no need to fetch services separately for listing
        // Services are fetched when viewing individual shop details
        const transformedShops = (shopsData.data || []).map(shop => transformShopData(shop));
        setShops(transformedShops);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShopsWithServices();
  }, [filters.city, filters.category, filters.limit, filters.offset]);

  return { shops, loading, error, refetch: () => setLoading(true) };
};

// Custom hook for fetching services
export const useServices = (shopId = null, filters = {}) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shopId && !filters.category) return;

    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        if (shopId) params.append('shop_id', shopId);
        if (filters.category) params.append('category', filters.category);
        if (filters.gender) params.append('gender', filters.gender);
        if (filters.featured) params.append('featured', 'true');
        
        const response = await fetch(`/api/services?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setServices(data.data || []);
        } else {
          setError(data.error || 'Failed to fetch services');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [shopId, filters.category, filters.gender, filters.featured]);

  return { services, loading, error };
};

// Custom hook for fetching staff
export const useStaff = (shopId, serviceId = null) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shopId) return;

    const fetchStaff = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        params.append('shop_id', shopId);
        if (serviceId) params.append('service_id', serviceId);
        
        const response = await fetch(`/api/staff?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setStaff(data.data || []);
        } else {
          setError(data.error || 'Failed to fetch staff');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [shopId, serviceId]);

  return { staff, loading, error };
};

// Custom hook for fetching individual shop details
export const useShopDetails = (shopId) => {
  const [shop, setShop] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shopId || isNaN(shopId)) {
      setError('Invalid shop ID');
      setLoading(false);
      return;
    }

    const fetchShopDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch shop details, services, staff, and products in parallel
        const [shopResponse, servicesResponse, staffResponse, productsResponse] = await Promise.all([
          fetch(`/api/shops?shop_id=${shopId}`),
          fetch(`/api/services?shop_id=${shopId}`),
          fetch(`/api/staff?shop_id=${shopId}`),
          fetch(`/api/products?shop_id=${shopId}`)
        ]);

        const [shopData, servicesData, staffData, productsData] = await Promise.all([
          shopResponse.json(),
          servicesResponse.json(),
          staffResponse.json(),
          productsResponse.json()
        ]);

        if (shopData.success && shopData.data?.length > 0) {
          setShop(shopData.data[0]);
        } else {
          setError('Shop not found');
        }

        if (servicesData.success) {
          setServices(servicesData.data || []);
        }

        if (staffData.success) {
          setStaff(staffData.data || []);
        }

        if (productsData.success) {
          setProducts(productsData.data || []);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShopDetails();
  }, [shopId]);

  return { shop, services, staff, products, loading, error };
};

// Transform functions are now imported from utils/transformData.js

// Search functionality hook
export const useSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async (query, location = '', filters = {}) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Search in shops by name, services by name/category, and apply location filter
      const shopsParams = new URLSearchParams();
      if (location && location.trim()) {
        shopsParams.append('city', location.trim());
      }
      
      const servicesParams = new URLSearchParams();
      servicesParams.append('category', query);
      
      const [shopsResponse, servicesResponse, allShopsResponse] = await Promise.all([
        fetch(`/api/shops?${shopsParams.toString()}`),
        fetch(`/api/services?${servicesParams.toString()}`),
        // Also get all shops for name/description matching
        fetch('/api/shops')
      ]);
      
      const [shopsData, servicesData, allShopsData] = await Promise.all([
        shopsResponse.json(),
        servicesResponse.json(), 
        allShopsResponse.json()
      ]);
      
      let searchResults = [];
      
      // Add shops that match the query by name or description
      if (allShopsData.success) {
        const matchingShops = allShopsData.data.filter(shop => {
          const nameMatch = shop.name.toLowerCase().includes(query.toLowerCase());
          const descMatch = shop.about?.toLowerCase().includes(query.toLowerCase());
          const addressMatch = shop.address?.toLowerCase().includes(query.toLowerCase());
          
          // Apply location filter if specified
          let locationMatch = true;
          if (location && location.trim()) {
            locationMatch = shop.city?.toLowerCase().includes(location.toLowerCase()) ||
                          shop.address?.toLowerCase().includes(location.toLowerCase());
          }
          
          return (nameMatch || descMatch || addressMatch) && locationMatch;
        });
        
        searchResults = [...searchResults, ...matchingShops.map(transformShopData)];
      }
      
      // Add shops that have services matching the query
      // Use Promise.all to fetch all shops in parallel instead of sequentially
      if (servicesData.success && servicesData.data?.length > 0) {
        const serviceShopIds = [...new Set(servicesData.data.map(service => service.shop_id))];

        // Fetch all shops in parallel
        const shopPromises = serviceShopIds.map(async (shopId) => {
          const shopParams = new URLSearchParams();
          shopParams.append('shop_id', shopId);
          if (location && location.trim()) {
            shopParams.append('city', location.trim());
          }

          const shopResponse = await fetch(`/api/shops?${shopParams.toString()}`);
          return shopResponse.json();
        });

        const shopResults = await Promise.all(shopPromises);

        for (const shopData of shopResults) {
          if (shopData.success && shopData.data?.length > 0) {
            const shop = shopData.data[0];
            const existingShop = searchResults.find(s => s.id === shop.id);

            // Additional location check for shops without city data
            let locationMatch = true;
            if (location && location.trim() && !shop.city) {
              locationMatch = shop.address?.toLowerCase().includes(location.toLowerCase());
            }

            if (!existingShop && locationMatch) {
              searchResults.push(transformShopData(shop));
            }
          }
        }
      }
      
      setResults(searchResults);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, search };
};