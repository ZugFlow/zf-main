'use client';

import React, { useState } from 'react';
import { Download, Upload, FileText, Users, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/utils/supabase/client';
import { showToast } from '../../HelperToast';

interface ImportExportClientsProps {
  onClientsImported?: () => void;
}

interface ClientData {
  nome: string;
  email: string;
  telefono: string;
  note?: string;
  tipo_cliente?: 'privato' | 'azienda' | 'libero_professionista';
  indirizzo_fatturazione?: string;
  citta?: string;
  provincia?: string;
  cap?: string;
  codice_fiscale?: string;
  partita_iva?: string;
}

const ImportExportClients: React.FC<ImportExportClientsProps> = ({ onClientsImported }) => {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importResults, setImportResults] = useState<{
    total: number;
    success: number;
    errors: string[];
  }>({ total: 0, success: 0, errors: [] });

  const supabase = createClient();

  // Genera template CSV per l'import
  const generateTemplate = () => {
    const headers = [
      'nome',
      'email', 
      'telefono',
      'note',
      'tipo_cliente',
      'indirizzo_fatturazione',
      'citta',
      'provincia',
      'cap',
      'codice_fiscale',
      'partita_iva'
    ];
    
    const csvContent = [headers.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_clienti.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Genera dati demo
  const generateDemoData = () => {
    const demoClients: ClientData[] = [
      {
        nome: 'Mario Rossi',
        email: 'mario.rossi@email.com',
        telefono: '+39 333 1234567',
        note: 'Cliente abituale, preferisce appuntamenti mattutini',
        tipo_cliente: 'privato',
        indirizzo_fatturazione: 'Via Roma 123',
        citta: 'Milano',
        provincia: 'MI',
        cap: '20100',
        codice_fiscale: 'RSSMRA80A01H501U'
      },
      {
        nome: 'Azienda SRL',
        email: 'info@aziendasrl.it',
        telefono: '+39 02 1234567',
        note: 'Cliente aziendale, fatturazione mensile',
        tipo_cliente: 'azienda',
        indirizzo_fatturazione: 'Via delle Imprese 456',
        citta: 'Roma',
        provincia: 'RM',
        cap: '00100',
        partita_iva: '12345678901'
      },
      {
        nome: 'Dott.ssa Anna Bianchi',
        email: 'anna.bianchi@studio.it',
        telefono: '+39 333 9876543',
        note: 'Libero professionista, richiede fattura elettronica',
        tipo_cliente: 'libero_professionista',
        indirizzo_fatturazione: 'Via dei Professionisti 789',
        citta: 'Firenze',
        provincia: 'FI',
        cap: '50100',
        codice_fiscale: 'BNCNNA85B15D612X',
        partita_iva: '98765432109'
      },
      {
        nome: 'Giuseppe Verdi',
        email: 'giuseppe.verdi@gmail.com',
        telefono: '+39 333 5555555',
        note: 'Nuovo cliente, prima visita',
        tipo_cliente: 'privato',
        indirizzo_fatturazione: 'Via Verdi 10',
        citta: 'Napoli',
        provincia: 'NA',
        cap: '80100'
      },
      {
        nome: 'Studio Legale Associato',
        email: 'studio@legaleassociato.it',
        telefono: '+39 06 1234567',
        note: 'Studio legale, convenzione speciale',
        tipo_cliente: 'azienda',
        indirizzo_fatturazione: 'Via degli Avvocati 15',
        citta: 'Roma',
        provincia: 'RM',
        cap: '00100',
        partita_iva: '11223344556'
      }
    ];

    const headers = Object.keys(demoClients[0]);
    const csvContent = [
      headers.join(','),
      ...demoClients.map(client => 
        headers.map(header => {
          const value = client[header as keyof ClientData];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'demo_clienti.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    showToast({
      title: 'Demo generato',
      description: 'File demo_clienti.csv scaricato con successo',
      type: 'success'
    });
  };

  // Esporta clienti esistenti
  const exportClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('salon_id')
        .eq('id', user.id)
        .single();

      if (!profileData?.salon_id) throw new Error('Salon ID non trovato');

      const { data: clients, error } = await supabase
        .from('customers')
        .select('*')
        .eq('salon_id', profileData.salon_id);

      if (error) throw error;

      if (!clients || clients.length === 0) {
        showToast({
          title: 'Nessun cliente',
          description: 'Non ci sono clienti da esportare',
          type: 'info'
        });
        return;
      }

      const headers = [
        'nome',
        'email',
        'telefono', 
        'note',
        'tipo_cliente',
        'indirizzo_fatturazione',
        'citta',
        'provincia',
        'cap',
        'codice_fiscale',
        'partita_iva',
        'customer_uuid'
      ];

      const csvContent = [
        headers.join(','),
        ...clients.map(client => 
          headers.map(header => {
            const value = client[header as keyof typeof client];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clienti_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      showToast({
        title: 'Esportazione completata',
        description: `${clients.length} clienti esportati con successo`,
        type: 'success'
      });
    } catch (error) {
      console.error('Errore nell\'esportazione:', error);
      showToast({
        title: 'Errore',
        description: 'Impossibile esportare i clienti',
        type: 'error'
      });
    }
  };

  // Importa clienti da CSV
  const importClients = async () => {
    if (!selectedFile) return;

    setImportStatus('processing');
    setImportProgress(0);
    setImportResults({ total: 0, success: 0, errors: [] });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('salon_id')
        .eq('id', user.id)
        .single();

      if (!profileData?.salon_id) throw new Error('Salon ID non trovato');

      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      const dataLines = lines.slice(1);

      setImportResults(prev => ({ ...prev, total: dataLines.length }));

      const results = {
        success: 0,
        errors: [] as string[]
      };

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        
        try {
          const clientData: any = {};
          headers.forEach((header, index) => {
            if (values[index]) {
              clientData[header] = values[index];
            }
          });

          // Validazione base
          if (!clientData.nome || !clientData.email) {
            results.errors.push(`Riga ${i + 2}: Nome ed email sono obbligatori`);
            continue;
          }

          // Genera UUID per il cliente
          clientData.customer_uuid = crypto.randomUUID();
          clientData.salon_id = profileData.salon_id;
          clientData.user_id = user.id;

          const { error } = await supabase
            .from('customers')
            .insert(clientData);

          if (error) {
            results.errors.push(`Riga ${i + 2}: ${error.message}`);
          } else {
            results.success++;
          }

          setImportProgress(((i + 1) / dataLines.length) * 100);
        } catch (error) {
          results.errors.push(`Riga ${i + 2}: Errore di parsing`);
        }
      }

      setImportResults({ total: dataLines.length, ...results });
      setImportStatus(results.success > 0 ? 'success' : 'error');

      if (results.success > 0) {
        showToast({
          title: 'Import completato',
          description: `${results.success} clienti importati con successo`,
          type: 'success'
        });
        onClientsImported?.();
      }

    } catch (error) {
      console.error('Errore nell\'import:', error);
      setImportStatus('error');
      setImportResults(prev => ({
        ...prev,
        errors: [...prev.errors, 'Errore generale durante l\'import']
      }));
    }
  };

  return (
    <>
      {/* Pulsanti nella navbar */}
      <div className="flex items-center gap-2">
        <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="hover:bg-purple-50">
              <Download className="h-4 w-4 text-gray-500" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Esporta Clienti</DialogTitle>
              <DialogDescription>
                Scarica tutti i clienti in formato CSV
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  L'esportazione includerà tutti i dati dei clienti del tuo salone.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsExportOpen(false)}>
                Annulla
              </Button>
              <Button onClick={() => {
                exportClients();
                setIsExportOpen(false);
              }}>
                <Download className="h-4 w-4 mr-2" />
                Esporta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="hover:bg-purple-50">
              <Upload className="h-4 w-4 text-gray-500" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Importa Clienti</DialogTitle>
              <DialogDescription>
                Carica un file CSV con i dati dei clienti
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">File CSV</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
              
              {importStatus === 'processing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importazione in corso...</span>
                    <span>{Math.round(importProgress)}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              {importStatus === 'success' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Importazione completata: {importResults.success} su {importResults.total} clienti importati
                  </AlertDescription>
                </Alert>
              )}

              {importStatus === 'error' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Errore durante l'importazione. Controlla il file e riprova.
                  </AlertDescription>
                </Alert>
              )}

              {importResults.errors.length > 0 && (
                <div className="space-y-2">
                  <Label>Errori ({importResults.errors.length}):</Label>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResults.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={generateTemplate} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Template
                </Button>
                <Button variant="outline" onClick={() => setIsDemoOpen(true)} className="flex-1">
                  <Users className="h-4 w-4 mr-2" />
                  Demo
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                Annulla
              </Button>
              <Button 
                onClick={importClients}
                disabled={!selectedFile || importStatus === 'processing'}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog per generazione demo */}
      <Dialog open={isDemoOpen} onOpenChange={setIsDemoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Genera Dati Demo</DialogTitle>
            <DialogDescription>
              Crea un file CSV con dati di esempio per testare l'importazione
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                Verranno generati 5 clienti di esempio con dati realistici per testare l'importazione.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <h4 className="font-medium">Clienti demo inclusi:</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>• Mario Rossi (privato)</div>
                <div>• Azienda SRL (azienda)</div>
                <div>• Dott.ssa Anna Bianchi (libero professionista)</div>
                <div>• Giuseppe Verdi (privato)</div>
                <div>• Studio Legale Associato (azienda)</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDemoOpen(false)}>
              Annulla
            </Button>
            <Button onClick={() => {
              generateDemoData();
              setIsDemoOpen(false);
            }}>
              <Download className="h-4 w-4 mr-2" />
              Genera Demo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportExportClients; 