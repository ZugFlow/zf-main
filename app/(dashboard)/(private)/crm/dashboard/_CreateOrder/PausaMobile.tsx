'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/utils/supabase/client';
import { getSalonId } from '@/utils/getSalonId';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Calendar, Clock, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { dispatchAppointmentEvent, APPOINTMENT_EVENTS } from '../utils/appointmentEvents';

const supabase = createClient();

const pausaSchema = z.object({
  data: z.string().min(1, { message: 'La data è obbligatoria.' }),
  orarioInizio: z
    .string()
    .min(1, { message: "L'orario di inizio è obbligatorio." })
    .regex(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/, { message: 'Formato non valido. Usa HH:mm.' }),
  orarioFine: z
    .string()
    .min(1, { message: "L'orario di fine è obbligatorio." })
    .regex(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/, { message: 'Formato non valido. Usa HH:mm.' }),
  descrizione: z.string().optional(),
  team_id: z.string().min(1, { message: 'Selezionare un membro del team.' }),
});

interface TeamMember {
  id: string;
  name: string;
}

interface PausaMobileProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  initialFormData?: {
    data: string;
    orarioInizio: string;
    orarioFine: string;
    team_id?: string;
  } | null;
  onPausaCreated?: () => void;
  updateModalState?: (isOpen: boolean) => void;
}

