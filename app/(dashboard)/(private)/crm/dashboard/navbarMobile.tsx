'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Calendar, Users, Bell, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { listenForChatNotificationEvents, type ChatNotificationDetail } from './utils/chatEvents';
import { createClient } from '@/utils/supabase/client';
import { getSalonId } from '@/utils/getSalonId';

interface MobileNavbarProps {
  toggleDay?: () => void;
  toggleClients?: () => void;
  toggleOnlineBookings?: () => void;
  showDay?: boolean;
  showClients?: boolean;
  showOnlineBookings?: boolean;
  hasPermission?: (permission: string) => boolean;
  canAccess?: (requiredPermissions: string[]) => boolean;
}

export function MobileNavbar({
  toggleDay,
  toggleClients,
  toggleOnlineBookings,
  showDay = true,
  showClients = false,
  showOnlineBookings = false,
  hasPermission = () => false,
  canAccess = () => false
}: MobileNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ChatNotificationDetail[]>([]);
  const [bookingCount, setBookingCount] = useState(0);
  const [hasBookingAlert, setHasBookingAlert] = useState(false);
  

  const menuItems = [
    {
      id: 'day',
      label: 'Appuntamenti',
      icon: Calendar,
      action: toggleDay,
      isActive: showDay,
      permissions: ['canViewAppointments']
    },
    {
      id: 'clients',
      label: 'Clienti',
      icon: Users,
      action: toggleClients,
      isActive: showClients,
      permissions: ['canViewClients']
    },
    {
      id: 'bookings',
      label: 'Prenotazioni',
      icon: Globe,
      action: toggleOnlineBookings,
      isActive: showOnlineBookings,
      permissions: ['canViewAppointments']
    }
  ];

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuItemClick = (item: typeof menuItems[0]) => {
    if (item.action) {
      item.action();
    }
    setIsMenuOpen(false);
  };

  const filteredMenuItems = menuItems.filter(item => 
    canAccess(item.permissions)
  );

  useEffect(() => {
    const cleanup = listenForChatNotificationEvents(detail => {
      setNotifications(prev => [detail, ...prev]);
    });
    return cleanup;
  }, []);

  // Fetch booking alerts on mount (parity with desktop navbar)
  useEffect(() => {
    const fetchBookingAlert = async () => {
      try {
        const supabase = createClient();
        const salonId = await getSalonId();
        if (!salonId) return;
        const { count, error } = await supabase
          .from('online_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('salon_id', salonId)
          .eq('archived', false)
          .eq('status', 'pending');
        if (!error) {
          setBookingCount(count ?? 0);
          setHasBookingAlert((count ?? 0) > 0);
        }
      } catch (err) {
        // Silent fail on mobile
      }
    };
    fetchBookingAlert();
    const handleBookingsUpdated = () => fetchBookingAlert();
    window.addEventListener('onlineBookings:updated', handleBookingsUpdated);
    return () => window.removeEventListener('onlineBookings:updated', handleBookingsUpdated);
  }, []);

  console.log('🔍 [MobileNavbar] Menu items:', menuItems);
  console.log('🔍 [MobileNavbar] Filtered menu items:', filteredMenuItems);
  console.log('🔍 [MobileNavbar] canAccess function:', canAccess);
  console.log('🔍 [MobileNavbar] hasPermission function:', hasPermission);

  return (
    <div className="relative">
      {/* Mobile Navigation Bar */}
      <div className="flex items-center justify-between w-full px-4 py-2 bg-white border-b border-gray-100">
        {/* Logo and Title */}
        <div className="flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={28} 
            height={28} 
            className="object-contain"
          />
          <span className="text-lg font-bold text-black">ZugFlow</span>
        </div>
        {/* Action Buttons: Notifications and Menu */}
        <div className="flex items-center gap-2">
          {/* Notifications Bell */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsMenuOpen(false); }}
            className="relative h-10 w-10 p-0 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200"
          >
            <AnimatePresence mode="wait">
              {isNotificationsOpen ? (
                <motion.div key="notify-close" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X className="h-5 w-5 text-violet-700" />
                </motion.div>
              ) : (
                <motion.div key="bell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Bell className="h-5 w-5 text-violet-700" />
                </motion.div>
              )}
            </AnimatePresence>
            {(notifications.length > 0 || hasBookingAlert) && (
              <div className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 bg-red-600 text-white text-[10px] rounded-full flex items-center justify-center">
                {notifications.length + (bookingCount || 0)}
              </div>
            )}
          </Button>
          {/* Hamburger Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { handleMenuToggle(); setIsNotificationsOpen(false); }}
            className="h-10 w-10 p-0 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200"
          >
            <AnimatePresence mode="wait">
              {isMenuOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X className="h-5 w-5 text-violet-700" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Menu className="h-5 w-5 text-violet-700" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col"
              style={{
                paddingTop: 'env(safe-area-inset-top, 0)',
                paddingBottom: 'env(safe-area-inset-bottom, 0)'
              }}
            >
              {/* Menu Header */}
              <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image 
                      src="/logo.png" 
                      alt="Logo" 
                      width={32} 
                      height={32} 
                      className="object-contain"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-violet-900">Menu Principale</h3>
                      <p className="text-sm text-violet-600 mt-1">Gestione completa del salone</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMenuOpen(false)}
                    className="h-10 w-10 p-0 rounded-xl bg-violet-100 hover:bg-violet-200"
                  >
                    <X className="h-5 w-5 text-violet-700" />
                  </Button>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-4 px-4 flex-1 overflow-y-auto">
                {filteredMenuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleMenuItemClick(item)}
                      className={`
                        w-full flex items-center gap-4 px-6 py-4 text-left transition-all duration-200 rounded-xl mb-2
                        ${item.isActive 
                          ? 'bg-violet-100 text-violet-700 border-2 border-violet-300' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-violet-600 border-2 border-transparent'
                        }
                      `}
                    >
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                        ${item.isActive 
                          ? 'bg-violet-200 text-violet-700' 
                          : 'bg-gray-100 text-gray-600'
                        }
                      `}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-lg font-semibold">{item.label}</span>
                      {item.isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="w-3 h-3 bg-violet-500 rounded-full ml-auto"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Menu Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Sistema Online</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Notifications Panel */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsNotificationsOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col"
              style={{
                paddingTop: 'env(safe-area-inset-top, 0)',
                paddingBottom: 'env(safe-area-inset-bottom, 0)'
              }}
            >
              {/* Header */}
              <div className="px-6 py-6 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
                    <div>
                      <h3 className="text-xl font-bold text-violet-900">Notifiche</h3>
                      <p className="text-sm text-violet-600 mt-1">Tutte le notifiche</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="h-10 w-10 p-0 rounded-xl bg-violet-100 hover:bg-violet-200"
                  >
                    <X className="h-5 w-5 text-violet-700" />
                  </Button>
                </div>
              </div>
              {/* Content */}
              <div className="py-4 px-4 flex-1 overflow-y-auto">
                {/* Booking alerts summary */}
                {bookingCount > 0 && (
                  <div className="px-4 py-3 mb-2 rounded-xl bg-violet-50 border border-violet-200">
                    <div className="flex items-center gap-2 text-violet-800">
                      <Calendar className="h-4 w-4" />
                      <span>Hai {bookingCount} prenotazioni da confermare</span>
                    </div>
                  </div>
                )}

                {/* Chat notifications */}
                {notifications.length === 0 ? (
                  <p className="text-gray-700">Nessuna nuova notifica</p>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} className="px-4 py-2 border-b border-gray-100 hover:bg-gray-50">
                      <p className="font-semibold text-gray-800">{n.title}</p>
                      {n.subtitle && <p className="text-sm text-gray-600">{n.subtitle}</p>}
                    </div>
                  ))
                )}
              </div>
              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Sistema Online</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
