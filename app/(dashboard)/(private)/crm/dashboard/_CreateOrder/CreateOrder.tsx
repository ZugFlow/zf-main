"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import CreateOrderForm from "./form";
import { fetchCreateOrderData } from "../query/query";
import { Calendar, User, ShoppingBag } from "@carbon/icons-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocalization } from "@/hooks/useLocalization";
import { useAppointmentModalSettings } from "@/hooks/useAppointmentModalSettings";
import "@fontsource/inter";

const supabase = createClient();

type Client = {
  id: string;
  nome: string;
  customer_uuid: string;
  telefono: string;
  email: string;
};

export function CreateOrder({
  isDialogOpen,
  setIsDialogOpen,
  actionType = 'appointment',
  initialFormData,
  onAppointmentCreated
}: {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  actionType?: string;
  initialFormData?: {
    data: string;
    orarioInizio: string;
    orarioFine: string;
    team_id?: string;
  } | null;
  onAppointmentCreated?: () => void;
}) {
  const { t } = useLocalization();
  const { settings, loading: settingsLoading, getSetting } = useAppointmentModalSettings();
  const [statuses, setStatuses] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isDialogOpen) return;
    
    console.log('🎯 [CreateOrder] Dialog opened, fetching data...');
    
    let isMounted = true;
    const fetchData = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user?.id) {
          throw new Error(t('createorder.user_not_authenticated', 'Utente non autenticato.'));
        }

        let salonId = null;
        const { data: profileData } = await supabase
          .from("profiles")
          .select("salon_id")
          .eq("id", session.user.id)
          .single();

        if (profileData?.salon_id) {
          salonId = profileData.salon_id;
        } else {
          const { data: teamData } = await supabase
            .from("team")
            .select("salon_id")
            .eq("user_id", session.user.id)
            .single();

          if (teamData?.salon_id) {
            salonId = teamData.salon_id;
          }
        }

        if (!salonId) throw new Error(t('createorder.cannot_determine_salon', 'Impossibile determinare il salone associato.'));

        const data = await fetchCreateOrderData(salonId);
        if (!isMounted) return;

        console.log('DEBUG: fetchCreateOrderData result:', data);

        setStatuses(data.statuses);
        setTeamMembers(data.teamMembers);
        setAppointments(data.appointments);
        setServices(data.services);
        console.log('DEBUG: Services set:', data.services);
        // Debug: log raw clients data
        console.log('DEBUG: data.clients', data.clients);
        // Ensure all clients have required fields, fallback to empty string if missing
        try {
          setClients(
            (data.clients || []).map((c: any) => ({
              id: c && c.id !== undefined ? String(c.id) : '',
              nome: c && c.nome ? c.nome : '',
              customer_uuid: c && c.customer_uuid ? c.customer_uuid : (c && c.id ? String(c.id) : ''),
              telefono: c && c.telefono ? c.telefono : '',
              email: c && c.email ? c.email : ''
            }))
          );
        } catch (err) {
          setClients([]);
          setErrorMessage(t('createorder.error_loading', 'Errore nel caricamento dei dati') + ': ' + (err instanceof Error ? err.message : String(err)));
        }
        // Debug avanzato: mostra info su salonId, query e dati grezzi
        if (!data.clients || data.clients.length === 0) {
          setErrorMessage('no_clients');
        } else if (!data.teamMembers || data.teamMembers.length === 0) {
          setErrorMessage('no_team');
        } else if (!data.services || data.services.filter((s: any) => s.salon_id === salonId).length === 0) {
          setErrorMessage('no_services');
        } else {
          setErrorMessage(null);
        }
      } catch (error) {
        setErrorMessage(t('createorder.error_during_loading', 'Errore durante il caricamento.') + ' ' + (error instanceof Error ? error.message : ""));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [isDialogOpen, t]);

  const getDialogTitle = () => {
    // Usa le impostazioni personalizzate se disponibili
    if (actionType === "appointment" && settings?.modal_title) {
      return settings.modal_title;
    }
    
    switch (actionType) {
      case "client":
        return t('createorder.new_client', 'Nuovo Cliente');
      case "sale":
        return t('createorder.new_sale', 'Nuova Vendita');
      case "appointment":
      default:
        return t('createorder.new_appointment', 'Nuovo Appuntamento');
    }
  };

  const getDialogIcon = () => {
    switch (actionType) {
      case "client":
        return <User size={20} className="text-blue-600" />;
      case "sale":
        return <ShoppingBag size={20} className="text-blue-600" />;
      case "appointment":
      default:
        return <Calendar size={20} className="text-blue-600" />;
    }
  };

  const getDialogDescription = () => {
    // Usa le impostazioni personalizzate se disponibili
    if (actionType === "appointment" && settings?.modal_subtitle) {
      return settings.modal_subtitle;
    }
    
    switch (actionType) {
      case "client":
        return t('createorder.add_new_client', 'Aggiungi un nuovo cliente al sistema');
      case "sale":
        return t('createorder.register_new_sale', 'Registra una nuova vendita');
      case "appointment":
      default:
        return t('createorder.create_new_appointment', 'Crea un nuovo appuntamento per un cliente');
    }
  };

  if (!isDialogOpen) return null;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-3xl bg-white shadow-lg rounded-xl max-h-[90vh] flex flex-col mx-auto">
        <DialogHeader className="pb-6 border-b border-gray-200 flex-shrink-0">
          <div className="text-2xl font-semibold text-gray-900 flex items-center gap-3 px-2 pt-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {getDialogIcon()}
            </div>
            {getDialogTitle()}
          </div>
          <p className="text-sm text-gray-500 px-2 pb-2">{getDialogDescription()}</p>
        </DialogHeader>
        
        <div className="px-2 pb-6 overflow-y-auto flex-1">
          {loading || settingsLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500 mt-4">{t('createorder.loading', 'Caricamento...')}</p>
            </div>
          ) : errorMessage === 'no_clients' ? (
            <div className="flex flex-col items-center justify-center py-16">
            <User size={48} className="text-blue-400 mb-3" />
              <div className="text-xl font-semibold text-gray-700 mb-1">{t('createorder.no_clients_found', 'Nessun cliente trovato')}</div>
              <div className="text-base text-gray-500">{t('createorder.add_client_message', 'Aggiungi un cliente per poter creare un nuovo appuntamento o vendita.')}</div>
            </div>
          ) : errorMessage === 'no_team' ? (
            <div className="flex flex-col items-center justify-center py-16">
              <User size={48} className="text-blue-400 mb-3" />
              <div className="text-xl font-semibold text-gray-700 mb-1">{t('createorder.no_team_found', 'Nessun membro del team trovato')}</div>
              <div className="text-base text-gray-500">{t('createorder.add_team_message', 'Aggiungi membri del team per poter gestire appuntamenti o vendite.')}</div>
            </div>
          ) : errorMessage === 'no_services' ? (
            <div className="flex flex-col items-center justify-center py-16">
            <ShoppingBag size={48} className="text-blue-400 mb-3" />
              <div className="text-xl font-semibold text-gray-700 mb-1">{t('createorder.no_services_found', 'Nessun servizio attivo trovato')}</div>
              <div className="text-base text-gray-500">{t('createorder.add_services_message', 'Aggiungi servizi per poterli selezionare durante la creazione di appuntamenti o vendite.')}</div>
            </div>
          ) : errorMessage ? (
            <div className="text-center text-red-500 text-sm mt-10">{errorMessage}</div>
          ) : (
            <CreateOrderForm
              statuses={statuses}
              teamMembers={teamMembers}
              setIsDialogOpen={setIsDialogOpen}
              initialFormData={initialFormData}
              appointments={appointments}
              services={services}
              clients={clients}
              initialFormType={actionType}
              onAppointmentCreated={onAppointmentCreated}
              modalSettings={settings}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
