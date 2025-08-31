import { toast } from "sonner";

/**
 * Mostra un toast con titolo, descrizione, tipo e un'azione opzionale.
 * @param title - Il titolo del toast
 * @param description - La descrizione del toast
 * @param type - Il tipo di toast ("success", "error", "info", "warning")
 * @param actionLabel - Etichetta del pulsante d'azione (es. "Undo")
 * @param onActionClick - Funzione da eseguire quando il pulsante viene cliccato
 */
export const showToast = ({
  title,
  description,
  type = "info",
  actionLabel,
  onActionClick,
}: {
  title: string;
  description: string;
  type?: "success" | "error" | "info" | "warning";
  actionLabel?: string; // Testo del pulsante
  onActionClick?: () => void; // Callback per l'azione
}) => {
  const options: any = {}; // Creare dinamicamente le opzioni del toast

  if (actionLabel && onActionClick) {
    options.action = {
      label: actionLabel,
      onClick: onActionClick,
    };
  }

  switch (type) {
    case "success":
      toast.success(`${title}: ${description}`, options);
      break;
    case "error":
      toast.error(`${title}: ${description}`, options);
      break;
    case "warning":
      toast(`${title}: ${description}`, {
        ...options,
        className: "bg-yellow-100 text-yellow-800",
      });
      break;
    default:
      toast(`${title}: ${description}`, options);
  }
};

export const showSuccessToast = (message: string) => {
  toast.success(message);
};

// Nuovo sistema di notifiche Carbon (opzionale)
export const showCarbonNotification = async (title: string, description?: string, type: "success" | "error" | "warning" | "info" = "info") => {
  try {
    // Importazione dinamica per evitare errori se il sistema Carbon non è disponibile
    const { useCarbonNotifications } = await import('@/hooks/use-carbon-notifications');
    const notifications = useCarbonNotifications();
    
    switch (type) {
      case "success":
        notifications.showSuccess(title, description);
        break;
      case "error":
        notifications.showError(title, description);
        break;
      case "warning":
        notifications.showWarning(title, description);
        break;
      case "info":
        notifications.showInfo(title, description);
        break;
    }
  } catch (error) {
    // Fallback al sistema toast esistente se Carbon non è disponibile
    console.warn('Carbon notifications not available, falling back to toast');
    showToast({ title, description: description || '', type });
  }
};

// Helper per operazioni asincrone con Carbon notifications
export const withCarbonLoading = async <T,>(
  loadingMessage: string,
  operation: () => Promise<T>,
  successMessage?: string,
  errorMessage?: string
): Promise<T> => {
  try {
    const { useCarbonNotifications } = await import('@/hooks/use-carbon-notifications');
    const notifications = useCarbonNotifications();
    
    return await notifications.withLoading(
      loadingMessage,
      operation,
      successMessage,
      errorMessage
    );
  } catch (error) {
    // Fallback per operazioni senza Carbon
    console.warn('Carbon notifications not available, operation will run without loading indicator');
    try {
      const result = await operation();
      if (successMessage) {
        showSuccessToast(successMessage);
      }
      return result;
    } catch (opError) {
      const errorMsg = errorMessage || (opError instanceof Error ? opError.message : 'Si è verificato un errore');
      showToast({ title: 'Errore', description: errorMsg, type: 'error' });
      throw opError;
    }
  }
};
