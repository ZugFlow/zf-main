import { useState, useEffect } from 'react';
import { AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface InactivityIndicatorProps {
  isInactive?: boolean;
  isRefreshing?: boolean;
  className?: string;
}

export function InactivityIndicator({ 
  isInactive = false, 
  isRefreshing = false,
  className = "" 
}: InactivityIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showRefreshMessage, setShowRefreshMessage] = useState(false);

  // Show indicator when inactive or refreshing
  useEffect(() => {
    if (isInactive || isRefreshing) {
      setIsVisible(true);
    } else {
      // Hide after a delay when becoming active
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isInactive, isRefreshing]);

  // Show refresh message
  useEffect(() => {
    if (isRefreshing) {
      setShowRefreshMessage(true);
      const timer = setTimeout(() => {
        setShowRefreshMessage(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isRefreshing]);

  // Listen for refresh events to show indicator
  useEffect(() => {
    const handleRefreshEvent = () => {
      setShowRefreshMessage(true);
      setTimeout(() => {
        setShowRefreshMessage(false);
      }, 2000);
    };

    window.addEventListener('inactivity:refresh', handleRefreshEvent);
    
    return () => {
      window.removeEventListener('inactivity:refresh', handleRefreshEvent);
    };
  }, []);

  if (!isVisible && !showRefreshMessage) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${className}`}>
      {isRefreshing || showRefreshMessage ? (
        <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Aggiornamento dati...</span>
        </div>
      ) : isInactive ? (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Inattivo - Cambio pagina = refresh</span>
        </div>
      ) : null}
    </div>
  );
}
