import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, Settings, FileText, Lock, Building, Globe, CalendarCheck, AlertCircle, Mail, MessageSquare, Type, CalendarPlus, HelpCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import Appuntamenti from "./_component/Appuntamenti";
import GestioneMembri from "./_component/GestioneMembri";
import GestioneStati from "./_component/GestioneStati";
import GestioneTasse from "./_component/GestioneTasse";
import Permessi from "./_component/Permessi";
import PaginaWeb from "./_component/(paginweb)/PaginaWeb";
import PrenotazioniOnline from "./_component/PrenotazioniOnline";

import SettingsStats from "./_component/SettingsStats";
import SettingsBreadcrumb from "./_component/SettingsBreadcrumb";
import { ScrollArea } from "@/components/ui/scroll-area";
import GestionGruppi from "./_component/GestionGruppi";
import EmailSettings from "./_component/email";
import TestiUnificatiManager from "./_component/testi-unificati";
import { AppointmentModalSettings } from "./_component/AppointmentModalSettings";
import SupportTickets from "./_component/SupportTickets";
import { createClient } from "@/utils/supabase/client";

// Interface for TeamMember
interface TeamMember {
  id: string;
  name: string;
  avatar_url?: string;
}

const supabase = createClient();

interface ImpostazioniAvanzateProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const ImpostazioniAvanzate: React.FC<ImpostazioniAvanzateProps> = ({ 
  activeTab: externalActiveTab, 
  onTabChange 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [internalActiveTab, setInternalActiveTab] = useState(() => {
    // Inizializza activeTab dal localStorage se disponibile, altrimenti usa "appuntamenti"
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('impostazioniActiveTab');
      return savedTab || "appuntamenti";
    }
    return "appuntamenti";
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Use external activeTab if provided, otherwise use internal state
  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = onTabChange || setInternalActiveTab;

  useEffect(() => {
    // Simulate loading time or replace with actual data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Reduced loading time for better UX

    // Fetch team members when component mounts
    fetchTeamMembers();

    return () => clearTimeout(timer);
  }, []);

  // Function to fetch team members for the Gruppi component
  const fetchTeamMembers = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;

      if (userError || !user) {
        console.error("User error:", userError?.message || "User not authenticated");
        return;
      }

      // Get salon ID associated with the user
      const { data: salonData, error: salonError } = await supabase
        .from("salon")
        .select("id")
        .eq("user_id", user.id)
        .single();

      let currentSalonId = null;

      if (salonData) {
        currentSalonId = salonData.id;
      } else {
        // Check if user is a collaborator and has a salon_id in profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('salon_id')
          .eq('id', user.id)
          .single();
          
        if (!profileError && profileData?.salon_id) {
          currentSalonId = profileData.salon_id;
        }
      }

      if (!currentSalonId) {
        return;
      }

      // Fetch team members associated with this salon_id
      const { data, error } = await supabase
        .from("team")
        .select("id, name, avatar_url")
        .eq("salon_id", currentSalonId)
        .order("order_column", { ascending: true });

      if (error) {
        console.error("Team fetch error:", error);
        return;
      }

      if (data && Array.isArray(data)) {
        setTeamMembers(data);
      }
    } catch (err) {
      console.error("Unexpected error in fetchTeamMembers:", err);
    }
  };

  // Salva la tab attiva nelle impostazioni avanzate per persistenza dopo refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('impostazioniActiveTab', activeTab);
    }
  }, [activeTab]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce"></div>
        </div>
        <p className="mt-4 text-sm text-gray-500">Caricamento impostazioni avanzate...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gradient-to-br from-white to-violet-50/30">
      {/* Header Section */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm border-b border-violet-100 flex-none rounded-none">
        <CardContent className="!p-0 px-3 py-1">
          <SettingsBreadcrumb activeTab={activeTab} />
        </CardContent>
      </Card>

      {/* Content Section */}
      <Card className="flex-1 border-0 bg-transparent rounded-none min-h-0">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full w-full">
            <div className="p-2 md:p-3 space-y-3">
              {/* Contenuto tabs */}
              {activeTab === "appuntamenti" && (
                <>
                  <SettingsStats activeTab="appuntamenti" />
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                      <CardTitle className="flex items-center gap-2 text-xl text-violet-900">
                        <CalendarDays className="h-5 w-5 text-violet-600" />
                        Gestione Appuntamenti e Calendario
                      </CardTitle>
                      <CardDescription className="text-violet-600">
                        Configura gli orari di lavoro, le visualizzazioni del calendario e le impostazioni degli appuntamenti
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Appuntamenti />
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === "membri" && (
                <>
                  <SettingsStats activeTab="membri" />
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-violet-100">
                      <CardTitle className="flex items-center gap-2 text-xl text-blue-900">
                        <Users className="h-5 w-5 text-blue-600" />
                        Gestione Team e Collaboratori
                      </CardTitle>
                      <CardDescription className="text-blue-600">
                        Aggiungi, modifica e organizza i membri del tuo team e gestisci i permessi
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <GestioneMembri />
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === "permessi" && (
                <>
                  <SettingsStats activeTab="permessi" />
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-violet-100">
                      <CardTitle className="flex items-center gap-2 text-xl text-indigo-900">
                        <Lock className="h-5 w-5 text-indigo-600" />
                        Gestione Permessi e Autorizzazioni
                      </CardTitle>
                      <CardDescription className="text-indigo-600">
                        Gestisci i permessi dei membri del team e le autorizzazioni per l'accesso alle funzionalità
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Permessi />
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === "stati" && (
                <>
                  <SettingsStats activeTab="stati" />
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-violet-100">
                      <CardTitle className="flex items-center gap-2 text-xl text-green-900">
                        <Settings className="h-5 w-5 text-green-600" />
                        Gestione Stati e Configurazioni
                      </CardTitle>
                      <CardDescription className="text-green-600">
                        Personalizza gli stati degli appuntamenti, le etichette e le configurazioni del sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <GestioneStati />
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === "tasse" && (
                <>
                  <SettingsStats activeTab="tasse" />
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-violet-100">
                      <CardTitle className="flex items-center gap-2 text-xl text-amber-900">
                        <Building className="h-5 w-5 text-amber-600" />
                        Gestione Fiscale e Tasse
                      </CardTitle>
                      <CardDescription className="text-amber-600">
                        Configura i dati aziendali, le impostazioni IVA e le informazioni fiscali
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <GestioneTasse />
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === "sicurezza" && (
                <>
                  <SettingsStats activeTab="sicurezza" />
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-violet-100">
                      <CardTitle className="flex items-center gap-2 text-xl text-red-900">
                        <Lock className="h-5 w-5 text-red-600" />
                        Sicurezza e Profilo
                      </CardTitle>
                      <CardDescription className="text-red-600">
                        Gestisci il profilo, la password e le impostazioni di sicurezza del tuo account
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                      <div className="text-gray-500 text-sm">
                        Le impostazioni del profilo e della password sono ora disponibili nella pagina <b>Profilo</b>.
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === "gruppi" && (
                <>
                  <SettingsStats activeTab="gruppi" />
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-violet-100">
                      <CardTitle className="flex items-center gap-2 text-xl text-purple-900">
                        <Users className="h-5 w-5 text-purple-600" />
                        Gestione Gruppi di Lavoro
                      </CardTitle>
                      <CardDescription className="text-purple-600">
                        Visualizza, crea e gestisci i gruppi di lavoro del tuo team
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <GestionGruppi teamMembers={teamMembers} />
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === "paginaweb" && (
                <>
                  <SettingsStats activeTab="paginaweb" />
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-0">
                      <PaginaWeb />
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === "prenotazioni-online" && (
                <PrenotazioniOnline />
              )}

              {activeTab === "email" && (
                <>
                  <SettingsStats activeTab="email" />
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-0">
                      <EmailSettings />
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === "testi-unificati" && (
                <>
                  <SettingsStats activeTab="testi-unificati" />
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                      <CardTitle className="flex items-center gap-2 text-xl text-blue-900">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Gestione Testi e Template
                      </CardTitle>
                      <CardDescription className="text-blue-600">
                        Personalizza template email e variabili per i tuoi messaggi
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <TestiUnificatiManager />
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === "modal-appuntamento" && (
                <>
                  <SettingsStats activeTab="modal-appuntamento" />
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                      <CardTitle className="flex items-center gap-2 text-xl text-green-900">
                        <CalendarPlus className="h-5 w-5 text-green-600" />
                        Personalizzazione Modal Appuntamento
                      </CardTitle>
                      <CardDescription className="text-green-600">
                        Personalizza testi, funzionalità e layout del modal di nuovo appuntamento
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <AppointmentModalSettings />
                    </CardContent>
                  </Card>
                </>
              )}

              {activeTab === "supporto" && (
                <>
                  <SettingsStats activeTab="supporto" />
                  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                      <CardTitle className="flex items-center gap-2 text-xl text-indigo-900">
                        <HelpCircle className="h-5 w-5 text-indigo-600" />
                        Supporto Tecnico
                      </CardTitle>
                      <CardDescription className="text-indigo-600">
                        Crea e gestisci i tuoi ticket di supporto. Il nostro team ti aiuterà a risolvere qualsiasi problema
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <SupportTickets />
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImpostazioniAvanzate;
