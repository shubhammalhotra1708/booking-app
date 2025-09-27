"use client"

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AddShopAndServices() {
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopAbout, setShopAbout] = useState('');
  const [shopImage, setShopImage] = useState('');
  const [shopRating, setShopRating] = useState('');
  const [services, setServices] = useState([
    { name: '', price: '', description: '', discount: '', targetGender: ['ALL'], duration: '', rating: '', image: '' }
  ]);
  const [status, setStatus] = useState('');

  const supabase = createClient();

  const handleServiceChange = (idx, field, value) => {
    const updated = [...services];
    updated[idx][field] = value;
    setServices(updated);
  };

  const addServiceField = () => {
    setServices([...services, { name: '', price: '', description: '', discount: '', targetGender: ['ALL'], duration: '', rating: '', image: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Adding shop and services...');
    try {
      const response = await fetch('/api/add-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          shopAddress,
          shopPhone,
          shopAbout,
          shopImage,
          shopRating,
          services
        })
      });
      const result = await response.json();
      if (result.success) {
        setStatus('✅ Shop and services added successfully!');
      } else {
        setStatus('❌ Error: ' + result.error);
      }
    } catch (err) {
      setStatus('❌ Error: ' + err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Add Shop & Services</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-semibold">Shop Name</label>
          <input value={shopName} onChange={e => setShopName(e.target.value)} className="border p-2 w-full" required />
        </div>
        <div>
          <label className="block font-semibold">Address</label>
          <input value={shopAddress} onChange={e => setShopAddress(e.target.value)} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block font-semibold">Phone</label>
          <input value={shopPhone} onChange={e => setShopPhone(e.target.value)} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block font-semibold">About</label>
          <input value={shopAbout} onChange={e => setShopAbout(e.target.value)} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block font-semibold">Image URL</label>
          <input value={shopImage} onChange={e => setShopImage(e.target.value)} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block font-semibold">Rating</label>
          <input value={shopRating} onChange={e => setShopRating(e.target.value)} className="border p-2 w-full" />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Services</h2>
          {services.map((service, idx) => (
            <div key={idx} className="border p-4 mb-4 rounded">
              <label className="block font-semibold">Service Name</label>
              <input value={service.name} onChange={e => handleServiceChange(idx, 'name', e.target.value)} className="border p-2 w-full mb-2" required />
              <label className="block font-semibold">Price</label>
              <input value={service.price} onChange={e => handleServiceChange(idx, 'price', e.target.value)} className="border p-2 w-full mb-2" />
              <label className="block font-semibold">Description</label>
              <input value={service.description} onChange={e => handleServiceChange(idx, 'description', e.target.value)} className="border p-2 w-full mb-2" />
              <label className="block font-semibold">Discount (%)</label>
              <input value={service.discount} onChange={e => handleServiceChange(idx, 'discount', e.target.value)} className="border p-2 w-full mb-2" />
              <label className="block font-semibold">Target Gender (comma separated)</label>
              <input value={service.targetGender.join(',')} onChange={e => handleServiceChange(idx, 'targetGender', e.target.value.split(','))} className="border p-2 w-full mb-2" />
              <label className="block font-semibold">Duration (minutes)</label>
              <input value={service.duration} onChange={e => handleServiceChange(idx, 'duration', e.target.value)} className="border p-2 w-full mb-2" />
              <label className="block font-semibold">Rating</label>
              <input value={service.rating} onChange={e => handleServiceChange(idx, 'rating', e.target.value)} className="border p-2 w-full mb-2" />
              <label className="block font-semibold">Image URL</label>
              <input value={service.image} onChange={e => handleServiceChange(idx, 'image', e.target.value)} className="border p-2 w-full mb-2" />
            </div>
          ))}
          <button type="button" onClick={addServiceField} className="bg-blue-500 text-white px-3 py-1 rounded">+ Add Another Service</button>
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Add Shop & Services</button>
      </form>
      {status && <div className="mt-6 p-4 bg-gray-100 rounded">{status}</div>}
    </div>
  );
}
