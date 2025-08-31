import { useGlobalNotifications, createNotificationHelpers } from '@/components/ui/carbon-notification';

export const useCarbonNotifications = () => {
  const { addNotification, removeNotification, clearAll } = useGlobalNotifications();
  const helpers = createNotificationHelpers();

  return {
    // Direct access to context methods
    addNotification,
    removeNotification,
    clearAll,
    
    // Helper methods for common notification types
    success: helpers.success,
    error: helpers.error,
    warning: helpers.warning,
    info: helpers.info,
    loading: helpers.loading,
    
    // Additional utility methods
    showSuccess: (message: string, details?: string) => 
      helpers.success(message, details),
    
    showError: (message: string, details?: string) => 
      helpers.error(message, details),
    
    showWarning: (message: string, details?: string) => 
      helpers.warning(message, details),
    
    showInfo: (message: string, details?: string) => 
      helpers.info(message, details),
    
    showLoading: (message: string, details?: string) => 
      helpers.loading(message, details),
    
    // Method to update a loading notification to success/error
    updateLoading: (id: string, type: 'success' | 'error', title: string, subtitle?: string) => {
      removeNotification(id);
      if (type === 'success') {
        helpers.success(title, subtitle);
      } else {
        helpers.error(title, subtitle);
      }
    },
    
    // Method for async operations with loading state
    withLoading: async <T>(
      loadingMessage: string,
      operation: () => Promise<T>,
      successMessage?: string,
      errorMessage?: string
    ): Promise<T> => {
      const loadingId = helpers.loading(loadingMessage);
      
      try {
        const result = await operation();
        removeNotification(loadingId);
        if (successMessage) {
          helpers.success(successMessage);
        }
        return result;
      } catch (error) {
        removeNotification(loadingId);
        const errorMsg = errorMessage || (error instanceof Error ? error.message : 'Si è verificato un errore');
        helpers.error(errorMsg);
        throw error;
      }
    }
  };
}; 