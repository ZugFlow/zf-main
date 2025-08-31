import { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";
import { getSalonId } from "@/utils/getSalonId";

export interface AppointmentModalSettings {
  id: string;
  salon_id: string;
  modal_title: string;
  modal_subtitle: string;
  client_section_title: string;
  service_section_title: string;
  time_section_title: string;
  notes_section_title: string;
  price_section_title: string;
  client_name_label: string;
  client_phone_label: string;
  client_email_label: string;
  service_label: string;
  date_label: string;
  start_time_label: string;
  end_time_label: string;
  team_member_label: string;
  notes_label: string;
  price_label: string;
  status_label: string;
  client_name_placeholder: string;
  client_phone_placeholder: string;
  client_email_placeholder: string;
  notes_placeholder: string;
  price_placeholder: string;
  save_button_text: string;
  cancel_button_text: string;
  add_service_button_text: string;
  remove_service_button_text: string;
  search_client_button_text: string;
  new_client_button_text: string;
  required_field_message: string;
  invalid_email_message: string;
  invalid_phone_message: string;
  invalid_time_message: string;
  end_time_before_start_message: string;
  enable_client_search: boolean;
  enable_new_client_creation: boolean;
  enable_service_selection: boolean;
  enable_multiple_services: boolean;
  enable_price_editing: boolean;
  enable_notes: boolean;
  enable_status_selection: boolean;
  enable_team_selection: boolean;
  enable_notifications: boolean;
  enable_color_selection: boolean;
  enable_card_style_selection: boolean;
  require_client_name: boolean;
  require_client_phone: boolean;
  require_client_email: boolean;
  require_service_selection: boolean;
  require_team_selection: boolean;
  require_price: boolean;
  show_client_section: boolean;
  show_service_section: boolean;
  show_time_section: boolean;
  show_notes_section: boolean;
  show_price_section: boolean;
  show_status_section: boolean;
  show_team_section: boolean;
  show_notifications_section: boolean;
  show_color_section: boolean;
  show_card_style_section: boolean;
  modal_width: string;
  modal_height: string;
  form_layout: string;
  sections_order: string[];
  auto_calculate_price: boolean;
  auto_suggest_end_time: boolean;
  default_duration_minutes: number;
  max_services_per_appointment: number;
  allow_overlapping_appointments: boolean;
  show_confirmation_dialog: boolean;
  primary_color: string;
  secondary_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;
}

const defaultSettings: Partial<AppointmentModalSettings> = {
  modal_title: 'Nuovo Appuntamento',
  modal_subtitle: '',
  client_section_title: 'Cliente',
  service_section_title: 'Servizi',
  time_section_title: 'Data e Orario',
  notes_section_title: 'Note',
  price_section_title: 'Prezzo',
  client_name_label: 'Nome Cliente',
  client_phone_label: 'Telefono',
  client_email_label: 'Email',
  service_label: 'Servizio',
  date_label: 'Data',
  start_time_label: 'Orario Inizio',
  end_time_label: 'Orario Fine',
  team_member_label: 'Membro del Team',
  notes_label: 'Note',
  price_label: 'Prezzo',
  status_label: 'Stato',
  client_name_placeholder: 'Inserisci il nome del cliente',
  client_phone_placeholder: 'Inserisci il telefono',
  client_email_placeholder: 'Inserisci l\'email',
  notes_placeholder: 'Inserisci eventuali note',
  price_placeholder: '0.00',
  save_button_text: 'Salva Appuntamento',
  cancel_button_text: 'Annulla',
  add_service_button_text: 'Aggiungi Servizio',
  remove_service_button_text: 'Rimuovi',
  search_client_button_text: 'Cerca Cliente',
  new_client_button_text: 'Nuovo Cliente',
  required_field_message: 'Campo obbligatorio',
  invalid_email_message: 'Email non valida',
  invalid_phone_message: 'Telefono non valido',
  invalid_time_message: 'Orario non valido',
  end_time_before_start_message: 'L\'orario di fine deve essere successivo all\'orario di inizio',
  enable_client_search: true,
  enable_new_client_creation: true,
  enable_service_selection: true,
  enable_multiple_services: true,
  enable_price_editing: true,
  enable_notes: true,
  enable_status_selection: true,
  enable_team_selection: true,
  enable_notifications: true,
  enable_color_selection: true,
  enable_card_style_selection: true,
  require_client_name: true,
  require_client_phone: false,
  require_client_email: false,
  require_service_selection: true,
  require_team_selection: true,
  require_price: false,
  show_client_section: true,
  show_service_section: true,
  show_time_section: true,
  show_notes_section: true,
  show_price_section: true,
  show_status_section: true,
  show_team_section: true,
  show_notifications_section: true,
  show_color_section: true,
  show_card_style_section: true,
  modal_width: 'lg',
  modal_height: 'auto',
  form_layout: 'vertical',
  sections_order: ['client', 'service', 'time', 'team', 'price', 'status', 'notes', 'notifications', 'color', 'card_style'],
  auto_calculate_price: true,
  auto_suggest_end_time: true,
  default_duration_minutes: 60,
  max_services_per_appointment: 10,
  allow_overlapping_appointments: false,
  show_confirmation_dialog: true,
  primary_color: '#6366f1',
  secondary_color: '#8b5cf6',
  success_color: '#10b981',
  warning_color: '#f59e0b',
  error_color: '#ef4444',
};

export function useAppointmentModalSettings() {
  const [settings, setSettings] = useState<AppointmentModalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentSalonId = await getSalonId();
      if (!currentSalonId) {
        throw new Error('Impossibile determinare il salone');
      }

      setSalonId(currentSalonId);

      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('appointment_modal_settings')
        .select('*')
        .eq('salon_id', currentSalonId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setSettings(data);
      } else {
        // Crea le impostazioni di default se non esistono
        const { data: newSettings, error: createError } = await supabase
          .from('appointment_modal_settings')
          .insert([{ salon_id: currentSalonId, ...defaultSettings }])
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings);
      }
    } catch (err) {
      console.error('Errore nel caricamento delle impostazioni del modal:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      // Fallback alle impostazioni di default
      setSettings({ id: '', salon_id: '', ...defaultSettings } as AppointmentModalSettings);
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscription per aggiornamenti delle impostazioni
  useEffect(() => {
    if (!salonId) return;

    const supabase = createClient();
    
    // Sottoscrizione ai cambiamenti della tabella appointment_modal_settings
    const subscription = supabase
      .channel('appointment_modal_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointment_modal_settings',
          filter: `salon_id=eq.${salonId}`
        },
        (payload) => {
          console.log('🔄 [useAppointmentModalSettings] Settings updated:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setSettings(payload.new as AppointmentModalSettings);
          } else if (payload.eventType === 'DELETE') {
            // Se le impostazioni vengono eliminate, ricarica quelle di default
            loadSettings();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [salonId]);

  // Carica le impostazioni all'inizializzazione
  useEffect(() => {
    loadSettings();
  }, []);

  const getSetting = (key: keyof AppointmentModalSettings) => {
    if (!settings) return null;
    return settings[key];
  };

  const isFeatureEnabled = (feature: keyof AppointmentModalSettings): boolean => {
    if (!settings) return false;
    const value = settings[feature];
    return typeof value === 'boolean' ? value : false;
  };

  const isSectionVisible = (section: keyof AppointmentModalSettings): boolean => {
    if (!settings) return true; // Default visible
    const value = settings[section];
    return typeof value === 'boolean' ? value : true;
  };

  const isFieldRequired = (field: keyof AppointmentModalSettings): boolean => {
    if (!settings) return false;
    const value = settings[field];
    return typeof value === 'boolean' ? value : false;
  };

  const getValidationMessage = (type: string): string => {
    if (!settings) return '';
    
    const messageMap: Record<string, string> = {
      required: settings.required_field_message,
      email: settings.invalid_email_message,
      phone: settings.invalid_phone_message,
      time: settings.invalid_time_message,
      endTimeBeforeStart: settings.end_time_before_start_message,
    };

    return messageMap[type] || '';
  };

  const getModalSize = () => {
    if (!settings) return { width: 'lg', height: 'auto' };
    return {
      width: settings.modal_width,
      height: settings.modal_height
    };
  };

  const getFormLayout = () => {
    if (!settings) return 'vertical';
    return settings.form_layout;
  };

  const getSectionsOrder = () => {
    if (!settings) return ['client', 'service', 'time', 'team', 'price', 'status', 'notes', 'notifications', 'color', 'card_style'];
    return settings.sections_order;
  };

  const getColors = () => {
    if (!settings) {
      return {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      };
    }
    return {
      primary: settings.primary_color,
      secondary: settings.secondary_color,
      success: settings.success_color,
      warning: settings.warning_color,
      error: settings.error_color
    };
  };

  const getAdvancedSettings = () => {
    if (!settings) {
      return {
        autoCalculatePrice: true,
        autoSuggestEndTime: true,
        defaultDurationMinutes: 60,
        maxServicesPerAppointment: 10,
        allowOverlappingAppointments: false,
        showConfirmationDialog: true
      };
    }
    return {
      autoCalculatePrice: settings.auto_calculate_price,
      autoSuggestEndTime: settings.auto_suggest_end_time,
      defaultDurationMinutes: settings.default_duration_minutes,
      maxServicesPerAppointment: settings.max_services_per_appointment,
      allowOverlappingAppointments: settings.allow_overlapping_appointments,
      showConfirmationDialog: settings.show_confirmation_dialog
    };
  };

  return {
    settings,
    loading,
    error,
    loadSettings,
    getSetting,
    isFeatureEnabled,
    isSectionVisible,
    isFieldRequired,
    getValidationMessage,
    getModalSize,
    getFormLayout,
    getSectionsOrder,
    getColors,
    getAdvancedSettings
  };
}
