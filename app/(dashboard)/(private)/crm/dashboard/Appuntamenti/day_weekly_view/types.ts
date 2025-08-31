import { Appointment } from "@/types";

// Re-export the Appointment type for use in this module
export type { Appointment };

export interface Member {
  id: string;
  name: string;
  ColorMember?: string;
  avatar_url?: string;
  visible_users?: boolean;
  order_column?: number;
}

export interface AppointmentCardProps {
  appointments: Appointment[];
  member: Member;
  hourTime: Date;
  dailyViewDate: Date;
  handleCardClick: (appointment: Appointment, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, appointment: Appointment) => void;
  handleResizeStart: (e: React.MouseEvent<Element, MouseEvent>, appointment: Appointment) => void;
  resizing: {
    appointment: Appointment;
    startY: number;
    initialDuration: number;
    newDuration?: number;
  } | null;
  isCompactMode: boolean;
  teamMembers: Member[];
  hourHeight: number;
  currentTotalMinutes: number;
  startTotalMinutes: number;
  totalMinutes: number;
  currentTime: Date;
  moveAppointmentToDeletedOrders: (appointmentId: string) => Promise<void>;
  setInitialFormData: (data: { data: string; orarioInizio: string; orarioFine: string; } | null) => void;
  setIsCreateOrderOpen: (isOpen: boolean) => void;
  setIsDialogOpen: (isOpen: boolean) => void;
  isAppointmentDraggable: (appointment: Appointment) => boolean;
}
