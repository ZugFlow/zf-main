"use client";

import React, { useEffect, useState } from "react";
import { UserIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrashIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const supabase = createClient();

const formSchema = z.object({
  nome: z.string().min(1, { message: "Il nome è obbligatorio." }),
  telefono: z.string().optional(),
  email: z.string().optional(),
  descrizione: z.string().optional(),
  note: z.string().optional(),
  intestazione_fattura: z.string().optional(),
  codice_fiscale: z.string().optional(),
  partita_iva: z.string().optional(),
  pec: z.string().optional(),
  codice_sdi: z.string().optional(),
  indirizzo_fatturazione: z.string().optional(),
  cap: z.string().optional(),
  citta: z.string().optional(),
  provincia: z.string().optional(),
  nazione: z.string().optional(),
}).partial().extend({
  nome: z.string().min(1, { message: "Il nome è obbligatorio." })
});

interface EditFormModalProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  clientId: number | null; // Mantieni il nome `clientId`
  onClientUpdated?: (updatedClient: any) => void; // Callback per notificare l'aggiornamento
}

const EditFormModal: React.FC<EditFormModalProps> = ({ isDialogOpen, setIsDialogOpen, clientId, onClientUpdated }) => {
  const [clientData, setClientData] = useState<any>(null);
  const [coupons, setCoupons] = useState<any[]>([]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      telefono: "",
      email: "",
      descrizione: "",
      note: "",
      intestazione_fattura: "",
      codice_fiscale: "",
      partita_iva: "",
      pec: "",
      codice_sdi: "",
      indirizzo_fatturazione: "",
      cap: "",
      citta: "",
      provincia: "",
      nazione: "Italia",
    },
    mode: "onChange", // Abilita la validazione in tempo reale
  });

  useEffect(() => {
    const fetchClientData = async () => {
      if (clientId) {
        const { data, error } = await supabase.from("customers").select("*", { count: "exact" }).eq("id", clientId).single();
        if (error) {
          console.error("Errore nel recupero dei dati del cliente:", error.message);
        } else {
          // Pulisci i dati per rimuovere valori nulli e undefined
          const cleanData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => [
              key, 
              value === null || value === undefined ? "" : value
            ])
          );
          form.reset(cleanData);
        }
      }
    };
    fetchClientData();
  }, [clientId, form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Filtra solo i campi che sono stati effettivamente modificati
      const changedValues: any = {};
      Object.keys(values).forEach(key => {
        const value = values[key as keyof typeof values];
        // Includi solo i campi che hanno un valore (anche stringhe vuote per permettere di cancellare)
        if (value !== undefined && value !== null) {
          changedValues[key] = value;
        }
      });

      // Rimuovi il campo nome se è vuoto (non dovrebbe succedere ma per sicurezza)
      if (changedValues.nome === '') {
        delete changedValues.nome;
      }

      // Se non ci sono modifiche, chiudi semplicemente il modal
      if (Object.keys(changedValues).length === 0) {
        setIsDialogOpen(false);
        return;
      }

      const { data: updatedClient, error: customerError } = await supabase
        .from("customers")
        .update(changedValues)
        .eq("id", clientId)
        .select()
        .single();
      if (customerError) {
        console.error("Errore durante l'aggiornamento del cliente:", customerError.message);
        return;
      }
      
      // Notifica il componente padre dell'aggiornamento
      if (onClientUpdated && updatedClient) {
        onClientUpdated(updatedClient);
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Errore generale:", error);
      alert("Errore durante l'aggiornamento del cliente.");
    }
  };

  if (!isDialogOpen) return null;

  // Handler to close modal when clicking outside
  const handleBackdropClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (e.target === e.currentTarget) {
      setIsDialogOpen(false);
    }
  };

  return (
    <div
              className="fixed inset-0 z-[9999] flex min-h-screen min-w-full items-center justify-center bg-black/30 backdrop-blur-sm"
      onMouseDown={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-0 border border-gray-100 flex flex-col justify-center mx-auto max-h-[90vh]"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-2 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center rounded-full bg-violet-100 p-2">
              <UserIcon className="w-5 h-5 text-violet-500" />
            </span>
            <h3 className="text-lg font-semibold text-gray-900">Modifica Cliente</h3>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            Modifica i dettagli del cliente e salva le modifiche.
          </p>
        </div>
        <div className="px-6 pb-6 overflow-y-auto flex-1">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-12 bg-muted rounded-lg mb-4">
                <TabsTrigger value="info" className="text-sm font-medium">Info Cliente</TabsTrigger>
                <TabsTrigger value="fatturazione" className="text-sm font-medium">Fatturazione</TabsTrigger>
                <TabsTrigger value="indirizzo" className="text-sm font-medium">Indirizzo</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <div>
                        <label className="text-sm">Nome</label>
                        <Input placeholder="Nome" {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <div>
                        <label className="text-sm">Telefono</label>
                        <Input placeholder="Telefono" {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <div>
                        <label className="text-sm">Email</label>
                        <Input placeholder="Email" {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="descrizione"
                    render={({ field }) => (
                      <div>
                        <label className="text-sm">Descrizione</label>
                        <Textarea placeholder="Descrizione cliente..." {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <div>
                        <label className="text-sm">Note</label>
                        <Textarea placeholder="Note aggiuntive sul cliente..." {...field} />
                      </div>
                    )}
                  />
                </div>
              </TabsContent>
              <TabsContent value="fatturazione" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    control={form.control}
                    name="intestazione_fattura"
                    render={({ field }) => (
                      <div>
                        <label className="text-sm">Intestazione Fattura</label>
                        <Input placeholder="Intestazione Fattura" {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="codice_fiscale"
                    render={({ field }) => (
                      <div>
                        <label className="text-sm">Codice Fiscale</label>
                        <Input placeholder="Codice Fiscale" {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="partita_iva"
                    render={({ field }) => (
                      <div>
                        <label className="text-sm">Partita IVA</label>
                        <Input placeholder="Partita IVA" {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="pec"
                    render={({ field }) => (
                      <div>
                        <label className="text-sm">PEC</label>
                        <Input placeholder="PEC" {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="codice_sdi"
                    render={({ field }) => (
                      <div>
                        <label className="text-sm">Codice SDI</label>
                        <Input placeholder="Codice SDI" {...field} />
                      </div>
                    )}
                  />
                </div>
              </TabsContent>
              <TabsContent value="indirizzo" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    control={form.control}
                    name="indirizzo_fatturazione"
                    render={({ field }) => (
                      <div>
                        <label className="text-sm">Indirizzo di Fatturazione</label>
                        <Input placeholder="Indirizzo di Fatturazione" {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="cap"
                    render={({ field }) => (
                      <div>
                        <label className="text-sm">CAP</label>
                        <Input placeholder="CAP" {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="citta"
                    render={({ field }) => (
                      <div>
                        <label className="text-sm">Città</label>
                        <Input placeholder="Città" {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="provincia"
                    render={({ field }) => (
                      <div>
                        <label className="text-sm">Provincia</label>
                        <Input placeholder="Provincia" {...field} />
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="nazione"
                    render={({ field }) => (
                      <div>
                        <label className="text-sm">Nazione</label>
                        <Input placeholder="Nazione" {...field} />
                      </div>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end items-center gap-4 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Chiudi</Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white focus:ring-2 focus:ring-violet-500 focus:ring-offset-2">Salva Modifiche</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditFormModal;
