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

export function CreateOrderWithSettings({
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
  const { 
    settings, 
    loading: settingsLoading, 
    getModalSize, 
    getSetting 
  } = useAppointmentModalSettings();
  
  const [statuses, setStatuses] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isDialogOpen) return;
    
    console.log('🎯 [CreateOrderWithSettings] Dialog opened, fetching data...');
    
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
        setClients(data.clients || []);
        setLoading(false);
      } catch (error) {
        console.error('❌ [CreateOrderWithSettings] Error fetching data:', error);
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Errore sconosciuto');
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [isDialogOpen, t]);

  const handleClose = () => {
    setIsDialogOpen(false);
  };

  // Utilizza le impostazioni personalizzate
  const modalSize = getModalSize();
  const modalTitle = getSetting('modal_title') || 'Nuovo Appuntamento';
  const modalSubtitle = getSetting('modal_subtitle') || '';

  if (settingsLoading) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`max-w-${modalSize.width} max-h-${modalSize.height}`}>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Caricamento impostazioni...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className={`max-w-${modalSize.width} max-h-${modalSize.height}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {modalTitle}
          </DialogTitle>
          {modalSubtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {modalSubtitle}
            </p>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Caricamento dati...</span>
          </div>
        ) : errorMessage ? (
          <div className="p-4 text-center">
            <p className="text-red-500">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Riprova
            </button>
          </div>
        ) : (
          <CreateOrderForm
            teamMembers={teamMembers}
            setIsDialogOpen={setIsDialogOpen}
            initialFormData={initialFormData}
            statuses={statuses}
            appointments={appointments}
            services={services}
            clients={clients}
            initialFormType={actionType}
            onAppointmentCreated={onAppointmentCreated}
            // Passa le impostazioni personalizzate al form
            modalSettings={settings}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
