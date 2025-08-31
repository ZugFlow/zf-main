'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getSalonId } from '@/utils/getSalonId';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Edit, 
  StarFilled,
  Tag,
  Calendar,
  Time,
  Checkmark
} from '@carbon/icons-react';
import { format } from 'date-fns';
import { APPOINTMENT_STATUSES } from '@/components/status';
import { useToast } from '@/hooks/use-toast';

// Define local Appointment interface to match the one used in day.tsx and weekly.tsx
interface Appointment {
  id: string;
  nome: string;
  orarioInizio: string;
  orarioFine: string;
  data: string;
  team_id: string;
  servizio: string;
  accesso: string; // Tipo di accesso (es. "Invitation")
  status: string; // Changed from stato to status
  progresso: number; // Percentuale di completamento
  membri?: string[]; // URL immagini membri
  services?: Array<{ id: string; name: string; price: number; }>;
  color_card?: string[] | string; // Array of colors for the card, or string for backward compatibility
  prefer_card_style?: "filled" | "top" | "bottom" | "left" | "right"; // Style preference for color application
  alone?: string | number; // Add this line to fix the error
  note?: string; // Optional note field
  task?: boolean; // Indicates if this is a task
  email?: string; // Email address for customer notifications
  user_id?: string; // User ID who created the appointment/task
}

const supabase = createClient();

// Funzione per generare orari ogni 5 minuti
const generateTimeSlots = () => {
  const timeSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      timeSlots.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return timeSlots;
};

const timeSlots = generateTimeSlots();

export interface Task {
  id: string;
  nome: string;
  descrizione?: string;
  status: string;
  data: string;
  orarioInizio: string;
  orarioFine?: string;
  color_card?: string[];
  note_richtext?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  salon_id: string;
  team_id?: string;
  parrucchiere?: string;
  stilista?: string;
  prezzo: number;
  note?: string;
  task: boolean;
  telefono?: string;
  email?: string;
  customer_uuid?: string;
  prefer_card_style?: string;
  alone?: string;
  booking_source?: string;
  is_pausa?: boolean;
}

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | Appointment | null;
  onTaskUpdated?: () => void;
}

