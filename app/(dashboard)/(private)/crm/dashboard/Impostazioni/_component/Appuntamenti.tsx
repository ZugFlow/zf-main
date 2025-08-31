import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, RefreshCw, AlertTriangle, X, Info, CheckCircle, AlertCircle, Square, Maximize2, Minimize2, AlignLeft, AlignCenter, AlignRight, Clock, Eye, EyeOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getSalonId } from '@/utils/getSalonId';

const supabase = createClient();

const formatTime = (time: string | null) => {
  if (!time) return "00:00";
  return time;
};

const parseTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const Appuntamenti = () => {
  const [startHour, setStartHour] = useState<string>("00:00");
  const [isStartHourModalOpen, setIsStartHourModalOpen] = useState(false);
  const [finishHour, setFinishHour] = useState<string>("00:00");
  const [isFinishHourModalOpen, setIsFinishHourModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [cardSize, setCardSize] = useState<string>("normal"); // "compact", "normal", "expanded"
  const [cardAlignment, setCardAlignment] = useState<string>("center"); // "left", "center", "right"
  const [hideOutsideHours, setHideOutsideHours] = useState<boolean>(false); // Nascondi orari fuori orario
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheStatusModal, setCacheStatusModal] = useState<{
    show: boolean;
    type: 'info' | 'success' | 'error';
    title: string;
    message: string;
    details?: string;
  } | null>(null);
  const [clearCacheModal, setClearCacheModal] = useState<{
    show: boolean;
    isClearing: boolean;
    cacheStatus?: {
      exists: boolean;
      message: string;
      details?: string;
    };
    result?: {
      success: boolean;
      message: string;
      details?: string;
    };
  }>({
    show: false,
    isClearing: false
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;

      if (userError || !user) {
        console.error("Errore nel recupero dell'utente:", userError?.message || "Utente non autenticato");
        return;
      }

      setUserId(user.id);

      // Ottieni salon_id usando la funzione utility (funziona per manager e collaboratori)
      const salonId = await getSalonId();

      if (salonId) {
        setSalonId(salonId);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (!userId || !salonId) return;

    const fetchSettings = async () => {
      console.log("📊 Caricamento impostazioni orarie per:", { userId, salonId });
      
      const { data, error } = await supabase
        .from("hoursettings")
        .select("start_hour, finish_hour, hide_outside_hours, SizeCard, CardAlignment")
        .eq("user_id", userId)
        .eq("salon_id", salonId)
        .single();

      if (error) {
        console.error("Errore nel recupero delle impostazioni orarie:", error.message);
        // Se non ci sono impostazioni esistenti, usa valori di default
        if (error.code === 'PGRST116') {
          console.log("⚠️ Nessuna impostazione trovata, uso valori di default");
          setStartHour("08:00");
          setFinishHour("20:00");
          setHideOutsideHours(false);
          setCardSize("normal");
          setCardAlignment("center");
        }
      } else {
        console.log("✅ Impostazioni orarie caricate:", data);
        setStartHour(data?.start_hour || "08:00");
        setFinishHour(data?.finish_hour || "20:00");
        setHideOutsideHours(data?.hide_outside_hours || false);
        setCardSize(data?.SizeCard || "normal");
        setCardAlignment(data?.CardAlignment || "center");
      }
    };

    fetchSettings();
  }, [userId, salonId]);



  const updateStartHour = async (newHour: string) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
      console.error("Errore nel recupero dell'utente:", userError?.message || "Utente non autenticato");
      toast({
        title: "Errore",
        description: "Impossibile recuperare i dati dell'utente",
        variant: "destructive",
      });
      return;
    }

    if (!salonId) {
      console.error("Salon ID non disponibile");
      toast({
        title: "Errore",
        description: "Salon ID non disponibile. Impossibile salvare le impostazioni.",
        variant: "destructive",
      });
      return;
    }

    console.log("🕐 Aggiornamento orario di inizio:", { userId: user.id, salonId, newHour, finishHour });

    const { error: updateError } = await supabase
      .from("hoursettings")
      .upsert(
        {
          user_id: user.id,
          salon_id: salonId,
          start_hour: newHour,
          finish_hour: finishHour,
          hide_outside_hours: hideOutsideHours,
          SizeCard: cardSize,
          CardAlignment: cardAlignment,
        },
        { onConflict: "user_id" }
      );

    if (updateError) {
      console.error("Errore nell'aggiornamento dell'orario di inizio:", updateError.message);
      toast({
        title: "Errore",
        description: "Impossibile salvare l'orario di inizio",
        variant: "destructive",
      });
    } else {
      setStartHour(newHour);
      toast({
        title: "Salvato",
        description: "Orario di inizio aggiornato con successo",
      });
      console.log("✅ Orario di inizio salvato con successo");
    }
  };

  const updateFinishHour = async (newHour: string) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
      console.error("Errore nel recupero dell'utente:", userError?.message || "Utente non autenticato");
      toast({
        title: "Errore",
        description: "Impossibile recuperare i dati dell'utente",
        variant: "destructive",
      });
      return;
    }

    if (!salonId) {
      console.error("Salon ID non disponibile");
      toast({
        title: "Errore",
        description: "Salon ID non disponibile. Impossibile salvare le impostazioni.",
        variant: "destructive",
      });
      return;
    }

    console.log("🕐 Aggiornamento orario di fine:", { userId: user.id, salonId, startHour, newHour });

    const { error: updateError } = await supabase
      .from("hoursettings")
      .upsert(
        {
          user_id: user.id,
          salon_id: salonId,
          start_hour: startHour,
          finish_hour: newHour,
          hide_outside_hours: hideOutsideHours,
          SizeCard: cardSize,
          CardAlignment: cardAlignment,
        },
        { onConflict: "user_id" }
      );

    if (updateError) {
      console.error("Errore nell'aggiornamento dell'orario di fine:", updateError.message);
      toast({
        title: "Errore",
        description: "Impossibile salvare l'orario di fine",
        variant: "destructive",
      });
    } else {
      setFinishHour(newHour);
      toast({
        title: "Salvato",
        description: "Orario di fine aggiornato con successo",
      });
      console.log("✅ Orario di fine salvato con successo");
    }
  };

  const updateCardSize = async (newSize: string) => {
    if (!userId || !salonId) {
      console.error("User ID o Salon ID non disponibile");
      return;
    }

    console.log("🔄 Aggiornamento dimensione card:", { userId, salonId, newSize });

    try {
      const { error: updateError } = await supabase
        .from("hoursettings")
        .upsert(
          {
            user_id: userId,
            salon_id: salonId,
            start_hour: startHour,
            finish_hour: finishHour,
            hide_outside_hours: hideOutsideHours,
            SizeCard: newSize,
            CardAlignment: cardAlignment,
          },
          { onConflict: "user_id" }
        );

      if (updateError) {
        console.error("Errore nell'aggiornamento della dimensione card:", updateError.message);
        toast({
          title: "Errore",
          description: "Impossibile aggiornare la dimensione delle card",
          variant: "destructive",
        });
      } else {
        setCardSize(newSize);
        toast({
          title: "Impostazione salvata",
          description: "La dimensione delle card è stata aggiornata",
        });
        console.log("✅ Dimensione card salvata con successo");
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento della dimensione card:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio",
        variant: "destructive",
      });
    }
  };

  const updateCardAlignment = async (newAlignment: string) => {
    if (!userId || !salonId) {
      console.error("User ID o Salon ID non disponibile");
      return;
    }

    console.log("🔄 Aggiornamento allineamento card:", { userId, salonId, newAlignment });

    try {
      const { error: updateError } = await supabase
        .from("hoursettings")
        .upsert(
          {
            user_id: userId,
            salon_id: salonId,
            start_hour: startHour,
            finish_hour: finishHour,
            hide_outside_hours: hideOutsideHours,
            SizeCard: cardSize,
            CardAlignment: newAlignment,
          },
          { onConflict: "user_id" }
        );

      if (updateError) {
        console.error("Errore nell'aggiornamento dell'allineamento card:", updateError.message);
        toast({
          title: "Errore",
          description: "Impossibile aggiornare l'allineamento delle card",
          variant: "destructive",
        });
      } else {
        setCardAlignment(newAlignment);
        toast({
          title: "Impostazione salvata",
          description: "L'allineamento delle card è stato aggiornato",
        });
        console.log("✅ Allineamento card salvato con successo");
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento dell'allineamento card:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio",
        variant: "destructive",
      });
    }
  };

  const updateHideOutsideHours = async (hideHours: boolean) => {
    if (!userId || !salonId) {
      console.error("User ID o Salon ID non disponibile");
      return;
    }

    console.log("🔄 Aggiornamento hide_outside_hours:", { userId, salonId, hideHours });

    try {
      const { error: updateError } = await supabase
        .from("hoursettings")
        .upsert(
          {
            user_id: userId,
            salon_id: salonId,
            start_hour: startHour,
            finish_hour: finishHour,
            hide_outside_hours: hideHours,
            SizeCard: cardSize,
            CardAlignment: cardAlignment,
          },
          { onConflict: "user_id" }
        );

      console.log("📝 Risultato aggiornamento:", { updateError });

      if (updateError) {
        console.error("Errore nell'aggiornamento dell'impostazione orari fuori orario:", updateError.message);
        toast({
          title: "Errore",
          description: "Impossibile aggiornare l'impostazione orari fuori orario",
          variant: "destructive",
        });
      } else {
        setHideOutsideHours(hideHours);
        toast({
          title: "Impostazione salvata",
          description: `Gli orari fuori dall'orario di lavoro sono ora ${hideHours ? 'nascosti' : 'visibili'}`,
        });
        console.log("✅ Impostazione hide_outside_hours aggiornata con successo");
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento dell'impostazione orari fuori orario:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio",
        variant: "destructive",
      });
    }
  };

  // Funzione per aprire il modal di pulizia cache (disabilitata - cache system removed)
  const openClearCacheModal = async () => {
    // Cache system has been removed - no longer needed
    console.log("Cache system removed - no longer available");
  };

  // Funzione per pulire la cache del calendario (disabilitata - cache system removed)
  const clearCalendarCache = async () => {
    // Cache system has been removed - no longer needed
    console.log("Cache system removed - no longer available");
  };

  // Funzione per chiudere il modal di pulizia cache (disabilitata - cache system removed)
  const closeClearCacheModal = () => {
    // Cache system has been removed - no longer needed
    console.log("Cache system removed - no longer available");
  };



  return (
    <div className="w-full p-6">
      {/* Modal Stato Cache */}
      <Dialog open={cacheStatusModal?.show || false} onOpenChange={(open) => !open && setCacheStatusModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {cacheStatusModal?.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : cacheStatusModal?.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Info className="w-5 h-5 text-blue-600" />
              )}
              {cacheStatusModal?.title}
            </DialogTitle>
            <DialogDescription className="text-left">
              <div className="space-y-2">
                <p className="text-sm">
                  {cacheStatusModal?.message}
                </p>
                {cacheStatusModal?.details && (
                  <p className="text-xs text-muted-foreground">
                    {cacheStatusModal.details}
                  </p>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Modal Pulizia Cache */}
      <Dialog open={clearCacheModal.show} onOpenChange={(open) => !open && closeClearCacheModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {clearCacheModal.isClearing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              ) : clearCacheModal.result?.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : clearCacheModal.result ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <Info className="w-5 h-5 text-blue-600" />
              )}
              {clearCacheModal.isClearing 
                ? "Pulizia Cache in Corso..." 
                : clearCacheModal.result?.success 
                ? "✅ Cache Pulita"
                : clearCacheModal.result 
                ? "❌ Errore"
                : "📊 Stato Cache"
              }
            </DialogTitle>
            <DialogDescription className="text-left">
              {clearCacheModal.isClearing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-sm text-muted-foreground">
                        Pulizia cache in corso...
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Rimozione dati temporanei dal calendario
                      </p>
                    </div>
                  </div>
                </div>
              ) : clearCacheModal.result ? (
                <div className="space-y-3">
                  <p className="text-sm">
                    {clearCacheModal.result.message}
                  </p>
                  {clearCacheModal.result.details && (
                    <p className="text-xs text-muted-foreground">
                      {clearCacheModal.result.details}
                    </p>
                  )}
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={closeClearCacheModal}
                      variant={clearCacheModal.result.success ? "default" : "destructive"}
                      size="sm"
                    >
                      Chiudi
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stato Cache */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 mb-1">
                          Stato Cache Calendario
                        </p>
                        <p className="text-xs text-blue-700">
                          {clearCacheModal.cacheStatus?.message}
                        </p>
                        {clearCacheModal.cacheStatus?.details && (
                          <p className="text-xs text-blue-600 mt-1">
                            {clearCacheModal.cacheStatus.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Avviso Pulizia */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-700">
                      ⚠️ Attenzione: La pulizia rimuoverà tutti i dati temporanei. 
                      Il calendario ricaricherà i dati al prossimo accesso, causando un breve rallentamento.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      onClick={closeClearCacheModal}
                      variant="outline"
                      size="sm"
                    >
                      Chiudi
                    </Button>
                    <Button 
                      onClick={clearCalendarCache}
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2"
                      disabled={!clearCacheModal.cacheStatus?.exists}
                    >
                      <Trash2 className="w-4 h-4" />
                      Pulisci Cache
                    </Button>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <div className="flex justify-center gap-8">
        {/* Description Section */}
        <div className="hidden lg:block w-[320px]">
          <Card className="border-0 shadow-sm h-full bg-gradient-to-br from-violet-50 to-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-[18px] font-semibold text-violet-800">
                Configurazione Calendario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-[14px] text-violet-700">
                <p className="leading-relaxed">
                  Personalizza le impostazioni del calendario:
                </p>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Orari di apertura e chiusura</li>
                  <li>Dimensione delle card appuntamenti (personale)</li>
                  <li>Allineamento delle card appuntamenti (personale)</li>
                  <li>Visualizzazione orari fuori orario</li>
                  <li>Impostazioni di visualizzazione</li>
                  <li>Gestione cache per performance</li>
                </ul>
                <div className="mt-6 p-4 bg-white/50 rounded-lg border border-violet-200">
                  <p className="text-[12px] text-violet-600">
                    💡 Suggerimento: Configura gli orari e le preferenze di visualizzazione in base alle tue esigenze. Le impostazioni delle card sono personali e non influiscono sugli altri membri del team.
                  </p>
                </div>
                <div className="mt-4 p-4 bg-amber-50/50 rounded-lg border border-amber-200">
                  <p className="text-[12px] text-amber-700">
                    🔧 Manutenzione: Usa la sezione "Gestione Cache" se riscontri problemi di visualizzazione o dati non aggiornati.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Section */}
        <Card className="border-0 shadow-sm w-full max-w-[500px] bg-white">
          <CardHeader className="pb-4 border-b border-gray-100">
            <CardTitle className="text-[18px] font-medium text-gray-800">
              Impostazioni Appuntamenti
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[14px] font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Orario di Inizio
                </Label>
                <Input
                  type="time"
                  value={formatTime(startHour)}
                  onChange={(e) => updateStartHour(e.target.value)}
                  className="h-10 rounded-lg border-gray-200 focus:border-violet-500 focus:ring-violet-500/20"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[14px] font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Orario di Fine
                </Label>
                <Input
                  type="time"
                  value={formatTime(finishHour)}
                  onChange={(e) => updateFinishHour(e.target.value)}
                  className="h-10 rounded-lg border-gray-200 focus:border-violet-500 focus:ring-violet-500/20"
                />
              </div>

              {/* Sezione Dimensione Card */}
              <div className="space-y-3">
                <Label className="text-[14px] font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Dimensione Card Appuntamenti
                </Label>
                <div className="space-y-2">
                  <Select value={cardSize} onValueChange={updateCardSize}>
                    <SelectTrigger className="h-10 rounded-lg border-gray-200 focus:border-violet-500 focus:ring-violet-500/20">
                      <SelectValue placeholder="Seleziona dimensione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">
                        <div className="flex items-center gap-2">
                          <Minimize2 className="w-4 h-4" />
                          <span>Compatta</span>
                          <span className="text-xs text-gray-500">(Si adatta al testo)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="normal">
                        <div className="flex items-center gap-2">
                          <Square className="w-4 h-4" />
                          <span>Normale</span>
                          <span className="text-xs text-gray-500">(Dimensione standard)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="expanded">
                        <div className="flex items-center gap-2">
                          <Maximize2 className="w-4 h-4" />
                          <span>Espansa</span>
                          <span className="text-xs text-gray-500">(Occupazione completa)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                                  <div className="text-[12px] text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="mb-1 font-medium text-blue-800">Descrizione opzioni:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li><strong>Compatta:</strong> Le card si adattano al contenuto del testo</li>
                    <li><strong>Normale:</strong> Dimensione standard bilanciata</li>
                    <li><strong>Espansa:</strong> Le card occupano tutta la larghezza disponibile</li>
                  </ul>
                  <p className="mt-2 text-blue-600 font-medium">
                    💡 Questa è un'impostazione personale che non influisce sugli altri membri del team.
                  </p>
                </div>
                </div>
              </div>

              {/* Sezione Allineamento Card */}
              <div className="space-y-3">
                <Label className="text-[14px] font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Allineamento Card Appuntamenti
                </Label>
                <div className="space-y-2">
                  <Select value={cardAlignment} onValueChange={updateCardAlignment}>
                    <SelectTrigger className="h-10 rounded-lg border-gray-200 focus:border-violet-500 focus:ring-violet-500/20">
                      <SelectValue placeholder="Seleziona allineamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">
                        <div className="flex items-center gap-2">
                          <AlignLeft className="w-4 h-4" />
                          <span>Sinistra</span>
                          <span className="text-xs text-gray-500">(Allineamento a sinistra)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="center">
                        <div className="flex items-center gap-2">
                          <AlignCenter className="w-4 h-4" />
                          <span>Centro</span>
                          <span className="text-xs text-gray-500">(Allineamento centrale)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="right">
                        <div className="flex items-center gap-2">
                          <AlignRight className="w-4 h-4" />
                          <span>Destra</span>
                          <span className="text-xs text-gray-500">(Allineamento a destra)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-[12px] text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="mb-1 font-medium text-green-800">Descrizione opzioni:</p>
                    <ul className="space-y-1 text-green-700">
                      <li><strong>Sinistra:</strong> Le card si allineano al bordo sinistro della cella</li>
                      <li><strong>Centro:</strong> Le card si centrano nella cella (raccomandato)</li>
                      <li><strong>Destra:</strong> Le card si allineano al bordo destro della cella</li>
                    </ul>
                    <p className="mt-2 text-green-600 font-medium">
                      💡 Questa è un'impostazione personale che non influisce sugli altri membri del team.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sezione Visualizzazione Orari Fuori Orario */}
              <div className="space-y-3">
                <Label className="text-[14px] font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Visualizzazione Orari Fuori Orario
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">
                          Nascondi orari fuori dall'orario di lavoro
                        </p>
                        <p className="text-xs text-orange-700">
                          {hideOutsideHours ? 'Gli orari prima di ' + startHour + ' e dopo ' + finishHour + ' saranno nascosti' : 'Tutti gli orari saranno visibili nel calendario'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={hideOutsideHours}
                      onCheckedChange={updateHideOutsideHours}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>
                  <div className="text-[12px] text-gray-600 bg-orange-50/50 p-3 rounded-lg border border-orange-200">
                    <p className="mb-1 font-medium text-orange-800">Descrizione funzionalità:</p>
                    <ul className="space-y-1 text-orange-700">
                      <li><strong>Attivato:</strong> Nasconde gli orari prima dell'orario di inizio e dopo l'orario di fine</li>
                      <li><strong>Disattivato:</strong> Mostra tutti gli orari nel calendario (00:00 - 23:59)</li>
                      <li><strong>Utile per:</strong> Concentrarsi solo sugli orari di lavoro effettivi</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Sezione Gestione Cache */}
              <div className="pt-6 border-t border-gray-100">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <Label className="text-[14px] font-medium text-gray-700">
                      Gestione Cache Calendario
                    </Label>
                  </div>
                  
                  <div className="text-[12px] text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p className="mb-2">
                      La cache migliora le performance del calendario. Se riscontri problemi di visualizzazione, 
                      puoi pulire la cache per forzare un ricaricamento completo dei dati.
                    </p>
                    <p className="text-amber-600 font-medium">
                      ⚠️ Attenzione: La pulizia della cache causerà un breve rallentamento al prossimo accesso.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={openClearCacheModal}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-[12px] h-9"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Gestione Cache
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Appuntamenti;
