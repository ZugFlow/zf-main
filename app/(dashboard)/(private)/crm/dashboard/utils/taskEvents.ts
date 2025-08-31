// Task Events System
// Similar to appointmentEvents.ts but for task-specific events

export const TASK_EVENTS = {
  CREATED: 'task:created',
  UPDATED: 'task:updated', 
  DELETED: 'task:deleted',
  STATUS_CHANGED: 'task:status_changed'
} as const;

export type TaskEventType = typeof TASK_EVENTS[keyof typeof TASK_EVENTS];

export interface TaskEventDetail {
  action: TaskEventType;
  taskId?: string;
  timestamp: Date;
}

// Utility function to dispatch task events
export const dispatchTaskEvent = (type: TaskEventType, detail?: Partial<TaskEventDetail>) => {
  const event = new CustomEvent(type, {
    detail: {
      action: type,
      timestamp: new Date(),
      ...detail,
    },
  });
  
  window.dispatchEvent(event);
};

// Utility function to listen for task events
export const listenForTaskEvents = (
  type: TaskEventType,
  callback: (detail: TaskEventDetail) => void
) => {
  const handleEvent = (event: CustomEvent<TaskEventDetail>) => {
    callback(event.detail);
  };

  window.addEventListener(type, handleEvent as EventListener);

  // Return cleanup function
  return () => {
    window.removeEventListener(type, handleEvent as EventListener);
  };
}; 