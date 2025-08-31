interface EmailNotificationData {
  to: string;
  customerName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  salonName?: string;
  salonAddress?: string;
  salonPhone?: string;
}

export async function sendBookingConfirmationEmail(emailData: EmailNotificationData): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...emailData,
        templateType: 'confirmation'
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Errore API email:', result.error);
      return { success: false, error: result.error || 'Errore nell\'invio dell\'email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Errore nell\'invio email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Errore di rete nell\'invio email' 
    };
  }
}

export async function sendBookingModificationEmail(emailData: EmailNotificationData): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...emailData,
        templateType: 'modification'
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Errore API email modifica:', result.error);
      return { success: false, error: result.error || 'Errore nell\'invio dell\'email di modifica' };
    }

    return { success: true };
  } catch (error) {
    console.error('Errore nell\'invio email modifica:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Errore di rete nell\'invio email' 
    };
  }
}

export async function sendBookingCancellationEmail(emailData: EmailNotificationData): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...emailData,
        templateType: 'cancellation'
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Errore API email cancellazione:', result.error);
      return { success: false, error: result.error || 'Errore nell\'invio dell\'email di cancellazione' };
    }

    return { success: true };
  } catch (error) {
    console.error('Errore nell\'invio email cancellazione:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Errore di rete nell\'invio email' 
    };
  }
}

// Funzione per testare la connessione email
export async function testEmailConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'test@example.com',
        customerName: 'Test Cliente',
        serviceName: 'Test Servizio',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '10:00',
        subject: '🧪 Test Connessione Email - Zugflow'
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Errore nel test della connessione email' };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Errore di rete nel test email' 
    };
  }
} 