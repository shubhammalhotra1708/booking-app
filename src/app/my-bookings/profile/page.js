'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Edit2,
  Save,
  X,
  Lock,
  Trash2,
  ArrowLeft,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { getCurrentUser } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import { normalizePhone } from '@/lib/identity';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: ''
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  
  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { user: authUser } = await getCurrentUser();
      
      if (!authUser) {
        router.push('/client-dashboard');
        return;
      }
      
      setUser(authUser);
      
      // Load customer record
      const supabase = (await import('@/utils/supabase/client')).createClient();
      const { data: customerData, error: customerError } = await supabase
        .from('Customer')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();
      
      if (customerError) {
        logger.error('Error loading customer:', customerError);
        setError('Failed to load profile. Please try again.');
        setLoading(false);
        return;
      }
      
      if (customerData) {
        setCustomer(customerData);
        setFormData({
          name: customerData.name || '',
          email: customerData.email || '',
          phone: customerData.phone || '',
          birthday: customerData.birthday || ''
        });
      } else {
        // No customer record yet - show empty form
        setFormData({
          name: authUser.user_metadata?.name || '',
          email: authUser.email || '',
          phone: authUser.user_metadata?.phone || '',
          birthday: ''
        });
      }
      
      setLoading(false);
    } catch (err) {
      logger.error('Error in loadProfile:', err);
      setError('Failed to load profile. Please try again.');
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const supabase = (await import('@/utils/supabase/client')).createClient();
      const phoneNorm = normalizePhone(formData.phone);
      
      // Check if email/phone is taken by ANOTHER user
      // Email check
      if (formData.email !== customer?.email) {
        const { data: emailCheck } = await supabase
          .from('Customer')
          .select('id, user_id')
          .eq('email', formData.email)
          .maybeSingle();
        
        if (emailCheck && emailCheck.user_id !== user.id) {
          setError('This email is already registered to another account. Please use a different email.');
          setSaving(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
      
      // Phone check
      if (phoneNorm !== customer?.phone_normalized) {
        const { data: phoneCheck } = await supabase
          .from('Customer')
          .select('id, user_id')
          .eq('phone_normalized', phoneNorm)
          .maybeSingle();
        
        if (phoneCheck && phoneCheck.user_id !== user.id) {
          setError('This phone number is already registered to another account. Please use a different number.');
          setSaving(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
      
      // Update or create customer record
      if (customer) {
        // Update existing
        const { error: updateError } = await supabase
          .from('Customer')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            phone_normalized: phoneNorm,
            birthday: formData.birthday || null
          })
          .eq('user_id', user.id);

        if (updateError) {
          logger.error('Update error:', updateError);

          if (updateError.code === '23505') {
            setError('The email or phone number is already in use. Please use different contact details.');
          } else {
            setError('Failed to update profile. Please try again.');
          }

          setSaving(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      } else {
        // Create new
        const { error: createError } = await supabase
          .from('Customer')
          .insert({
            user_id: user.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            phone_normalized: phoneNorm,
            birthday: formData.birthday || null
          });
        
        if (createError) {
          logger.error('Create error:', createError);
          
          if (createError.code === '23505') {
            setError('The email or phone number is already in use. Please use different contact details.');
          } else {
            setError('Failed to create profile. Please try again.');
          }
          
          setSaving(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
      
      // Success!
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setSaving(false);
      
      // Reload to show updated data
      setTimeout(() => {
        loadProfile();
        setSuccess('');
      }, 2000);
      
    } catch (err) {
      logger.error('Error saving profile:', err);
      setError('An unexpected error occurred. Please try again.');
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancel = () => {
    // Reset form to original data
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        birthday: customer.birthday || ''
      });
    }
    setIsEditing(false);
    setValidationErrors({});
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const isAnonymous = user?.user_metadata?.anonymous || !user?.email;
  const accountType = isAnonymous ? 'Guest Account' : 'Permanent Account';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/my-bookings"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Bookings
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">{accountType}</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (validationErrors.name) {
                        setValidationErrors({ ...validationErrors, name: '' });
                      }
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                      validationErrors.name 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-900 text-lg">{formData.name || '—'}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    placeholder="Enter your email address"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    <Lock className="w-3 h-3 inline mr-1" />
                    Email cannot be changed for security reasons
                  </p>
                </div>
              ) : (
                <p className="text-gray-900 text-lg">{formData.email || '—'}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (validationErrors.phone) {
                        setValidationErrors({ ...validationErrors, phone: '' });
                      }
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                      validationErrors.phone
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Enter your 10-digit phone number"
                  />
                  {validationErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-900 text-lg">{formData.phone || '—'}</p>
              )}
            </div>

            {/* Birthday */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Birthday (Optional)
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    We&apos;ll send you special offers on your birthday!
                  </p>
                </div>
              ) : (
                <p className="text-gray-900 text-lg">
                  {formData.birthday
                    ? new Date(formData.birthday).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              )}
            </div>

          </div>

          {/* Edit Mode Actions */}
          {isEditing && (
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
              
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5 mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Change Password Section */}
        {!isAnonymous && !isEditing && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Update Password
                </button>
              )}
            </div>
            
            {showPasswordForm && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your current password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password (min. 6 characters)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm your new password"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={async () => {
                      setError('');
                      setSuccess('');
                      
                      // Validation
                      if (!passwordForm.currentPassword) {
                        setError('Please enter your current password');
                        return;
                      }
                      
                      if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
                        setError('New password must be at least 6 characters');
                        return;
                      }
                      
                      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                        setError('New passwords do not match');
                        return;
                      }
                      
                      setSaving(true);
                      
                      try {
                        const supabase = (await import('@/utils/supabase/client')).createClient();
                        
                        // Verify current password by attempting sign-in
                        const { error: signInError } = await supabase.auth.signInWithPassword({
                          email: user.email,
                          password: passwordForm.currentPassword
                        });
                        
                        if (signInError) {
                          setError('Current password is incorrect');
                          setSaving(false);
                          return;
                        }
                        
                        // Update password
                        const { error: updateError } = await supabase.auth.updateUser({
                          password: passwordForm.newPassword
                        });
                        
                        if (updateError) {
                          setError('Failed to update password: ' + updateError.message);
                          setSaving(false);
                          return;
                        }
                        
                        // Success
                        setSuccess('Password updated successfully!');
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setShowPasswordForm(false);
                        setSaving(false);
                        
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } catch (err) {
                        logger.error('Password change error:', err);
                        setError('An error occurred. Please try again.');
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Update Password
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setError('');
                    }}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Note:</strong> Changes to your profile will apply to all future bookings. Your existing bookings will not be affected.
          </p>
        </div>
      </div>
    </div>
  );
}
