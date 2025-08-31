import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/utils/supabase/client";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Settings, 
  DollarSign, 
  Clock, 
  Users, 
  Eye, 
  Tag, 
  FileText, 
  Zap,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

const supabase = createClient();

// Funzione aggiornata per normalizzare input numerico secondo formato internazionale
function normalizeNumberInput(value: string, formato_numero: string) {
  if (typeof value !== 'string') return value;
  let clean = value.trim();
  clean = clean.replace(/\s/g, '');
  if (formato_numero === 'it-IT' || formato_numero === 'de-DE') {
    clean = clean.replace(/\./g, '');
    clean = clean.replace(/,/g, '.');
  } else if (formato_numero === 'fr-FR') {
    clean = clean.replace(/,/g, '.');
  } else if (formato_numero === 'en-US') {
    clean = clean.replace(/,/g, '');
  }
  return clean;
}

interface TeamMember {
  id: string;
  name: string;
}

interface EditFormModalProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
  serviceId: number;
  onServiceUpdated?: () => void;
}

const bufferOptions = [0, 5, 10, 15];
const durationOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 205, 210, 215, 220, 225, 230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290, 295, 300];

const EditFormModal: React.FC<EditFormModalProps> = ({ isDialogOpen, setIsDialogOpen, serviceId, onServiceUpdated }) => {
  const [initialValues, setInitialValues] = useState<any>({
    name: "",
    category: "",
    description: "",
    price: 0,
    discounted_price: undefined,
    iva_included: true,
    duration: 0,
    buffer_after: 0,
    buffer_before: 0,
    max_clients: 1,
    team_members: [],
    visible_online: true,
    require_manual_confirm: false,
    tags: [],
    internal_notes: "",
    status: "Attivo",
    promo: false,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [ivaPercent, setIvaPercent] = useState<number | null>(null);
  const [fiscalSettings, setFiscalSettings] = useState<any>(null);

  useEffect(() => {
    const fetchServiceAndData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;
      
      // Usa getSalonId per ottenere il salon_id
      const { getSalonId } = await import('@/utils/getSalonId');
      const salonId = await getSalonId();
      if (!salonId) return;

      // Carica il servizio e i dati correlati in parallelo
      const [serviceResult, membersResult, categoriesResult, fiscalResult] = await Promise.all([
        supabase.from("services").select("*").eq("id", serviceId).single(),
        supabase.from('team').select('id, name').eq('salon_id', salonId),
        supabase.from('service_categories').select('name').eq('salon_id', salonId),
        supabase.from('dati_azienda').select('*').eq('user_id', user.id).eq('salon_id', salonId).single()
      ]);

      // Gestisci i risultati
      if (serviceResult.data && !serviceResult.error) {
        setInitialValues((prev: any) => ({ ...prev, ...serviceResult.data }));
      }

      if (membersResult.data) {
        setTeamMembers(membersResult.data);
      }

      // Gestisci le categorie
      if (categoriesResult.error) {
        console.warn('Errore nel caricamento delle categorie:', categoriesResult.error);
        // Fallback: carica categorie dai servizi esistenti
        const { data: servicesData } = await supabase
          .from('services')
          .select('category')
          .eq('salon_id', salonId)
          .not('category', 'is', null);
        
        if (servicesData) {
          const uniqueCategories = [...new Set(servicesData.map(s => s.category).filter(Boolean))];
          setCategories(uniqueCategories);
        } else {
          setCategories([]);
        }
             } else if (categoriesResult.data) {
         const categoryNames = categoriesResult.data.map((c: { name: string }) => c.name);
         setCategories(categoryNames);
         
         // Aggiungi la categoria del servizio se non è presente
         if (serviceResult.data?.category && !categoryNames.includes(serviceResult.data.category)) {
           setCategories(prev => [...prev, serviceResult.data.category]);
         }
       }

      if (fiscalResult.data) {
        setIvaPercent(fiscalResult.data.percentualetassa);
        setFiscalSettings(fiscalResult.data);
      }
    };

    if (serviceId) {
      fetchServiceAndData();
    }
  }, [serviceId]);

  // Schema Yup con transform per normalizzare input numerico
  const formato = fiscalSettings?.formato_numero || 'it-IT';
  const validationSchema = Yup.object({
    name: Yup.string().required("Il nome è obbligatorio"),
    category: Yup.string().optional(),
    description: Yup.string().optional(),
    price: Yup.number()
      .transform(function (value, originalValue) {
        if (typeof originalValue === 'string') {
          const norm = normalizeNumberInput(originalValue, formato);
          return parseFloat(norm);
        }
        return value;
      })
      .min(0, "Il prezzo non può essere negativo")
      .required("Il prezzo è obbligatorio"),
    discounted_price: Yup.number()
      .transform(function (value, originalValue) {
        if (typeof originalValue === 'string') {
          const norm = normalizeNumberInput(originalValue, formato);
          return norm === '' || norm === '0' ? undefined : parseFloat(norm);
        }
        return value === '' || value === 0 ? undefined : value;
      })
      .min(0, "Il prezzo scontato non può essere negativo")
      .nullable()
      .optional(),
    iva_included: Yup.boolean().optional(),
    duration: Yup.number().min(0, "La durata non può essere negativa").required("La durata è obbligatoria"),
    buffer_after: Yup.number().optional(),
    buffer_before: Yup.number().optional(),
    max_clients: Yup.number().optional(),
    team_members: Yup.array().of(Yup.string()).optional(),
    visible_online: Yup.boolean().optional(),
    require_manual_confirm: Yup.boolean().optional(),
    tags: Yup.array().of(Yup.string()).optional(),
    internal_notes: Yup.string().optional(),
    status: Yup.string().required("Lo stato è obbligatorio"),
    promo: Yup.boolean().optional(),
  });

  // Funzione per formattare il prezzo secondo le impostazioni fiscali
  const formatPrice = (basePrice: number) => {
    let valuta = 'EUR';
    let formato_numero = 'it-IT';
    let numero_decimali = 2;
    let mostra_valuta_simbolo = true;
    
    if (fiscalSettings) {
      valuta = fiscalSettings.valuta ?? 'EUR';
      formato_numero = fiscalSettings.formato_numero ?? 'it-IT';
      numero_decimali = fiscalSettings.numero_decimali ?? 2;
      mostra_valuta_simbolo = fiscalSettings.mostra_valuta_simbolo ?? true;
    }
    
    // Formattazione semplice senza calcoli IVA
    const formatter = new Intl.NumberFormat(formato_numero, {
      style: mostra_valuta_simbolo ? 'currency' : 'decimal',
      currency: valuta,
      minimumFractionDigits: numero_decimali,
      maximumFractionDigits: numero_decimali,
    });
    return formatter.format(basePrice);
  };

  const handleSubmit = async (values: { [key: string]: any }) => {
    try {
      const formato_numero = fiscalSettings?.formato_numero || 'it-IT';
      const normalizedPrice =
        typeof values.price === 'number'
          ? values.price
          : parseFloat(normalizeNumberInput(values.price?.toString() || '', formato_numero));
      const normalizedDiscounted =
        values.discounted_price === undefined || values.discounted_price === '' || values.discounted_price === 0
          ? null
          : (typeof values.discounted_price === 'number'
              ? values.discounted_price
              : parseFloat(normalizeNumberInput(values.discounted_price?.toString() || '', formato_numero))
            );
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        // ...gestione errore...
        return;
      }
      
      // Usa getSalonId per ottenere il salon_id
      const { getSalonId } = await import('@/utils/getSalonId');
      const salonId = await getSalonId();
      if (!salonId) {
        // ...gestione errore...
        return;
      }
      const { error } = await supabase.from("services").update({
        ...values,
        price: normalizedPrice,
        discounted_price: normalizedDiscounted,
        salon_id: salonId
      }).eq("id", serviceId);
      if (!error) {
        setIsDialogOpen(false);
        // Chiama il callback per aggiornare la lista dei servizi
        if (onServiceUpdated) {
          onServiceUpdated();
        }
      }
    } catch (e) {
      // ...gestione errore...
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-4xl h-[85vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <Zap className="h-5 w-5 text-blue-600" />
            Modifica Servizio
          </DialogTitle>
        </DialogHeader>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, setFieldValue, errors, touched }) => {
            // Calcolo semplice senza IVA
            const prezzoBase = parseFloat(normalizeNumberInput(values.price?.toString() || '', formato));
            const prezzoSconto = parseFloat(normalizeNumberInput(values.discounted_price?.toString() || '', formato));
            const hasSconto = !isNaN(prezzoSconto) && values.discounted_price !== undefined && values.discounted_price !== '' && prezzoSconto > 0;
            const totaleFinale = !isNaN(prezzoBase) ? (hasSconto ? Math.max(0, prezzoBase - prezzoSconto) : prezzoBase) : null;
            const risparmio = hasSconto && !isNaN(prezzoBase) ? prezzoSconto : null;
            
            return (
            <Form className="flex flex-col h-full">
              <div className="flex-1 min-h-0 px-6 py-4">
                <div className="h-full overflow-y-auto pr-2">
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-6 sticky top-0 bg-white z-10">
                      <TabsTrigger value="basic" className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Informazioni Base
                      </TabsTrigger>
                      <TabsTrigger value="pricing" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Prezzo & Durata
                      </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Informazioni Base */}
                    <TabsContent value="basic" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Dettagli Servizio
                          </CardTitle>
                          <CardDescription>
                            Modifica le informazioni principali del servizio
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="name" className="flex items-center gap-2">
                                Nome Servizio
                                <Badge variant="destructive" className="text-xs">Obbligatorio</Badge>
                              </Label>
                              <Field name="name" as={Input} placeholder="Es. Taglio e Piega" className="h-10" />
                              <ErrorMessage name="name">
                                {msg => msg && (
                                  <div className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {msg}
                                  </div>
                                )}
                              </ErrorMessage>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="category">Categoria</Label>
                              <Select
                                value={showNewCategoryInput ? "__new__" : (values.category || "")}
                                onValueChange={value => {
                                  if (value === "__new__") {
                                    setShowNewCategoryInput(true);
                                    setFieldValue("category", "");
                                  } else {
                                    setShowNewCategoryInput(false);
                                    setFieldValue("category", value);
                                  }
                                }}
                              >
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder="Seleziona categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.length > 0 ? (
                                    categories.map(cat => (
                                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))
                                  ) : (
                                    <div className="px-2 py-1 text-sm text-gray-500">
                                      Nessuna categoria disponibile
                                    </div>
                                  )}
                                  <SelectItem value="__new__">+ Nuova categoria...</SelectItem>
                                </SelectContent>
                              </Select>
                              {showNewCategoryInput && (
                                <Field name="category" as={Input} placeholder="Nuova categoria" className="h-10 mt-2" />
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Descrizione</Label>
                            <Field name="description" as={Textarea} 
                              placeholder="Descrivi brevemente il servizio offerto..." 
                              className="min-h-[80px] resize-none" 
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Tab 2: Prezzo & Durata */}
                    <TabsContent value="pricing" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Configurazione Prezzi
                          </CardTitle>
                          <CardDescription>
                            Modifica prezzi e durata del servizio
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="duration" className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Durata
                                <Badge variant="destructive" className="text-xs">Obbligatorio</Badge>
                              </Label>
                              <Select value={values.duration?.toString()} onValueChange={(value) => setFieldValue('duration', parseInt(value))}>
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder="Seleziona durata" />
                                </SelectTrigger>
                                <SelectContent>
                                  {durationOptions.map(opt => (
                                    <SelectItem key={opt} value={opt.toString()}>
                                      {opt} minuti
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <ErrorMessage name="duration">
                                {msg => msg && (
                                  <div className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {msg}
                                  </div>
                                )}
                              </ErrorMessage>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="price" className="flex items-center gap-2">
                                Prezzo Base
                                <Badge variant="destructive" className="text-xs">Obbligatorio</Badge>
                              </Label>
                              <div className="relative">
                                <Field
                                  name="price"
                                  as={Input}
                                  placeholder="0.00"
                                  className="h-10 pl-3"
                                  step="0.01"
                                  type="text"
                                  value={typeof values.price === 'number' ? new Intl.NumberFormat(fiscalSettings?.formato_numero || 'it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(values.price) : values.price}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setFieldValue('price', e.target.value);
                                  }}
                                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                    const formato_numero = fiscalSettings?.formato_numero || 'it-IT';
                                    const norm = normalizeNumberInput(e.target.value, formato_numero);
                                    const num = parseFloat(norm);
                                    if (!isNaN(num)) {
                                      setFieldValue('price', new Intl.NumberFormat(formato_numero, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num));
                                    } else {
                                      setFieldValue('price', '');
                                    }
                                  }}
                                />
                                {fiscalSettings && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 text-lg select-none">
                                    {new Intl.NumberFormat(fiscalSettings.formato_numero || 'it-IT', { style: 'currency', currency: fiscalSettings.valuta || 'EUR' }).formatToParts(0).find(p => p.type === 'currency')?.value}
                                  </span>
                                )}
                              </div>
                              <ErrorMessage name="price">
                                {msg => msg && (
                                  <div className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {msg}
                                  </div>
                                )}
                              </ErrorMessage>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="discounted_price">Sconto <span className="text-xs text-gray-500">(opzionale, da sottrarre al prezzo base)</span></Label>
                              <div className="relative">
                                <Field
                                  name="discounted_price"
                                  as={Input}
                                  placeholder="0.00"
                                  className="h-10 pl-3"
                                  step="0.01"
                                  type="text"
                                  value={typeof values.discounted_price === 'number' ? new Intl.NumberFormat(fiscalSettings?.formato_numero || 'it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(values.discounted_price) : values.discounted_price}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setFieldValue('discounted_price', e.target.value);
                                  }}
                                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                    const formato_numero = fiscalSettings?.formato_numero || 'it-IT';
                                    const norm = normalizeNumberInput(e.target.value, formato_numero);
                                    const num = parseFloat(norm);
                                    if (!isNaN(num)) {
                                      setFieldValue('discounted_price', new Intl.NumberFormat(formato_numero, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num));
                                    } else {
                                      setFieldValue('discounted_price', undefined);
                                    }
                                  }}
                                />
                                {fiscalSettings && (
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 text-lg select-none">
                                    {new Intl.NumberFormat(fiscalSettings.formato_numero || 'it-IT', { style: 'currency', currency: fiscalSettings.valuta || 'EUR' }).formatToParts(0).find(p => p.type === 'currency')?.value}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="space-y-1">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                  Prezzo IVA inclusa
                                </Label>
                                <p className="text-xs text-gray-500">
                                  Il prezzo inserito include sempre l'IVA.
                                </p>
                              </div>
                              <Switch
                                checked={values.iva_included}
                                onCheckedChange={(checked) => setFieldValue('iva_included', checked)}
                                disabled={true}
                              />
                            </div>
                          </div>
                          {/* Totale finale e risparmio */}
                          {risparmio !== null && risparmio > 0 && (
                            <div className="text-xs text-green-700 mt-1">
                              Risparmio per il cliente: <span className="font-semibold">{formatPrice(risparmio)}</span>
                            </div>
                          )}
                          {totaleFinale !== null && (
                            <div className="mt-8 border-t pt-4 flex flex-col items-end">
                              <div className="text-lg font-bold text-blue-700 flex items-center gap-2">
                                Totale Finale da pagare:&nbsp;
                                <span className="text-2xl">
                                  {formatPrice(totaleFinale)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                Totale da pagare (IVA inclusa)
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              <Separator className="flex-shrink-0" />
              <div className="flex justify-between items-center px-6 py-4 bg-gray-50 flex-shrink-0">
                <div className="text-sm text-gray-500">
                  Tutti i campi contrassegnati sono obbligatori
                </div>
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="px-6"
                  >
                    Annulla
                  </Button>
                  <Button 
                    type="submit" 
                    className="px-6 bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Salva Servizio
                  </Button>
                </div>
              </div>
            </Form>
          );
          }}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default EditFormModal;