export function PausaMobile({
  isDialogOpen,
  setIsDialogOpen,
  initialFormData,
  onPausaCreated,
  updateModalState,
}: PausaMobileProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [uiSubmitting, setUiSubmitting] = useState(false);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  const [orarioInizioVersion, setOrarioInizioVersion] = useState(0);

  const form = useForm<z.infer<typeof pausaSchema>>({
    resolver: zodResolver(pausaSchema),
    defaultValues: {
      data: initialFormData?.data || '',
      orarioInizio: initialFormData?.orarioInizio || '10:00',
      orarioFine: initialFormData?.orarioFine || '',
      descrizione: '',
      team_id: initialFormData?.team_id || '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (!isDialogOpen) return;
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        const salonId = await getSalonId();
        if (!salonId) throw new Error('Impossibile determinare il salone.');
        const { data, error } = await supabase
          .from('team')
          .select('id, name')
          .eq('salon_id', salonId)
          .eq('is_active', true);
        if (error) throw error;
        setTeamMembers((data || []).map((m) => ({ id: String(m.id), name: m.name as string })));
      } catch (e) {
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamMembers();
  }, [isDialogOpen]);

  useEffect(() => {
    if (!initialFormData) return;
    form.setValue('data', initialFormData.data || '');
    form.setValue('orarioInizio', initialFormData.orarioInizio || '10:00');
    form.setValue('orarioFine', initialFormData.orarioFine || '');
    if (initialFormData.team_id) form.setValue('team_id', initialFormData.team_id);
  }, [initialFormData, form]);

  const checkTimeWarning = useCallback((startValue?: string, endValue?: string) => {
    const start = typeof startValue === 'string' ? startValue : form.getValues('orarioInizio');
    const end = typeof endValue === 'string' ? endValue : form.getValues('orarioFine');
    if (!start || !end) {
      setTimeWarning(null);
      return;
    }
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(start) || !timeRegex.test(end)) {
      setTimeWarning(null);
      return;
    }
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (endMin <= startMin) {
      setTimeWarning("⚠️ L'orario di fine deve essere maggiore dell'orario di inizio.");
    } else {
      setTimeWarning(null);
    }
  }, [form]);

  useEffect(() => {
    const sub = form.watch((value, { name }) => {
      if (name === 'orarioInizio') setOrarioInizioVersion((v) => v + 1);
      if (name === 'orarioInizio' || name === 'orarioFine') {
        checkTimeWarning(value.orarioInizio, value.orarioFine);
      }
    });
    return () => sub.unsubscribe();
  }, [form, checkTimeWarning]);

  const closeDialog = () => {
    if (uiSubmitting) return;
    setIsDialogOpen(false);
    updateModalState?.(false);
    setTimeWarning(null);
    form.reset({
      data: initialFormData?.data || '',
      orarioInizio: initialFormData?.orarioInizio || '10:00',
      orarioFine: initialFormData?.orarioFine || '',
      descrizione: '',
      team_id: initialFormData?.team_id || '',
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE d MMMM yyyy', { locale: it });
    } catch {
      return dateString;
    }
  };

  const createPause = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const values = form.getValues();
    setUiSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error('Utente non autenticato.');
      const salonId = await getSalonId();
      if (!salonId) throw new Error('Impossibile determinare il salone.');

      // Optional overlap check similar to pausa.tsx could be added here if needed

      const pausaData = {
        user_id: userData.user.id,
        nome: 'Pausa',
        telefono: '',
        data: values.data,
        orarioInizio: values.orarioInizio,
        orarioFine: values.orarioFine,
        prezzo: 0,
        note: values.descrizione || null,
        status: 'Pausa',
        team_id: values.team_id || null,
        salon_id: salonId,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('orders').insert([pausaData]);
      if (error) throw error;

      // Notify listeners for real-time update
      dispatchAppointmentEvent(APPOINTMENT_EVENTS.CREATED);
      onPausaCreated?.();
      closeDialog();
    } catch (e) {
      // Silent fail or integrate a toast here if available
      console.error('Error creating pause:', e);
    } finally {
      setUiSubmitting(false);
    }
  };

  return (
    <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <SheetContent side="bottom" className="h-[85vh] max-h-[90vh] w-full rounded-t-3xl border-0 p-0 overflow-hidden">
        <div className="flex flex-col h-full bg-white">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex items-center justify-between p-4 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeDialog}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors h-10 w-10"
            >
              <X className="w-5 h-5 text-gray-600" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900 flex-1 text-center mx-3 truncate">
              Nuova Pausa
            </h1>
            <div className="w-10" />
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {/* Data e Orario */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-violet-600" />
                  Data e Orario
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="data" className="text-sm font-medium text-gray-700 block mb-2">Data</Label>
                    <Input
                      type="date"
                      id="data"
                      {...form.register('data')}
                      className="w-full h-12 bg-white border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 block mb-2">Inizio</Label>
                      <Select
                        value={form.watch('orarioInizio')}
                        onValueChange={(val) => {
                          form.setValue('orarioInizio', val);
                          checkTimeWarning(val, form.getValues('orarioFine'));
                        }}
                      >
                        <SelectTrigger className={`h-12 bg-white border-gray-200 text-sm ${form.formState.errors.orarioInizio ? 'border-red-500 focus:ring-red-500' : ''}`}>
                          <SelectValue placeholder="Seleziona orario" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto" position="popper" side="bottom" align="start">
                          {Array.from({ length: 24 * 12 }, (_, i) => {
                            const hour = Math.floor(i / 12);
                            const minute = (i % 12) * 5;
                            const value = `${hour.toString().padStart(2, '0')}:${minute
                              .toString()
                              .padStart(2, '0')}`;
                            return (
                              <SelectItem key={value} value={value} className="py-2 text-sm">
                                {value}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.orarioInizio && (
                        <div className="text-sm text-red-600">{form.formState.errors.orarioInizio.message}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 block mb-2">Fine</Label>
                      {(() => {
                        const startValue = form.getValues('orarioInizio');
                        const isStartValid = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(startValue || '');
                        let minIndex = -1;
                        if (isStartValid) {
                          const [startHour, startMinute] = startValue.split(':').map(Number);
                          minIndex = startHour * 12 + Math.floor(startMinute / 5);
                        }
                        return (
                          <Select
                            key={orarioInizioVersion}
                            value={form.watch('orarioFine')}
                            onValueChange={(val) => {
                              form.setValue('orarioFine', val);
                              checkTimeWarning(form.getValues('orarioInizio'), val);
                            }}
                            disabled={!isStartValid}
                          >
                            <SelectTrigger
                              className={`h-12 bg-white border-gray-200 text-sm ${
                                form.formState.errors.orarioFine || timeWarning ? 'border-red-500 focus:ring-red-500' : ''
                              } ${!isStartValid ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                            >
                              <SelectValue placeholder="Seleziona orario" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto" position="popper" side="bottom" align="start">
                              {isStartValid ? (
                                Array.from({ length: 24 * 12 }, (_, i) => {
                                  if (i <= minIndex) return null;
                                  const hour = Math.floor(i / 12);
                                  const minute = (i % 12) * 5;
                                  const value = `${hour.toString().padStart(2, '0')}:${minute
                                    .toString()
                                    .padStart(2, '0')}`;
                                  return (
                                    <SelectItem key={value} value={value} className="py-2 text-sm">
                                      {value}
                                    </SelectItem>
                                  );
                                })
                              ) : (
                                <div className="px-3 py-2 text-gray-400 text-sm">Seleziona prima l'orario di inizio</div>
                              )}
                            </SelectContent>
                          </Select>
                        );
                      })()}
                      {form.formState.errors.orarioFine && (
                        <div className="text-sm text-red-600">{form.formState.errors.orarioFine.message}</div>
                      )}
                    </div>
                  </div>
                  {timeWarning && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{timeWarning}</div>
                  )}
                </div>
              </div>

              {/* Membro del Team */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-violet-600" />
                  Membro del Team
                </h4>
                <Select onValueChange={(value) => form.setValue('team_id', value)} value={form.watch('team_id')}>
                  <SelectTrigger className="w-full h-12 bg-white border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                    <SelectValue placeholder={loading ? 'Caricamento...' : 'Seleziona un membro'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto" position="popper" side="bottom" align="start">
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id} className="py-3 text-base">
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.team_id && (
                  <div className="text-sm text-red-600 mt-2">{form.formState.errors.team_id.message}</div>
                )}
              </div>

              {/* Note */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Note</h4>
                <Textarea
                  rows={4}
                  placeholder="Aggiungi note per questa pausa..."
                  {...form.register('descrizione')}
                  className="w-full bg-white border-gray-200 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                />
              </div>

              {/* Riepilogo */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Riepilogo</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-700">Data</span>
                    <span className="font-medium text-gray-900">
                      {form.getValues('data') ? formatDate(form.getValues('data')) : 'Non impostata'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-700">Orario</span>
                    <span className="font-medium text-gray-900">
                      {form.getValues('orarioInizio') && form.getValues('orarioFine')
                        ? `${form.getValues('orarioInizio')} - ${form.getValues('orarioFine')}`
                        : 'Non impostato'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="px-4 py-4 border-t border-gray-200">
            <Button
              onClick={createPause}
              disabled={uiSubmitting}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-2xl font-semibold transition-all duration-200 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-base h-14"
            >
              {uiSubmitting ? (
                <div className="flex items-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creazione...
                </div>
              ) : (
                'Crea Pausa'
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default PausaMobile;


