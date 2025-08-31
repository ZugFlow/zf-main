'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getSalonId } from '@/utils/getSalonId';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Add, 
  StarFilled,
  Tag,
  Time,
  Checkmark
} from '@carbon/icons-react';
import { format } from 'date-fns';
import { APPOINTMENT_STATUSES } from '@/components/status';
import { dispatchTaskEvent, TASK_EVENTS } from '../utils/taskEvents';

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

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TaskCreateModal({ isOpen, onClose }: TaskCreateModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    descrizione: '',
    status: 'In corso',
    data: format(new Date(), 'yyyy-MM-dd'),
    orarioInizio: '09:00',
    orarioFine: '10:00',
    prezzo: 0,
    note_richtext: '', // Rich text content
    color_card: '#3b82f6',
    task: true,
    team_id: ''
  });

  const [loading, setLoading] = useState(false);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUserTeamId, setCurrentUserTeamId] = useState<string | null>(null);

  // Status options
  const statusOptions = APPOINTMENT_STATUSES.map(status => ({
    value: status.value,
    label: status.label,
    color: `bg-${status.color}-100 text-${status.color}-800`
  }));

  useEffect(() => {
    if (isOpen) {
      initializeComponent();
    }
  }, [isOpen]);

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
        console.log('Current user team ID:', teamData.id);
      }
    } catch (error) {
      console.error('Error getting current user team ID:', error);
    }
  };

  const createTask = async () => {
    if (!salonId || !userId) return;

    setLoading(true);
    try {
      const taskTeamId = currentUserTeamId || null;

      const newTask = {
        nome: formData.nome,
        descrizione: formData.descrizione,
        status: formData.status,
        data: formData.data,
        orarioInizio: formData.orarioInizio,
        orarioFine: formData.orarioFine,
        prezzo: formData.prezzo,
        note: '', // Rich text content
        note_richtext: formData.note_richtext, // Rich text content
        team_id: taskTeamId,
        user_id: userId,
        salon_id: salonId,
        created_at: new Date().toISOString(),
        task: true,
        is_pausa: false,
        telefono: '',
        email: '',
        customer_uuid: null,
        prefer_card_style: 'default',
        alone: '1',
        booking_source: 'manual',
        color_card: [formData.color_card]
      };

      console.log('Creating task with data:', newTask);

      const { data, error } = await supabase
        .from('orders')
        .insert([newTask])
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return;
      }

      console.log('Task created successfully:', data);
      
      // Reset form
      setFormData({
        nome: '',
        descrizione: '',
        status: 'In corso',
        data: format(new Date(), 'yyyy-MM-dd'),
        orarioInizio: '09:00',
        orarioFine: '10:00',
        prezzo: 0,
        note_richtext: '', // Reset rich text content
        color_card: '#3b82f6',
        task: true,
        team_id: ''
      });

      onClose();
      
      // Dispatch task created event
      dispatchTaskEvent(TASK_EVENTS.CREATED, { taskId: data.id });
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white border-0 shadow-2xl rounded-xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-6 border-b border-gray-100 flex-shrink-0">
          <DialogTitle className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Add className="h-5 w-5 text-emerald-600" />
            </div>
            Crea Nuovo Task
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
                <span className="text-green-600">📅</span>
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
                  <SelectValue placeholder="Seleziona orario" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
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
                  <SelectValue placeholder="Seleziona orario" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
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
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
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
              Note Rich Text (come Notion)
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
            onClick={onClose}
            className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Annulla
          </Button>
          <Button 
            onClick={createTask} 
            disabled={!formData.nome || loading}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {loading ? 'Creazione...' : 'Crea Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
