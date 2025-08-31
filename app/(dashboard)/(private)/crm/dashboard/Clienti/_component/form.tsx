import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { getSalonId } from '@/utils/getSalonId';

const supabase = createClient();

const formSchema = z.object({
  nome: z.string().min(1, { message: "Il nome è obbligatorio." }),
  telefono: z.string().optional(),
  email: z.string().optional(),
  note: z.string().optional(),
  cap: z.string().optional(),
  citta: z.string().optional(),
  provincia: z.string().optional(),
  nazione: z.string().optional(),
  indirizzo_fatturazione: z.string().optional(),
  codice_sdi: z.string().optional(),
  pec: z.string().optional(),
  codice_fiscale: z.string().optional(),
  intestazione_fattura: z.string().optional(),
  partita_iva: z.string().optional(),
  descrizione: z.string().optional(),
});

export function CreateClientForm({
  setIsDialogOpen,
}: {
  setIsDialogOpen: (open: boolean) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      telefono: "",
      email: "",
      note: "",
      cap: "",
      citta: "",
      provincia: "",
      nazione: "Italia",
      indirizzo_fatturazione: "",
      codice_sdi: "",
      pec: "",
      codice_fiscale: "",
      intestazione_fattura: "",
      partita_iva: "",
      descrizione: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Utente non autenticato. Accesso richiesto.");
      setIsLoading(false);
      return;
    }
    
    // Usa getSalonId() che gestisce sia manager che membri del team
    console.log('[DEBUG] Recupero salon_id per user_id:', user.id);
    
    const salon_id = await getSalonId();
    
    if (!salon_id) {
      console.error('[ERROR] Impossibile determinare il salone di appartenenza.');
      alert('Impossibile determinare il salone di appartenenza.');
      setIsLoading(false);
      return;
    }
    
    console.log('[DEBUG] Inserimento cliente con salon_id:', salon_id);
    
    try {
      const { data: customerData, error: customerError } = await supabase.from("customers").insert([
        {
          nome: values.nome,
          telefono: values.telefono || null,
          email: values.email || null,
          note: values.note || null,
          cap: values.cap || null,
          citta: values.citta || null,
          provincia: values.provincia || null,
          nazione: values.nazione || null,
          indirizzo_fatturazione: values.indirizzo_fatturazione || null,
          codice_sdi: values.codice_sdi || null,
          pec: values.pec || null,
          codice_fiscale: values.codice_fiscale || null,
          intestazione_fattura: values.intestazione_fattura || null,
          partita_iva: values.partita_iva || null,
          descrizione: values.descrizione || null,
          user_id: user.id,
          salon_id: salon_id,
        },
      ]).select("id, customer_uuid");
      
      console.log('[DEBUG] Risposta Supabase inserimento cliente:', customerData, customerError);
      if (customerError) throw new Error(customerError.message);
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      alert("Errore: " + (error as any).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 bg-muted">
              <TabsTrigger value="info" className="text-sm font-medium">Info Cliente</TabsTrigger>
              <TabsTrigger value="fatturazione" className="text-sm font-medium">Fatturazione</TabsTrigger>
              <TabsTrigger value="indirizzo" className="text-sm font-medium">Indirizzo</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome del cliente" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Telefono" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Email" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descrizione"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrizione</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Descrizione cliente..." />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Note aggiuntive sul cliente..." />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="fatturazione" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="intestazione_fattura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intestazione Fattura</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Intestazione Fattura" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="codice_fiscale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice Fiscale</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Codice Fiscale" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="partita_iva"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partita IVA</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Partita IVA" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pec"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PEC</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="PEC" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="codice_sdi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Codice SDI</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Codice SDI" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="indirizzo" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="indirizzo_fatturazione"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Indirizzo di Fatturazione</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Indirizzo di Fatturazione" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CAP</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="CAP" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="citta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Città</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Città" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="provincia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Provincia" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nazione"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nazione</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nazione" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end items-center gap-4 pt-6 border-t border-gray-200">
            <Button 
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="px-6 py-2 text-sm font-medium"
              disabled={isLoading}
            >
              Chiudi
            </Button>
            <Button 
              type="submit" 
              className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salva Cliente"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
