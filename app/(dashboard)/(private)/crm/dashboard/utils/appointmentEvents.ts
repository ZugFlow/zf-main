// Event system for appointment updates
export const APPOINTMENT_EVENTS = {
  CREATED: 'appointment-created',
  UPDATED: 'appointment-updated',
  DELETED: 'appointment-deleted',
} as const;

export type AppointmentEventType = typeof APPOINTMENT_EVENTS[keyof typeof APPOINTMENT_EVENTS];

export interface AppointmentEventDetail {
  appointmentId?: string;
  action: AppointmentEventType;
  timestamp: Date;
  updateData?: any;
}

// Utility function to dispatch appointment events
export const dispatchAppointmentEvent = (type: AppointmentEventType, detail?: Partial<AppointmentEventDetail>) => {
  const event = new CustomEvent(type, {
    detail: {
      action: type,
      timestamp: new Date(),
      ...detail,
    },
  });
  
  window.dispatchEvent(event);
};

// Utility function to listen for appointment events
export const listenForAppointmentEvents = (
  type: AppointmentEventType,
  callback: (detail: AppointmentEventDetail) => void
) => {
  const handleEvent = (event: CustomEvent<AppointmentEventDetail>) => {
    callback(event.detail);
  };

  window.addEventListener(type, handleEvent as EventListener);

  // Return cleanup function
  return () => {
    window.removeEventListener(type, handleEvent as EventListener);
  };
};
