'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, X, Bell } from 'lucide-react';

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for saved notifications
    const savedNotifications = localStorage.getItem('clientNotifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed.filter(n => !n.read));
      } catch (error) {
        localStorage.removeItem('clientNotifications');
      }
    }

    // Listen for booking status changes (this would be enhanced with WebSockets in production)
    const checkForUpdates = () => {
      const session = JSON.parse(localStorage.getItem('clientSession') || '{}');
      if (session.token && !session.isGuest) {
        // In a real app, this would be a WebSocket or Server-Sent Events connection
        // For now, we'll simulate notifications
        simulateStatusChangeCheck(session);
      }
    };

    // Check every 30 seconds for status changes
    const interval = setInterval(checkForUpdates, 30000);
    checkForUpdates(); // Initial check

    return () => clearInterval(interval);
  }, []);

  const simulateStatusChangeCheck = async (session) => {
    try {
      // This would normally be handled by webhooks/WebSockets
      // For demo purposes, we'll check if there are any recent status changes
      const searchField = session.phone ? 'customer_phone' : 'customer_email';
      const searchValue = session.phone || session.email;
      
      const response = await fetch(`/api/bookings?${searchField}=${searchValue}`);
      if (response.ok) {
        const result = await response.json();
        const bookings = result.data || [];
        
        // Check for recently updated bookings (within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentUpdates = bookings.filter(booking => {
          const updatedAt = new Date(booking.updated_at);
          return updatedAt > fiveMinutesAgo;
        });

        recentUpdates.forEach(booking => {
          addNotification({
            id: `booking_${booking.id}_${booking.updated_at}`,
            type: 'booking_update',
            title: getStatusTitle(booking.status),
            message: getStatusMessage(booking.status, booking),
            status: booking.status,
            bookingId: booking.id,
            timestamp: new Date().toISOString()
          });
        });
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => {
      // Avoid duplicate notifications
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;

      const updated = [notification, ...prev];
      localStorage.setItem('clientNotifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId);
      localStorage.setItem('clientNotifications', JSON.stringify(updated));
      return updated;
    });
  };

  const getStatusTitle = (status) => {
    switch (status) {
      case 'confirmed':
        return '🎉 Booking Confirmed!';
      case 'completed':
        return '✅ Service Completed';
      case 'cancelled':
        return '❌ Booking Cancelled';
      case 'rejected':
        return '❌ Booking Declined';
      default:
        return '📋 Booking Updated';
    }
  };

  const getStatusMessage = (status, booking) => {
    const date = new Date(booking.booking_date).toLocaleDateString();
    const time = booking.booking_time;
    
    switch (status) {
      case 'confirmed':
        return `Your appointment on ${date} at ${time} has been confirmed!`;
      case 'completed':
        return `Thank you for visiting us on ${date}! We hope you enjoyed your service.`;
      case 'cancelled':
        return `Your appointment on ${date} at ${time} has been cancelled.`;
      case 'rejected':
        return `Unfortunately, we couldn't accommodate your requested appointment on ${date} at ${time}.`;
      default:
        return `Your booking status has been updated to ${status}.`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (notifications.length === 0) return null;

  return (
    <>
      {/* Notification Bell */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="relative bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>
      </div>

      {/* Notification Panel */}
      {isVisible && (
        <div className="fixed top-16 right-4 w-80 max-h-96 bg-white rounded-lg shadow-xl border z-50 overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 border-b hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  {getStatusIcon(notification.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-gray-50 text-center">
            <button
              onClick={() => {
                setNotifications([]);
                localStorage.removeItem('clientNotifications');
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Toast Notifications for new updates */}
      {notifications.slice(0, 1).map((notification) => (
        <div
          key={`toast_${notification.id}`}
          className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border p-4 max-w-sm z-50 animate-slide-up"
        >
          <div className="flex items-start space-x-3">
            {getStatusIcon(notification.status)}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900">
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => markAsRead(notification.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </>
  );
}