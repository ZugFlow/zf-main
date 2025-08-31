'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { 
  Calendar,
  Clock,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Phone,
  User,
  CalendarDays,
  Timer,
  Shield,
  Zap
} from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const supabase = createClient();

interface OnlineBookingSettings {
  id?: string;
  salon_id: string;
  enabled: boolean;
  require_approval: boolean;
  auto_confirm: boolean;
  min_notice_hours: number;
  max_days_ahead: number;
  slot_duration: number;
  booking_start_time: string;
  booking_end_time: string;
  allow_same_day_booking: boolean;
  max_bookings_per_day: number;
}

interface WorkingHours {
  id?: string;
  salon_id: string;
  team_member_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  visible_users: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domenica' },
  { value: 1, label: 'Lunedì' },
  { value: 2, label: 'Martedì' },
  { value: 3, label: 'Mercoledì' },
  { value: 4, label: 'Giovedì' },
  { value: 5, label: 'Venerdì' },
  { value: 6, label: 'Sabato' }
];

export default function PrenotazioniOnline() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [settings, setSettings] = useState<OnlineBookingSettings>({
    salon_id: '',
    enabled: false,
    require_approval: true,
    auto_confirm: false,
    min_notice_hours: 2,
    max_days_ahead: 30,
    slot_duration: 15,
    booking_start_time: '08:00',
    booking_end_time: '20:00',
    allow_same_day_booking: true,
    max_bookings_per_day: 50
  });
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);

  // Carica i dati iniziali
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Ottieni salon_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('salon_id')
        .eq('id', user.id)
        .single();

      if (!profileData?.salon_id) {
        throw new Error('Salon ID non trovato');
      }

      setSalonId(profileData.salon_id);

      // Carica impostazioni
      const { data: settingsData } = await supabase
        .from('online_booking_settings')
        .select('*')
        .eq('salon_id', profileData.salon_id)
        .single();

      if (settingsData) {
        setSettings(settingsData);
      } else {
        // Crea impostazioni di default
        setSettings(prev => ({ ...prev, salon_id: profileData.salon_id }));
      }

      // Carica membri del team
      const { data: teamData } = await supabase
        .from('team')
        .select('id, name, email, is_active, visible_users')
        .eq('salon_id', profileData.salon_id)
        .eq('is_active', true);

      setTeamMembers(teamData || []);

      // Carica orari di lavoro
      const { data: hoursData } = await supabase
        .from('working_hours')
        .select('*')
        .eq('salon_id', profileData.salon_id);

      setWorkingHours(hoursData || []);

    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le impostazioni delle prenotazioni online",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!salonId) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('online_booking_settings')
        .upsert({
          ...settings,
          salon_id: salonId,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Impostazioni salvate",
        description: "Le impostazioni delle prenotazioni online sono state aggiornate con successo",
      });

    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveWorkingHours = async () => {
    if (!salonId) return;

    try {
      setSaving(true);

      console.log('DEBUG: Salvando orari di lavoro...');
      console.log('DEBUG: salonId:', salonId);
      console.log('DEBUG: workingHours da salvare:', workingHours);

      // Salva tutti gli orari di lavoro
      const { data, error } = await supabase
        .from('working_hours')
        .upsert(
          workingHours.map(hour => ({
            ...hour,
            salon_id: salonId,
            updated_at: new Date().toISOString()
          })),
          {
            onConflict: 'salon_id,team_member_id,day_of_week',
            ignoreDuplicates: false
          }
        )
        .select();

      console.log('DEBUG: Risultato upsert:', { data, error });

      if (error) {
        console.error('DEBUG: Errore dettagliato:', error);
        throw error;
      }

      console.log('DEBUG: Orari salvati con successo:', data);

      toast({
        title: "Orari salvati",
        description: "Gli orari di lavoro sono stati aggiornati con successo",
      });

    } catch (error) {
      console.error('Errore nel salvataggio degli orari:', error);
      toast({
        title: "Errore",
        description: `Impossibile salvare gli orari di lavoro: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateWorkingHour = (memberId: string, dayOfWeek: number, field: 'start_time' | 'end_time' | 'is_active', value: string | boolean) => {
    setWorkingHours(prev => {
      const existing = prev.find(h => h.team_member_id === memberId && h.day_of_week === dayOfWeek);
      
      if (existing) {
        return prev.map(h => 
          h.team_member_id === memberId && h.day_of_week === dayOfWeek
            ? { ...h, [field]: value }
            : h
        );
      } else {
        return [...prev, {
          salon_id: salonId!,
          team_member_id: memberId,
          day_of_week: dayOfWeek,
          start_time: field === 'start_time' ? value as string : '09:00',
          end_time: field === 'end_time' ? value as string : '18:00',
          is_active: field === 'is_active' ? value as boolean : true
        }];
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Prenotazioni Online</h2>
          <p className="text-muted-foreground">
            Gestisci le impostazioni per le prenotazioni online del tuo salone
          </p>
        </div>
        <Badge variant={settings.enabled ? "default" : "secondary"}>
          {settings.enabled ? "Attivo" : "Disattivo"}
        </Badge>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Impostazioni Generali</TabsTrigger>
          <TabsTrigger value="hours">Orari di Lavoro</TabsTrigger>
          <TabsTrigger value="preview">Anteprima</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Configurazione Base
              </CardTitle>
              <CardDescription>
                Attiva e configura le prenotazioni online per il tuo salone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Prenotazioni Online</Label>
                  <p className="text-sm text-muted-foreground">
                    Abilita le prenotazioni online per i clienti
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Orario di Apertura</Label>
                  <Input
                    type="time"
                    value={settings.booking_start_time}
                    onChange={(e) => setSettings(prev => ({ ...prev, booking_start_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Orario di Chiusura</Label>
                  <Input
                    type="time"
                    value={settings.booking_end_time}
                    onChange={(e) => setSettings(prev => ({ ...prev, booking_end_time: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Durata Slot (minuti)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="60"
                    step="5"
                    value={settings.slot_duration}
                    onChange={(e) => setSettings(prev => ({ ...prev, slot_duration: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prenotazioni Max per Giorno</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.max_bookings_per_day}
                    onChange={(e) => setSettings(prev => ({ ...prev, max_bookings_per_day: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preavviso Minimo (ore)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    value={settings.min_notice_hours}
                    onChange={(e) => setSettings(prev => ({ ...prev, min_notice_hours: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giorni Massimi in Anticipo</Label>
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    value={settings.max_days_ahead}
                    onChange={(e) => setSettings(prev => ({ ...prev, max_days_ahead: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Richiedi Approvazione</Label>
                    <p className="text-sm text-muted-foreground">
                      Le prenotazioni richiedono approvazione manuale
                    </p>
                  </div>
                  <Switch
                    checked={settings.require_approval}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, require_approval: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Conferma Automatica</Label>
                    <p className="text-sm text-muted-foreground">
                      Conferma automaticamente le prenotazioni
                    </p>
                  </div>
                  <Switch
                    checked={settings.auto_confirm}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_confirm: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Prenotazioni Stesso Giorno</Label>
                    <p className="text-sm text-muted-foreground">
                      Permetti prenotazioni per lo stesso giorno
                    </p>
                  </div>
                  <Switch
                    checked={settings.allow_same_day_booking}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allow_same_day_booking: checked }))}
                  />
                </div>
              </div>

              <Button onClick={saveSettings} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    Salva Impostazioni
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Orari di Lavoro
              </CardTitle>
              <CardDescription>
                Configura gli orari di lavoro per ogni membro del team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nessun membro del team trovato. Aggiungi membri del team per configurare gli orari.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <h3 className="font-medium">{member.name}</h3>
                        <Badge variant={member.is_active ? "default" : "secondary"}>
                          {member.is_active ? "Attivo" : "Inattivo"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                        {DAYS_OF_WEEK.map((day) => {
                          const workingHour = workingHours.find(
                            h => h.team_member_id === member.id && h.day_of_week === day.value
                          );
                          
                          return (
                            <div key={day.value} className="space-y-2">
                              <Label className="text-xs">{day.label}</Label>
                              <div className="space-y-1">
                                <Input
                                  type="time"
                                  size={1}
                                  value={workingHour?.start_time || '09:00'}
                                  onChange={(e) => updateWorkingHour(member.id, day.value, 'start_time', e.target.value)}
                                />
                                <Input
                                  type="time"
                                  size={1}
                                  value={workingHour?.end_time || '18:00'}
                                  onChange={(e) => updateWorkingHour(member.id, day.value, 'end_time', e.target.value)}
                                />
                                                                 <div className="flex items-center space-x-2">
                                   <Switch
                                     checked={workingHour?.is_active ?? false}
                                     onCheckedChange={(checked) => updateWorkingHour(member.id, day.value, 'is_active', checked)}
                                   />
                                   <span className="text-xs">Attivo</span>
                                 </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <Separator />
                    </div>
                  ))}
                  
                  <Button onClick={saveWorkingHours} disabled={saving} className="w-full">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Salva Orari
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Anteprima Prenotazioni
              </CardTitle>
              <CardDescription>
                Vedi come appariranno le prenotazioni online ai tuoi clienti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Le prenotazioni online saranno disponibili all'indirizzo: 
                  <br />
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    https://tuodominio.com/salon/[subdomain]/booking
                  </code>
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Funzionalità Attive:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Selezione servizi disponibili
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Calendario con slot disponibili
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Selezione membro del team
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Form di prenotazione
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Conferma via email
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 