export function TaskEditModal({ isOpen, onClose, task, onTaskUpdated }: TaskEditModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    descrizione: '',
    status: 'In corso',
    data: format(new Date(), 'yyyy-MM-dd'),
    orarioInizio: '09:00',
    orarioFine: '10:00',
    prezzo: 0,
    note_richtext: '',
    color_card: '#3b82f6',
    task: true,
    team_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUserTeamId, setCurrentUserTeamId] = useState<string | null>(null);

  // Memoized status options for better performance
  const statusOptions = useMemo(() => 
    APPOINTMENT_STATUSES.map(status => ({
      value: status.value,
      label: status.label,
      color: `bg-${status.color}-100 text-${status.color}-800`
    })), []
  );

  // Initialize component
  useEffect(() => {
    initializeComponent();
  }, []);

  // Load task data when modal opens
  useEffect(() => {
    if (isOpen && task) {
      loadTaskData(task);
    }
  }, [isOpen, task]);

  const initializeComponent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }
      setUserId(user.id);

      const salonIdResult = await getSalonId();
      if (!salonIdResult) {
        console.error('No salon ID found');
        return;
      }
      setSalonId(salonIdResult);

      // Get current user's team ID if they are a team member
      await getCurrentUserTeamId(user.id, salonIdResult);
    } catch (error) {
      console.error('Error initializing component:', error);
    }
  };

  // Get current user's team ID
  const getCurrentUserTeamId = async (userId: string, salonId: string) => {
    try {
      const { data: teamData, error: teamError } = await supabase
        .from('team')
        .select('id')
        .eq('user_id', userId)
        .eq('salon_id', salonId)
        .single();

      if (!teamError && teamData) {
        setCurrentUserTeamId(teamData.id);
      }
    } catch (error) {
      console.error('Error getting current user team ID:', error);
    }
  };

  const loadTaskData = (task: Task | Appointment) => {
    // Type guard to check if it's a Task
    const isTask = (item: Task | Appointment): item is Task => {
      return 'created_at' in item && 'user_id' in item && 'salon_id' in item;
    };

    setFormData({
      nome: task.nome,
      descrizione: isTask(task) ? task.descrizione || '' : (task as any).descrizione || '',
      status: task.status || 'In corso',
      data: task.data,
      orarioInizio: task.orarioInizio,
      orarioFine: task.orarioFine || '',
      prezzo: isTask(task) ? task.prezzo || 0 : 0,
      note_richtext: isTask(task) ? task.note_richtext || '' : '',
      color_card: Array.isArray(task.color_card) ? task.color_card[0] : task.color_card || '#3b82f6',
      task: isTask(task) ? task.task || true : (task as any).task || true,
      team_id: currentUserTeamId || ''
    });
  };

  const handleSave = async () => {
    if (!task || !salonId || !userId) return;

    setLoading(true);
    try {
      // Type guard to check if it's a Task
      const isTask = (item: Task | Appointment): item is Task => {
        return 'created_at' in item && 'user_id' in item && 'salon_id' in item;
      };

      // Check if user has permission to update this task
      const taskUserId = isTask(task) ? task.user_id : (task as any).user_id;
      if (taskUserId && taskUserId !== userId) {
        toast({
          title: "Accesso Negato",
          description: "Non hai i permessi per modificare questo task",
          variant: "destructive",
        });
        return;
      }

      const updateData = {
        ...formData,
        team_id: formData.team_id,
        color_card: [formData.color_card],
        note_richtext: formData.note_richtext,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', task.id);

      if (error) {
        console.error('Error updating task:', error);
        toast({
          title: "Errore",
          description: "Errore durante l'aggiornamento del task",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Successo",
        description: "Task aggiornato con successo",
      });

      onClose();
      onTaskUpdated?.();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento del task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nome: '',
      descrizione: '',
      status: 'In corso',
      data: format(new Date(), 'yyyy-MM-dd'),
      orarioInizio: '09:00',
      orarioFine: '10:00',
      prezzo: 0,
      note_richtext: '',
      color_card: '#3b82f6',
      task: true,
      team_id: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl bg-white border-0 shadow-2xl rounded-xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-6 border-b border-gray-100 flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Edit className="h-5 w-5 text-blue-600" />
            </div>
            Modifica Task
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 px-8 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <StarFilled className="h-4 w-4 text-blue-600" />
                Nome Task
              </label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Inserisci il nome del task"
                className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                Data
              </label>
              <Input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Tag className="h-4 w-4 text-purple-600" />
              Descrizione
            </label>
            <Textarea
              value={formData.descrizione}
              onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
              placeholder="Descrizione del task"
              rows={3}
              className="border-gray-200 focus:border-black focus:ring-black focus:ring-2 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Time className="h-4 w-4 text-orange-600" />
                Ora Inizio
              </label>
              <Select
                value={formData.orarioInizio}
                onValueChange={(value) => setFormData(prev => ({ ...prev, orarioInizio: value }))}
              >
                <SelectTrigger className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2">
                  <SelectValue placeholder="Seleziona ora" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(slot => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Time className="h-4 w-4 text-red-600" />
                Ora Fine
              </label>
              <Select
                value={formData.orarioFine}
                onValueChange={(value) => setFormData(prev => ({ ...prev, orarioFine: value }))}
              >
                <SelectTrigger className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2">
                  <SelectValue placeholder="Seleziona ora" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(slot => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="text-green-600 font-bold">€</span>
                Prezzo
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.prezzo}
                onChange={(e) => setFormData(prev => ({ ...prev, prezzo: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Checkmark className="h-4 w-4 text-emerald-600" />
                Stato
              </label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="text-blue-600">✨</span>
              Note Rich Text
            </label>
            <RichTextEditor
              value={formData.note_richtext}
              onChange={(value) => setFormData(prev => ({ ...prev, note_richtext: value }))}
              placeholder="Inizia a scrivere con formattazione..."
              className="border-gray-200 focus-within:border-black focus-within:ring-black focus-within:ring-2"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Annulla
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!formData.nome || loading}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {loading ? 'Salvando...' : 'Salva Modifiche'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 