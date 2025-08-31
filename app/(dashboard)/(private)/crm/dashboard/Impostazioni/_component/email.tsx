"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Server, 
  Shield, 
  TestTube, 
  Save, 
  Loader2, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Info,
  Settings,
  Send
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { testEmailConnection } from "@/utils/emailService";
import { toast } from "sonner";
import { getSalonId } from "@/utils/getSalonId";

interface EmailSettings {
  enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  from_email: string;
  from_name: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'custom';
  secure: boolean;
  require_tls: boolean;
}

const SMTP_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    require_tls: true,
    description: 'Raccomandato per la maggior parte degli utenti'
  },
  outlook: {
    name: 'Outlook/Hotmail',
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    require_tls: true,
    description: 'Per account Microsoft'
  },
  yahoo: {
    name: 'Yahoo',
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    require_tls: true,
    description: 'Per account Yahoo'
  },
  custom: {
    name: 'Personalizzato',
    host: '',
    port: 587,
    secure: false,
    require_tls: true,
    description: 'Configurazione SMTP personalizzata'
  }
};

export default function EmailSettings() {
  const [settings, setSettings] = useState<EmailSettings>({
    enabled: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    from_email: '',
    from_name: '',
    provider: 'gmail',
    secure: false,
    require_tls: true
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const supabase = createClient();

  // Carica le impostazioni email dal database
  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ottieni il salon_id dell'utente corrente
      const salonId = await getSalonId();
      if (!salonId) {
        console.error('Impossibile determinare il salone');
        return;
      }

      // Recupera le impostazioni email dal database usando salon_id
      const { data: emailSettings, error } = await supabase
        .from('email_settings')
        .select('*')
        .eq('salon_id', salonId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Errore nel caricamento impostazioni email:', error);
        return;
      }

      if (emailSettings) {
        setSettings({
          enabled: emailSettings.enabled || false,
          smtp_host: emailSettings.smtp_host || '',
          smtp_port: emailSettings.smtp_port || 587,
          smtp_user: emailSettings.smtp_user || '',
          smtp_pass: emailSettings.smtp_pass || '',
          from_email: emailSettings.from_email || '',
          from_name: emailSettings.from_name || '',
          provider: emailSettings.provider || 'gmail',
          secure: emailSettings.secure || false,
          require_tls: emailSettings.require_tls !== undefined ? emailSettings.require_tls : true
        });
      }
    } catch (error) {
      console.error('Errore nel caricamento impostazioni:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEmailSettings = async () => {
    try {
      setSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Utente non autenticato');
        return;
      }

      // Ottieni il salon_id dell'utente corrente
      const salonId = await getSalonId();
      if (!salonId) {
        toast.error('Impossibile determinare il salone');
        return;
      }

      // Validazione
      if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass) {
        toast.error('Compila tutti i campi obbligatori');
        return;
      }

      // Prepara i dati base da salvare (sempre supportati)
      const baseData = {
        salon_id: salonId,
        enabled: settings.enabled,
        smtp_host: settings.smtp_host,
        smtp_port: settings.smtp_port,
        smtp_user: settings.smtp_user,
        smtp_pass: settings.smtp_pass,
        from_email: settings.from_email || settings.smtp_user,
        from_name: settings.from_name,
        provider: settings.provider,
        updated_at: new Date().toISOString()
      };

      // Prova diverse combinazioni di colonne per gestire la migrazione graduale
      let saveSuccessful = false;
      let lastError = null;

      // Tentativo 1: Con tutte le colonne (secure + require_tls)
      try {
        const { error } = await supabase
          .from('email_settings')
          .upsert({
            ...baseData,
            secure: settings.secure,
            require_tls: settings.require_tls
          }, {
            onConflict: 'salon_id'
          });

        if (!error) {
          saveSuccessful = true;
        } else {
          lastError = error;
          console.warn('Tentativo 1 fallito:', error.message);
        }
      } catch (error) {
        lastError = error;
        console.warn('Errore nel tentativo 1:', error);
      }

      // Tentativo 2: Solo con secure (se require_tls non esiste)
      if (!saveSuccessful) {
        try {
          const { error } = await supabase
            .from('email_settings')
            .upsert({
              ...baseData,
              secure: settings.secure
            }, {
              onConflict: 'salon_id'
            });

          if (!error) {
            saveSuccessful = true;
            console.warn('Salvataggio completato senza require_tls');
          } else {
            lastError = error;
            console.warn('Tentativo 2 fallito:', error.message);
          }
        } catch (error) {
          lastError = error;
          console.warn('Errore nel tentativo 2:', error);
        }
      }

      // Tentativo 3: Solo dati base (se secure e require_tls non esistono)
      if (!saveSuccessful) {
        try {
          const { error } = await supabase
            .from('email_settings')
            .upsert(baseData, {
              onConflict: 'salon_id'
            });

          if (!error) {
            saveSuccessful = true;
            console.warn('Salvataggio completato solo con dati base');
          } else {
            lastError = error;
            console.error('Tentativo 3 fallito:', error.message);
          }
        } catch (error) {
          lastError = error;
          console.error('Errore nel tentativo 3:', error);
        }
      }

      // Se nessun tentativo ha funzionato
      if (!saveSuccessful) {
        console.error('Tutti i tentativi di salvataggio sono falliti:', lastError);
        toast.error('Errore nel salvataggio delle impostazioni. Esegui la migrazione del database.');
        return;
      }

      toast.success('Impostazioni email salvate con successo');
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      toast.error('Errore nel salvataggio delle impostazioni');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      const result = await testEmailConnection();
      
      if (result.success) {
        setTestResult({ success: true, message: 'Test connessione email riuscito!' });
        toast.success('Test connessione email riuscito!');
      } else {
        setTestResult({ success: false, message: result.error || 'Test fallito' });
        toast.error(`Test fallito: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setTestResult({ success: false, message: errorMessage });
      toast.error(`Errore nel test: ${errorMessage}`);
    } finally {
      setTesting(false);
    }
  };

  const handleProviderChange = (provider: string) => {
    const selectedProvider = provider as keyof typeof SMTP_PROVIDERS;
    const providerConfig = SMTP_PROVIDERS[selectedProvider];
    
    setSettings(prev => ({
      ...prev,
      provider: selectedProvider,
      smtp_host: providerConfig.host,
      smtp_port: providerConfig.port,
      secure: providerConfig.secure,
      require_tls: providerConfig.require_tls
    }));
  };

  const handleToggleEnabled = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, enabled }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Caricamento impostazioni email...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configurazione Email</h2>
          <p className="text-gray-600">
            Configura l'invio automatico di email per le prenotazioni online
          </p>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Stato Notifiche Email
          </CardTitle>
          <CardDescription>
            Abilita o disabilita l'invio automatico di email per le prenotazioni
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifiche Email</p>
              <p className="text-sm text-gray-600">
                {settings.enabled 
                  ? 'Le email verranno inviate automaticamente ai clienti'
                  : 'Le email non verranno inviate'
                }
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={handleToggleEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMTP Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Configurazione Server SMTP
          </CardTitle>
          <CardDescription>
            Configura il server email per l'invio delle notifiche
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provider Email</Label>
            <Select value={settings.provider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona un provider" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SMTP_PROVIDERS).map(([key, provider]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col">
                      <span className="font-medium">{provider.name}</span>
                      <span className="text-xs text-gray-500">{provider.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Server Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_host">Server SMTP *</Label>
              <Input
                id="smtp_host"
                value={settings.smtp_host}
                onChange={(e) => setSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                placeholder="smtp.gmail.com"
                disabled={settings.provider !== 'custom'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtp_port">Porta *</Label>
              <Input
                id="smtp_port"
                type="number"
                value={settings.smtp_port}
                onChange={(e) => setSettings(prev => ({ ...prev, smtp_port: parseInt(e.target.value) || 587 }))}
                placeholder="587"
                disabled={settings.provider !== 'custom'}
              />
            </div>
          </div>

          {/* Authentication */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_user">Email/Username *</Label>
              <Input
                id="smtp_user"
                type="email"
                value={settings.smtp_user}
                onChange={(e) => setSettings(prev => ({ ...prev, smtp_user: e.target.value }))}
                placeholder="your-email@gmail.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="smtp_pass">Password *</Label>
              <Input
                id="smtp_pass"
                type="password"
                value={settings.smtp_pass}
                onChange={(e) => setSettings(prev => ({ ...prev, smtp_pass: e.target.value }))}
                placeholder="Password o App Password"
              />
            </div>
          </div>

          {/* From Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_email">Email Mittente</Label>
              <Input
                id="from_email"
                type="email"
                value={settings.from_email}
                onChange={(e) => setSettings(prev => ({ ...prev, from_email: e.target.value }))}
                placeholder="noreply@tuosalone.com"
              />
              <p className="text-xs text-gray-500">
                Se vuoto, verrà usata l'email SMTP
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="from_name">Nome Mittente</Label>
              <Input
                id="from_name"
                value={settings.from_name}
                onChange={(e) => setSettings(prev => ({ ...prev, from_name: e.target.value }))}
                placeholder="Il tuo Salone"
              />
            </div>
          </div>

          {/* SSL/TLS Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="secure">Connessione Sicura (SSL/TLS)</Label>
                <p className="text-sm text-gray-600">
                  Abilita per connessioni crittografate (porta 465)
                </p>
              </div>
              <Switch
                id="secure"
                checked={settings.secure}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  secure: checked,
                  smtp_port: checked ? 465 : 587 
                }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require_tls">Richiedi TLS</Label>
                <p className="text-sm text-gray-600">
                  Forza l'uso di TLS per connessioni sicure (porta 587)
                </p>
              </div>
              <Switch
                id="require_tls"
                checked={settings.require_tls}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, require_tls: checked }))}
                disabled={settings.secure} // Disabilita se SSL è attivo
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Test Connessione
          </CardTitle>
          <CardDescription>
            Verifica che la configurazione SMTP funzioni correttamente. Il test invierà un'email di prova.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={handleTestConnection}
              disabled={testing || !settings.smtp_host || !settings.smtp_user || !settings.smtp_pass}
              className="flex items-center gap-2"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {testing ? 'Test in corso...' : 'Testa Connessione'}
            </Button>
            
            {!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass ? (
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    Compila i campi obbligatori (Server SMTP, Email/Username, Password) per testare la connessione
                  </span>
                </div>
              </div>
            ) : null}

            {testResult && (
              <div className={`p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

                {/* SSL/TLS Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Configurazione SSL/TLS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Connessione Sicura (SSL/TLS)</h4>
                  <ul className="text-blue-800 space-y-1">
                    <li>• <strong>Porta 465 + SSL:</strong> Connessione crittografata fin dall'inizio</li>
                    <li>• <strong>Porta 587 + TLS:</strong> Connessione che si aggiorna a crittografata</li>
                    <li>• <strong>Raccomandato:</strong> Usa TLS (porta 587) per la maggior parte dei provider</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Configurazioni Raccomandate</h4>
                  <ul className="text-green-800 space-y-1">
                    <li>• <strong>Gmail:</strong> Porta 587 + TLS abilitato</li>
                    <li>• <strong>Outlook:</strong> Porta 587 + TLS abilitato</li>
                    <li>• <strong>Yahoo:</strong> Porta 587 + TLS abilitato</li>
                    <li>• <strong>Provider personalizzati:</strong> Consulta la documentazione del provider</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Istruzioni per Gmail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Badge variant="outline">1</Badge>
                  <p>Abilita l'<strong>autenticazione a due fattori</strong> sul tuo account Google</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">2</Badge>
                  <p>Vai su <strong>Account Google → Sicurezza → Password per le app</strong></p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">3</Badge>
                  <p>Genera una password per "Zugflow" e usala nel campo Password</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">4</Badge>
                  <p>Testa la connessione per verificare che tutto funzioni</p>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={saveEmailSettings}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Salvando...' : 'Salva Impostazioni'}
        </Button>
      </div>
    </div>
  );
}
