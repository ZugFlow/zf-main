import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from "sonner";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/utils/supabase/client';
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ClockIcon, UserIcon, AlertCircle, X } from 'lucide-react';
import { dispatchAppointmentEvent, APPOINTMENT_EVENTS } from '../utils/appointmentEvents';
import { useLocalization } from '@/hooks/useLocalization';

const supabase = createClient();

const pausaSchema = z.object({
  data: z.string().min(1, { message: 'La data è obbligatoria.' }),
  orarioInizio: z
    .string()
    .min(1, { message: "L'orario di inizio è obbligatorio." })
    .regex(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/, { message: 'Formato orario di inizio non valido. Usa HH:mm.' }),
  orarioFine: z
    .string()
    .min(1, { message: "L'orario di fine è obbligatorio." })
    .regex(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/, { message: 'Formato orario di fine non valido. Usa HH:mm.' }),
  descrizione: z.string().optional(),
  team_id: z.string().min(1, { message: 'Selezionare un membro del team.' }),
});

function CreatePausaForm({
  open,
  onOpenChange,
  initialFormData,
  onPausaCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFormData?: {
    data: string;
    orarioInizio: string;
    orarioFine: string;
    team_id?: string;
  } | null;
  onPausaCreated?: () => void;
}) {
  const { t } = useLocalization();

  const form = useForm<z.infer<typeof pausaSchema>>({
    resolver: zodResolver(pausaSchema),
    defaultValues: {
      data: initialFormData?.data || '',
      orarioInizio: initialFormData?.orarioInizio || '10:00',
      orarioFine: initialFormData?.orarioFine || '',
      descrizione: '',
      team_id: initialFormData?.team_id && initialFormData?.team_id !== '' ? initialFormData.team_id : '',
    },
  });

  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  const [orarioInizioVersion, setOrarioInizioVersion] = useState(0);

  useEffect(() => {
    async function fetchTeamMembers() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setTeamMembers([]);
          return;
        }
        setUserId(user.id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('salon_id')
          .eq('id', user.id)
          .single();
        let salon_id = null;
        if (!profileError && profileData?.salon_id) {
          salon_id = profileData.salon_id;
        } else {
          setTeamMembers([]);
          return;
        }
        if (salon_id) {
          const { data: teamData, error: teamError } = await supabase
            .from('team')
            .select('id, name')
            .eq('salon_id', salon_id)
            .eq('is_active', true);
          if (teamError) {
            setTeamMembers([]);
          } else if (Array.isArray(teamData) && teamData.length > 0) {
            setTeamMembers(teamData);
          } else {
            setTeamMembers([]);
          }
        } else {
          setTeamMembers([]);
        }
      } catch (err: any) {
        setTeamMembers([]);
      }
    }
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    if (
      teamMembers.length > 0 &&
      initialFormData?.team_id &&
      initialFormData.team_id !== ''
    ) {
      const current = form.getValues('team_id');
      if (!current && teamMembers.some(m => m.id === initialFormData.team_id)) {
        form.setValue('team_id', initialFormData.team_id);
      }
    }
  }, [teamMembers, initialFormData?.team_id, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'orarioInizio') {
        setOrarioInizioVersion(v => v + 1);
        const startValue = value.orarioInizio ?? "";
        const endValue = value.orarioFine ?? "";
        if (
          /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(startValue) &&
          /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(endValue)
        ) {
          const [startHour, startMinute] = startValue.split(":").map(Number);
          const [endHour, endMinute] = endValue.split(":").map(Number);
          if (
            endHour < startHour ||
            (endHour === startHour && endMinute <= startMinute)
          ) {
            form.setValue('orarioFine', '');
          }
        } else if (!startValue) {
          form.setValue('orarioFine', '');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const checkTimeWarning = useCallback((startValue?: string, endValue?: string) => {
    const start = typeof startValue === 'string' ? startValue : form.getValues('orarioInizio');
    const end = typeof endValue === 'string' ? endValue : form.getValues('orarioFine');
    const safeStart = start ?? "";
    const safeEnd = end ?? "";
    if (
      safeStart && safeEnd &&
      /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(safeStart) &&
      /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(safeEnd)
    ) {
      const [startHour, startMinute] = safeStart.split(":").map(Number);
      const [endHour, endMinute] = safeEnd.split(":").map(Number);
      if (endHour < startHour || (endHour === startHour && endMinute < startMinute)) {
        setTimeWarning(t('pausa.time_warning', "L'orario di fine deve essere maggiore o uguale all'orario di inizio."));
      } else {
        setTimeWarning(null);
      }
    } else {
      setTimeWarning(null);
    }
  }, [form, t]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'orarioInizio' || name === 'orarioFine') {
        checkTimeWarning(value.orarioInizio, value.orarioFine);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, checkTimeWarning]);

  const handleSubmit = useCallback(
    async (values: z.infer<typeof pausaSchema>) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error(t('pausa.user_not_authenticated', 'Utente non autenticato. Accesso richiesto.'));
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('salon_id')
          .eq('id', user.id)
          .single();
        let salon_id = null;
        if (!profileError && profileData?.salon_id) {
          salon_id = profileData.salon_id;
        }
        if (!salon_id) throw new Error(t('pausa.cannot_determine_salon', 'Impossibile determinare il salone.'));

        const { data: existingAppointments, error: overlapError } = await supabase
          .from('orders')
          .select('id, orarioInizio, orarioFine, status, nome')
          .eq('team_id', values.team_id)
          .eq('data', values.data)
          .not('status', 'eq', 'Pausa')
          .not('status', 'eq', 'Eliminato');

        if (overlapError) throw overlapError;

        const hasOverlap = existingAppointments?.some(appointment => {
          const existingStart = appointment.orarioInizio;
          const existingEnd = appointment.orarioFine;
          const pausaStart = values.orarioInizio;
          const pausaEnd = values.orarioFine;
          const toMinutes = (time: string) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
          };
          const existingStartMin = toMinutes(existingStart);
          const existingEndMin = toMinutes(existingEnd);
          const pausaStartMin = toMinutes(pausaStart);
          const pausaEndMin = toMinutes(pausaEnd);
          const overlap = pausaStartMin < existingEndMin && existingStartMin < pausaEndMin;
          console.log('Controllo sovrapposizione:', {
            existing: `${existingStart}-${existingEnd}`,
            pausa: `${pausaStart}-${pausaEnd}`,
            overlap,
            nome: appointment.nome
          });
          return overlap;
        });

        if (hasOverlap) {
          toast(
            t('pausa.overlap_error_title', "Sovrapposizione appuntamento"),
            {
              description: t('pausa.overlap_error_description', "Non è possibile creare la pausa: esiste già un appuntamento per questo membro del team in quell'orario."),
              duration: 5000,
            }
          );
          return;
        }

        const pausaData = {
          user_id: user.id,
          nome: 'Pausa',
          telefono: '',
          data: values.data,
          orarioInizio: values.orarioInizio,
          orarioFine: values.orarioFine,
          prezzo: 0,
          note: values.descrizione || null,
          status: 'Pausa',
          team_id: values.team_id || null,
          salon_id: salon_id,
          created_at: new Date().toISOString(),
        };

        const { error: pausaError } = await supabase
          .from('orders')
          .insert([pausaData]);
        if (pausaError) throw pausaError;

        dispatchAppointmentEvent(APPOINTMENT_EVENTS.CREATED);

        if (onPausaCreated) onPausaCreated();
        onOpenChange(false);
      } catch (error: any) {
        alert(error.message || t('pausa.error_creating_break', 'Errore durante la creazione della pausa.'));
      }
    },
    [onPausaCreated, onOpenChange, t]
  );

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex min-h-screen min-w-full items-center justify-center bg-black/30 backdrop-blur-sm"
      onMouseDown={handleBackdropClick}
    >
      <div
        className="max-w-2xl bg-white dark:bg-slate-900 shadow-lg rounded-xl max-h-[90vh] flex flex-col mx-auto"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-slate-100 font-['Manrope']">
              <div className="w-8 h-8 bg-blue-100 dark:bg-slate-700/50 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              {t('pausa.new_break', 'Nuova Pausa')}
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 rounded-full text-gray-600 dark:text-slate-300 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="py-6 px-6 space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-2 font-['Manrope']">
                      <CalendarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      {t('pausa.date', 'Data')}
                    </label>
                    <input
                      type="date"
                      {...form.register('data')}
                      className="h-12 border-gray-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2 rounded-lg px-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 font-['Manrope']"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-2 font-['Manrope']">
                      <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      {t('pausa.staff', 'Staff')}
                    </label>
                    <Select onValueChange={(value) => form.setValue('team_id', value)} value={form.getValues('team_id')}>
                      <SelectTrigger className="h-12 border-gray-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 font-['Manrope']">
                        <SelectValue placeholder={t('pausa.select_staff', 'Seleziona staff')} />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-2 font-['Manrope']">
                      <ClockIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      {t('pausa.start_time', 'Ora Inizio')}
                    </label>
                    <Select onValueChange={(value) => form.setValue('orarioInizio', value)} value={form.getValues('orarioInizio')}>
                      <SelectTrigger className="h-12 border-gray-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 font-['Manrope']">
                        <SelectValue placeholder={t('pausa.select_start_time', 'Seleziona orario inizio')} />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        {(() => {
                          const options: string[] = [];
                          let minutes = 0;
                          while (minutes <= 23 * 60 + 55) {
                            const hour = Math.floor(minutes / 60);
                            const min = minutes % 60;
                            options.push(
                              `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
                            );
                            minutes += 5;
                          }
                          return options.map(opt => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-2 font-['Manrope']">
                      <ClockIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      {t('pausa.end_time', 'Ora Fine')}
                    </label>
                    <Select onValueChange={(value) => form.setValue('orarioFine', value)} value={form.getValues('orarioFine')}>
                      <SelectTrigger className="h-12 border-gray-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 font-['Manrope']">
                        <SelectValue placeholder={t('pausa.select_end_time', 'Seleziona orario fine')} />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        {(() => {
                          const startValue = form.getValues('orarioInizio');
                          const options: string[] = [];
                          const [h, m] = startValue.split(":").map(Number);
                          if (!isNaN(h) && !isNaN(m)) {
                            let minutes = h * 60 + m + 5;
                            while (minutes <= 23 * 60 + 55) {
                              const hour = Math.floor(minutes / 60);
                              const min = minutes % 60;
                              options.push(
                                `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
                              );
                              minutes += 5;
                            }
                          }
                          return options.map(opt => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {timeWarning && (
                  <div className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 font-['Manrope']">
                    <AlertCircle className="h-3 w-3" />
                    {timeWarning}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-2 font-['Manrope']">
                    <span className="text-gray-600 dark:text-slate-400">📝</span>
                    {t('pausa.notes', 'Note')}
                  </label>
                  <textarea
                    {...form.register('descrizione')}
                    placeholder={t('pausa.notes_placeholder', 'Aggiungi note per questa pausa...')}
                    rows={3}
                    className="border-gray-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2 resize-none w-full rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 font-['Manrope']"
                  />
                </div>
              </form>
            </Form>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 pb-6 px-6 border-t border-gray-200 dark:border-slate-700/50 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="h-11 px-6 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 font-['Manrope']"
          >
            {t('pausa.cancel', 'Annulla')}
          </Button>
          <Button 
            type="submit" 
            onClick={form.handleSubmit(handleSubmit)}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium font-['Manrope']"
          >
            {t('pausa.create_break', 'Crea Pausa')}
          </Button>
        </div>
      </div>
    </div>
  );

  // Use Portal to render the modal outside of the calendar container
  if (!open) return null;
  
  return createPortal(modalContent, document.body);
}

export default React.memo(CreatePausaForm);
