import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FotoProfilo from "../Impostazioni/_component/FotoProfilo";
import ChangePassword from "../Impostazioni/_component/change-password";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Lock, Settings, Bell, Shield, Globe, Trash2 } from "lucide-react";
import { saveTimeFormat } from "@/app/(dashboard)/(private)/crm/dashboard/query/query";
import { useLocalization } from "@/hooks/useLocalization";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Profilo() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("informazioni");
  const [selectedFormat, setSelectedFormat] = useState("24");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { t, currentLanguage } = useLocalization();
  const router = useRouter();

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleTimeFormatChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFormat = event.target.value;
    setSelectedFormat(newFormat);
  };

  const handleSaveTimeFormat = async () => {
    setIsSaving(true);
    const result = await saveTimeFormat(selectedFormat);
    setIsSaving(false);

    if (!result.success) {
      console.error("Failed to save time format:", result.error);
      alert(t('profile.time_format_error', 'Errore durante il salvataggio del formato orario.'));
    } else {
      console.log("Time format saved successfully!");
      alert(t('profile.time_format_success', 'Formato orario salvato con successo!'));
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      const supabase = createClient();
      
      // Verifica la sessione corrente
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sessione non valida');
      }

      console.log('🔍 Frontend - Session check:', { 
        hasSession: !!session, 
        hasUser: !!session?.user, 
        userId: session?.user?.id 
      });

      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore durante l\'eliminazione dell\'account');
      }

      // Successo - reindirizza alla pagina di login
      alert(t('profile.delete_success', 'Account eliminato con successo. Verrai reindirizzato alla pagina di login.'));
      router.push('/login');
      
    } catch (error) {
      console.error('Errore eliminazione account:', error);
      alert(t('profile.delete_error', 'Errore durante l\'eliminazione dell\'account. Riprova più tardi.'));
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce"></div>
        </div>
        <p className="mt-4 text-sm text-gray-500">{t('message.loading', 'Caricamento profilo...')}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-white to-violet-50/30 overflow-auto">
      {/* Header Section */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm border-b border-violet-100 flex-none rounded-none">
        <CardContent className="px-3 py-2">
          <div className="mt-2">
            <CardTitle className="text-xl font-bold text-violet-900 mb-1">
              {t('nav.profile', 'Profilo Utente')}
            </CardTitle>
            <CardDescription className="text-sm text-violet-600">
              {t('profile.description', 'Gestisci le informazioni del tuo profilo e la sicurezza dell\'account')}
            </CardDescription>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Card className="flex-1 flex flex-col border-0 bg-transparent rounded-none overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm border-b border-violet-100 flex-none rounded-none">
            <CardContent className="px-3 py-2">
              <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:inline-flex bg-violet-50 border border-violet-200 rounded-lg p-1">
                <TabsTrigger 
                  value="informazioni" 
                  className="flex items-center gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('profile.tabs.info', 'Informazioni')}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="sicurezza" 
                  className="flex items-center gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                >
                  <Lock className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('profile.tabs.security', 'Sicurezza')}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="preferenze" 
                  className="flex items-center gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('profile.tabs.preferences', 'Preferenze')}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="notifiche" 
                  className="flex items-center gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                >
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('profile.tabs.notifications', 'Notifiche')}</span>
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          {/* Tab Contents */}
          <Card className="flex-1 border-0 bg-transparent rounded-none">
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-260px)] w-full">
                <div className="p-3 space-y-3">
                  {/* Contenuto tabs */}
                  <TabsContent value="informazioni" className="mt-0">
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                        <CardTitle className="flex items-center gap-2 text-xl text-violet-900">
                          <User className="h-5 w-5 text-violet-600" />
                          {t('profile.personal_info', 'Informazioni Personali')}
                        </CardTitle>
                        <CardDescription className="text-violet-600">
                          {t('profile.personal_info_desc', 'Modifica le tue informazioni personali e la foto del profilo')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <FotoProfilo />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="sicurezza" className="mt-0">
                    <div className="space-y-6">
                      {/* Cambio Password */}
                      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                        <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-violet-100">
                          <CardTitle className="flex items-center gap-2 text-xl text-red-900">
                            <Lock className="h-5 w-5 text-red-600" />
                            {t('profile.account_security', 'Sicurezza Account')}
                          </CardTitle>
                          <CardDescription className="text-red-600">
                            {t('profile.account_security_desc', 'Gestisci la password e le impostazioni di sicurezza del tuo account')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                          <ChangePassword />
                        </CardContent>
                      </Card>

                      {/* Elimina Account */}
                      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm border-red-200">
                        <CardHeader className="bg-gradient-to-r from-red-100 to-red-50 border-b border-red-200">
                          <CardTitle className="flex items-center gap-2 text-xl text-red-900">
                            <Trash2 className="h-5 w-5 text-red-700" />
                            {t('profile.delete_account', 'Elimina Account')}
                          </CardTitle>
                          <CardDescription className="text-red-700">
                            {t('profile.delete_account_desc', 'Elimina permanentemente il tuo account e tutti i dati associati. Questa azione non può essere annullata.')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                              <Shield className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-red-800">
                                <p className="font-semibold mb-2">
                                  {t('profile.delete_warning_title', 'Attenzione: Azione irreversibile')}
                                </p>
                                <ul className="list-disc list-inside space-y-1">
                                  <li>{t('profile.delete_warning_1', 'Tutti i tuoi dati personali verranno eliminati')}</li>
                                  <li>{t('profile.delete_warning_2', 'Tutti gli appuntamenti e prenotazioni verranno rimossi')}</li>
                                  <li>{t('profile.delete_warning_3', 'Le impostazioni del salon verranno cancellate')}</li>
                                  <li>{t('profile.delete_warning_4', 'I servizi e le fatture verranno eliminati')}</li>
                                  <li>{t('profile.delete_warning_5', 'Questa operazione non può essere annullata')}</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('profile.delete_account_button', 'Elimina Definitivamente il Mio Account')}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-red-900">
                                  <Trash2 className="h-5 w-5 text-red-600" />
                                  {t('profile.confirm_delete_title', 'Conferma Eliminazione Account')}
                                </DialogTitle>
                                <DialogDescription className="text-gray-600">
                                  {t('profile.confirm_delete_desc', 'Sei sicuro di voler eliminare definitivamente il tuo account? Tutti i dati verranno persi e non potranno essere recuperati.')}
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="gap-2 sm:gap-0">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setIsDeleteDialogOpen(false)}
                                  disabled={isDeleting}
                                >
                                  {t('action.cancel', 'Annulla')}
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  onClick={handleDeleteAccount}
                                  disabled={isDeleting}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {isDeleting ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                      {t('action.deleting', 'Eliminando...')}
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      {t('action.delete_confirm', 'Si, Elimina')}
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="preferenze" className="mt-0">
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm max-w-2xl mx-auto">
                      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-violet-100">
                        <CardTitle className="flex items-center gap-2 text-xl text-green-900">
                          <Settings className="h-5 w-5 text-green-600" />
                          {t('profile.app_preferences', 'Preferenze Applicazione')}
                        </CardTitle>
                        <CardDescription className="text-green-600">
                          {t('profile.app_preferences_desc', 'Personalizza l\'interfaccia e il comportamento dell\'applicazione')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 space-y-6">
                        {/* Lingua */}
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-900 text-center flex items-center justify-center gap-2">
                            <Globe className="h-5 w-5 text-violet-600" />
                            {t('profile.language', 'Lingua')}
                          </h3>
                          <div className="flex justify-center">
                            <LanguageSwitcher />
                          </div>
                          <p className="text-sm text-gray-500 text-center">
                            {t('profile.language_desc', 'Scegli la lingua dell\'interfaccia')}
                          </p>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          {/* Formato orario */}
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900 text-center">{t('profile.time_format', 'Formato Orario')}</h3>
                            <select
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                              value={selectedFormat}
                              onChange={(e) => setSelectedFormat(e.target.value)}
                            >
                              <option value="24">{t('profile.time_24h', '24 Ore (00-24)')}</option>
                              <option value="12">{t('profile.time_12h', '12 Ore (AM/PM)')}</option>
                            </select>
                            <button
                              className="mt-2 w-full p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                              onClick={handleSaveTimeFormat}
                              disabled={isSaving}
                            >
                              {isSaving ? t('action.saving', 'Salvando...') : t('action.save', 'Salva')}
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="notifiche" className="mt-0">
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-violet-100">
                        <CardTitle className="flex items-center gap-2 text-xl text-blue-900">
                          <Bell className="h-5 w-5 text-blue-600" />
                          {t('profile.notifications', 'Impostazioni Notifiche')}
                        </CardTitle>
                        <CardDescription className="text-blue-600">
                          {t('profile.notifications_desc', 'Configura come e quando ricevere le notifiche dell\'applicazione')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {/* Notifiche Email */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900">{t('profile.email_notifications', 'Notifiche Email')}</h3>
                          <div className="space-y-3">
                            <label className="flex items-center space-x-3">
                              <input type="checkbox" className="w-4 h-4 text-violet-600 rounded" defaultChecked />
                              <span className="text-sm">{t('profile.new_appointments', 'Nuovi appuntamenti')}</span>
                            </label>
                            <label className="flex items-center space-x-3">
                              <input type="checkbox" className="w-4 h-4 text-violet-600 rounded" defaultChecked />
                              <span className="text-sm">{t('profile.appointment_reminders', 'Promemoria appuntamenti')}</span>
                            </label>
                            <label className="flex items-center space-x-3">
                              <input type="checkbox" className="w-4 h-4 text-violet-600 rounded" />
                              <span className="text-sm">{t('profile.newsletter_updates', 'Newsletter e aggiornamenti')}</span>
                            </label>
                          </div>
                        </div>

                        {/* Notifiche Push */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900">{t('profile.push_notifications', 'Notifiche Push')}</h3>
                          <div className="space-y-3">
                            <label className="flex items-center space-x-3">
                              <input type="checkbox" className="w-4 h-4 text-violet-600 rounded" defaultChecked />
                              <span className="text-sm">{t('profile.realtime_activity', 'Attività in tempo reale')}</span>
                            </label>
                            <label className="flex items-center space-x-3">
                              <input type="checkbox" className="w-4 h-4 text-violet-600 rounded" />
                              <span className="text-sm">{t('profile.daily_reminders', 'Promemoria quotidiani')}</span>
                            </label>
                          </div>
                        </div>

                        {/* Frequenza notifiche */}
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-900">{t('profile.notification_frequency', 'Frequenza Notifiche')}</h3>
                          <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent">
                            <option value="immediate">{t('profile.frequency_immediate', 'Immediata')}</option>
                            <option value="hourly">{t('profile.frequency_hourly', 'Ogni ora')}</option>
                            <option value="daily">{t('profile.frequency_daily', 'Giornaliera')}</option>
                            <option value="weekly">{t('profile.frequency_weekly', 'Settimanale')}</option>
                          </select>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </Tabs>
      </Card>
    </div>
  );
}
