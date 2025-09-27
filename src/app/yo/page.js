

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function SupabaseDemo() {
  const [services, setServices] = useState([])
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [setupStatus, setSetupStatus] = useState(null)
  const [serviceStats, setServiceStats] = useState(null)
  const [selectedGender, setSelectedGender] = useState('ALL')

  const supabase = createClient()

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/services')
      const result = await response.json()
      
      if (result.success) {
        setServices(result.data || [])
        setServiceStats(result.stats)
        // Group services by shop
        const shopMap = new Map()
        result.data?.forEach(service => {
          if (service.Shop) {
            const shopKey = service.id // Using service.id as shop identifier based on your schema
            if (!shopMap.has(shopKey)) {
              shopMap.set(shopKey, {
                id: shopKey,
                ...service.Shop,
                services: []
              })
            "use client"
            }
            shopMap.get(shopKey).services.push(service)
          }
        })
        setShops(Array.from(shopMap.values()))
        setError(null)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const setupServices = async () => {
    try {
      setSetupStatus('Adding dummy services to your Service table...')
      const response = await fetch('/api/services', { method: 'POST' })
      const result = await response.json()
      
      if (result.success) {
        setSetupStatus(`✅ Services added successfully!
        - Shops used: ${result.data.shopsUsed}
        - Services added: ${result.data.servicesAdded}`)
        await fetchServices()
      } else {
        setSetupStatus(`❌ Setup failed: ${result.error}`)
      }
    } catch (err) {
      setSetupStatus(`❌ Setup error: ${err.message}`)
    }
  }

  const checkServices = async () => {
    try {
      setSetupStatus('Checking your Service table...')
      const response = await fetch('/api/services')
      const result = await response.json()
      
      if (result.success) {
        setSetupStatus(`📊 Service Table Status:
        - Total Services: ${result.stats.totalServices}
        - Average Price: $${result.stats.averagePrice}
        - Gender Distribution: ${JSON.stringify(result.stats.genderDistribution, null, 2)}`)
      } else {
        setSetupStatus(`❌ Check failed: ${result.error}`)
      }
    } catch (err) {
      setSetupStatus(`❌ Check error: ${err.message}`)
    }
  }

  const getFilteredServices = () => {
    if (selectedGender === 'ALL') {
      return services
    }
    return services.filter(service => 
      service.targetGender?.includes(selectedGender) || 
      service.targetGender?.includes('ALL')
    )
  }

  const getDiscountedPrice = (price, discount) => {
    const originalPrice = parseFloat(price) || 0
    const discountAmount = parseFloat(discount) || 0
    return originalPrice - (originalPrice * discountAmount / 100)
  }

  const formatGender = (genderArray) => {
    if (!genderArray || genderArray.length === 0) return 'All'
    return genderArray.join(', ')
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">🎉 Your Service Table Demo</h1>
      
      {/* Database Setup Section */}
      <div className="bg-blue-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Service Table Management</h2>
        <div className="flex gap-4 mb-4">
          <button
            onClick={setupServices}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Dummy Services
          </button>
          <button
            onClick={checkServices}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Check Service Stats
          </button>
          <button
            onClick={fetchServices}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Refresh Data
          </button>
        </div>
        {setupStatus && (
          <div className="bg-white p-4 rounded border">
            <pre className="text-sm whitespace-pre-wrap">{setupStatus}</pre>
          </div>
        )}
      </div>

      {/* Connection Status */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
        {loading ? (
          <p className="text-blue-600">Loading services...</p>
        ) : error ? (
          <div className="text-red-600">
            <p>❌ Error: {error}</p>
            <p className="text-sm mt-2">
              Make sure your Service and Shop tables exist, then try adding dummy data.
            </p>
          </div>
        ) : (
          <div className="text-green-600">
            <p>✅ Supabase connection successful!</p>
            <p>Found {services.length} service(s) in your Service table</p>
            {serviceStats && (
              <div className="mt-2 text-sm">
                <p>Average Price: ${serviceStats.averagePrice}</p>
                <p>Gender Distribution: {Object.entries(serviceStats.genderDistribution).map(([gender, count]) => `${gender}: ${count}`).join(', ')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gender Filter */}
      {services.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Filter by Target Gender:</h3>
          <div className="flex gap-2">
            {['ALL', 'MEN', 'WOMEN'].map(gender => (
              <button
                key={gender}
                onClick={() => setSelectedGender(gender)}
                className={`px-4 py-2 rounded ${
                  selectedGender === gender 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Services Display */}
      {services.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Available Services ({getFilteredServices().length})</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredServices().map((service) => (
              <div key={`${service.id}-${service.created_at}`} className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold">{service.name}</h3>
                  <div className="text-right">
                    {service.discount > 0 ? (
                      <div>
                        <span className="text-gray-400 line-through text-sm">${parseFloat(service.price).toFixed(2)}</span>
                        <div className="text-green-600 font-bold">${getDiscountedPrice(service.price, service.discount).toFixed(2)}</div>
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">{service.discount}% OFF</span>
                      </div>
                    ) : (
                      <span className="text-green-600 font-bold text-lg">${parseFloat(service.price).toFixed(2)}</span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration:</span>
                    <span>{service.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Target Gender:</span>
                    <span>{formatGender(service.targetGender)}</span>
                  </div>
                  {service.rating && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rating:</span>
                      <span>⭐ {service.rating}/5.0</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shop:</span>
                    <span className="font-medium">{service.Shop?.name || 'N/A'}</span>
                  </div>
                </div>

                {service.Shop && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">📍 {service.Shop.address}</p>
                    <p className="text-xs text-gray-500">📞 {service.Shop.phone}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Statistics */}
      {services.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Service Statistics</h2>
          
          {serviceStats && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{serviceStats.totalServices}</div>
                <div className="text-gray-600">Total Services</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">${serviceStats.averagePrice}</div>
                <div className="text-gray-600">Average Price</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">Gender Distribution</div>
                <div className="mt-2 space-y-1">
                  {Object.entries(serviceStats.genderDistribution).map(([gender, count]) => (
                    <div key={gender} className="flex justify-between text-sm">
                      <span>{gender}:</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Demo Features Demonstrated:</h3>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>✅ Fetching data from your Service table with Shop relationships</li>
              <li>✅ Filtering services by targetGender array field</li>
              <li>✅ Calculating discounted prices</li>
              <li>✅ Displaying complex data types (arrays, relationships)</li>
              <li>✅ Real-time statistics and analytics</li>
              <li>✅ Proper error handling and loading states</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
