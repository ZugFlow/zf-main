"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  CheckmarkFilled, 
  ErrorFilled, 
  WarningFilled, 
  InformationFilled,
  Close
} from '@carbon/icons-react';

// Simple loading spinner component
const LoadingSpinner = () => (
  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
);

// Create custom notification components with professional styling
const Notification = ({ children, kind, lowContrast, hideCloseButton, onClose, className, style, autoClose, duration }: any) => {
  const getNotificationStyles = (kind: string) => {
    const baseStyles = "relative flex items-start p-4 rounded-xl shadow-lg border backdrop-blur-sm transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-xl overflow-hidden";
    
    switch (kind) {
      case 'success':
        return `${baseStyles} bg-white dark:bg-slate-800 border-green-200 dark:border-green-700/50 shadow-green-100/50 dark:shadow-green-900/20 notification-success`;
      case 'error':
        return `${baseStyles} bg-white dark:bg-slate-800 border-red-200 dark:border-red-700/50 shadow-red-100/50 dark:shadow-red-900/20 notification-error`;
      case 'warning':
        return `${baseStyles} bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-700/50 shadow-amber-100/50 dark:shadow-amber-900/20 notification-warning`;
      case 'info':
      default:
        return `${baseStyles} bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-700/50 shadow-blue-100/50 dark:shadow-blue-900/20 notification-info`;
    }
  };

  return (
    <div 
      className={`${getNotificationStyles(kind)} ${className || ''}`}
      style={style}
    >
      {children}
      {!hideCloseButton && onClose && (
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-200 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 z-10"
        >
          <Close size={16} />
        </button>
      )}
      {autoClose && duration && (
        <div 
          className="notification-progress"
          style={{ '--duration': `${duration}ms` } as React.CSSProperties}
        />
      )}
    </div>
  );
};

const NotificationIcon = ({ children, type }: any) => {
  const getIconStyles = (type: string) => {
    const baseStyles = "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm notification-icon";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-700/50`;
      case 'error':
        return `${baseStyles} bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-700/50`;
      case 'warning':
        return `${baseStyles} bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-700/50`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-700/50`;
    }
  };

  return (
    <div className={getIconStyles(type)}>
      {children}
    </div>
  );
};

const NotificationTextDetails = ({ children }: any) => (
  <div className="flex-1 ml-3 mr-8">
    {children}
  </div>
);

const NotificationTextTitle = ({ children }: any) => (
  <div className="font-semibold text-gray-900 dark:text-slate-100 text-sm mb-1 leading-tight">
    {children}
  </div>
);

const NotificationTextSubtitle = ({ children }: any) => (
  <div className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed max-w-prose">
    {children}
  </div>
);

const NotificationActionButton = ({ children, onClick, 'aria-label': ariaLabel }: any) => (
  <button 
    onClick={onClick} 
    aria-label={ariaLabel} 
    className="ml-3 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
  >
    {children}
  </button>
);

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface GlobalNotification {
  id: string;
  title: string;
  subtitle?: string;
  type: NotificationType;
  actionLabel?: string;
  onAction?: () => void;
  autoClose?: boolean;
  duration?: number;
  loading?: boolean;
}

interface NotificationContextType {
  notifications: GlobalNotification[];
  addNotification: (notification: Omit<GlobalNotification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useGlobalNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useGlobalNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children, 
  maxNotifications = 5 
}) => {
  const [notifications, setNotifications] = useState<GlobalNotification[]>([]);

  const addNotification = useCallback((notification: Omit<GlobalNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: GlobalNotification = {
      ...notification,
      id,
      autoClose: notification.autoClose ?? true,
      duration: notification.duration ?? 5000,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    // Auto close functionality
    if (newNotification.autoClose && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, [maxNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const getNotificationIcon = (type: NotificationType) => {
    const iconProps = { size: 20, className: "drop-shadow-sm" };
    
    switch (type) {
      case 'success':
        return <CheckmarkFilled {...iconProps} />;
      case 'error':
        return <ErrorFilled {...iconProps} />;
      case 'warning':
        return <WarningFilled {...iconProps} />;
      case 'info':
        return <InformationFilled {...iconProps} />;
      default:
        return <InformationFilled {...iconProps} />;
    }
  };

  const getNotificationKind = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
      <div className="notification-container">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className="notification-item mb-3"
          >
            <Notification
              kind={getNotificationKind(notification.type)}
              lowContrast={false}
              hideCloseButton={false}
              onClose={() => removeNotification(notification.id)}
              autoClose={notification.autoClose}
              duration={notification.duration}
              className=""
            >
              <NotificationIcon type={notification.type}>
                {notification.loading ? (
                  <div className="notification-loading">
                    <LoadingSpinner />
                  </div>
                ) : (
                  getNotificationIcon(notification.type)
                )}
              </NotificationIcon>
              <NotificationTextDetails>
                <NotificationTextTitle>
                  {notification.title}
                </NotificationTextTitle>
                {notification.subtitle && (
                  <NotificationTextSubtitle>
                    {notification.subtitle}
                  </NotificationTextSubtitle>
                )}
              </NotificationTextDetails>
              {notification.actionLabel && notification.onAction && (
                <NotificationActionButton
                  onClick={notification.onAction}
                  aria-label={notification.actionLabel}
                >
                  {notification.actionLabel}
                </NotificationActionButton>
              )}
            </Notification>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// Utility functions for easy notification creation
export const createNotificationHelpers = () => {
  const { addNotification } = useGlobalNotifications();

  return {
    success: (title: string, subtitle?: string, options?: Partial<GlobalNotification>) => {
      return addNotification({
        title,
        subtitle,
        type: 'success',
        ...options,
      });
    },
    error: (title: string, subtitle?: string, options?: Partial<GlobalNotification>) => {
      return addNotification({
        title,
        subtitle,
        type: 'error',
        ...options,
      });
    },
    warning: (title: string, subtitle?: string, options?: Partial<GlobalNotification>) => {
      return addNotification({
        title,
        subtitle,
        type: 'warning',
        ...options,
      });
    },
    info: (title: string, subtitle?: string, options?: Partial<GlobalNotification>) => {
      return addNotification({
        title,
        subtitle,
        type: 'info',
        ...options,
      });
    },
    loading: (title: string, subtitle?: string, options?: Partial<GlobalNotification>) => {
      return addNotification({
        title,
        subtitle,
        type: 'info',
        loading: true,
        autoClose: false,
        ...options,
      });
    },
  };
}; 