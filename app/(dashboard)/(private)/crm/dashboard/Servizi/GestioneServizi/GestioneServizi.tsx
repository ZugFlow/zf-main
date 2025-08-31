import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PencilIcon,
  TrashIcon,
  X,
  Clock,
  Calendar,
  Tag,
  Info,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
  Search,
  Settings,
  ChevronDown,
  Edit,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import FormModal from "./_component/FormModalServices";
import EditFormModal from "./_component/EditFormModalServices";
import OnlineBookingToggle from "./_component/OnlineBookingToggle";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
} from "date-fns";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocalization } from '@/hooks/useLocalization';

interface Service {
  id: number;
  name: string;
  category: string | null;
  price: number;
  duration: number;
  type: string | null;
  description: string | null;
  status: string;
  promo: boolean | null;
  date_added: string;
  user_id: string;
  salon_id: string; // aggiunto per coerenza con la tabella services
  online_booking_enabled?: boolean; // nuovo campo per prenotazioni online
}

interface ServiceCategory {
  id: number;
  name: string;
  salon_id: string;
  created_at: string | null;
  updated_at: string | null;
}

interface SortConfig {
  key: keyof Service;
  direction: "asc" | "desc";
}

const supabase = createClient();

const GestioneServizi = () => {
  const { t, formatDate, formatCurrency, currentLanguage } = useLocalization();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filters, setFilters] = useState({
    searchTerm: "",
    priceRange: { min: 0, max: 1000 },
    status: "all",
  });
  const [showSidebar, setShowSidebar] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [pendingCategoryServiceId, setPendingCategoryServiceId] = useState<number | null>(null);
  const [newCategoryLoading, setNewCategoryLoading] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [fiscalSettings, setFiscalSettings] = useState<any>(null);
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [categoryUsageCount, setCategoryUsageCount] = useState<Record<string, number>>({});
  let subscription: RealtimeChannel;

  // Carica le categorie dalla tabella service_categories per il salon_id corrente
  const fetchCategories = async (salonId: string) => {
    const { data, error } = await supabase
      .from("service_categories")
      .select("*")
      .eq("salon_id", salonId)
      .order("name");
    
    if (error) {
      console.warn('Errore nel caricamento delle categorie:', error);
      // Fallback: carica categorie dai servizi esistenti
      const { data: servicesData } = await supabase
        .from("services")
        .select("category")
        .eq("salon_id", salonId)
        .not("category", "is", null);
      
      if (servicesData) {
        const uniqueCategories = [...new Set(servicesData.map(s => s.category).filter(Boolean))];
        setCategories(uniqueCategories);
        setServiceCategories([]);
      } else {
        setCategories([]);
        setServiceCategories([]);
      }
    } else if (data) {
      setServiceCategories(data);
      setCategories(data.map((c: ServiceCategory) => c.name));
    } else {
      setCategories([]);
      setServiceCategories([]);
    }
  };

  // Conta quanti servizi usano ogni categoria
  const fetchCategoryUsage = async (salonId: string) => {
    const { data, error } = await supabase
      .from("services")
      .select("category")
      .eq("salon_id", salonId)
      .not("category", "is", null);
    
    if (!error && data) {
      const usageCount: Record<string, number> = {};
      data.forEach(service => {
        if (service.category) {
          usageCount[service.category] = (usageCount[service.category] || 0) + 1;
        }
      });
      setCategoryUsageCount(usageCount);
    }
  };

  // Recupera impostazioni fiscali da dati_azienda
  const fetchFiscalSettings = async (userId: string, salonId: string) => {
    const { data, error } = await supabase
      .from("dati_azienda")
      .select("*")
      .eq("user_id", userId)
      .eq("salon_id", salonId)
      .single();
    if (!error && data) setFiscalSettings(data);
  };

  // Modifica fetchservices per caricare anche le categorie
  const fetchservices = async () => {
    try {
      setLoading(true);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;
      if (userError || !user) throw new Error("Utente non autenticato");

      // Importa getSalonId dinamicamente per ottenere il salon_id
      const { getSalonId } = await import('@/utils/getSalonId');
      const salonId = await getSalonId();
      
      if (!salonId) throw new Error("Nessun salon_id associato al profilo utente");

      // Carica i servizi associati al salon_id
      const { data, error: fetchError } = await supabase
        .from("services")
        .select("*")
        .eq("salon_id", salonId);
      if (fetchError) throw fetchError;
      setServices(data || []);

      // Carica le categorie
      await fetchCategories(salonId);
      // Carica il conteggio di utilizzo delle categorie
      await fetchCategoryUsage(salonId);
      // Carica impostazioni fiscali
      await fetchFiscalSettings(user.id, salonId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nel caricamento dei servizi");
      toast({
        title: "Errore",
        description: "Impossibile caricare i servizi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchservices();
    setupRealtimeSubscription();
    
    return () => { 
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedServiceId !== null) {
      setShowSidebar(true);
    } else {
      setShowSidebar(false);
    }
  }, [selectedServiceId]);

  const setupRealtimeSubscription = () => {
    subscription = supabase
      .channel("public:services")
      .on("postgres_changes", { event: "*", schema: "public", table: "services" },
        (payload) => {
          console.log('Realtime event received:', payload);
          // Ricarica immediatamente i servizi quando ci sono cambiamenti
          fetchservices();
        }
      )
      .subscribe();
  };

  const filteredServices = React.useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        service.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (service.category?.toLowerCase() || '').includes(filters.searchTerm.toLowerCase());
      const matchesPrice =
        service.price >= filters.priceRange.min &&
        service.price <= filters.priceRange.max;
      const matchesCategory =
        filterCategory === "all" || service.category === filterCategory;
      const matchesStatus = filters.status === "all" || service.status === filters.status;

      return matchesSearch && matchesPrice && matchesCategory && matchesStatus;
    });
  }, [services, filters, filterCategory]);

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Successo",
        description: "Servizio eliminato correttamente",
      });
      
      // Ricarica i servizi dopo l'eliminazione
      fetchservices();
    } catch (err) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il servizio",
        variant: "destructive",
      });
    }
  };

  // Funzione per aggiornare la categoria di un servizio
  const handleChangeCategory = async (serviceId: number, newCategory: string) => {
    try {
      // Prima assicuriamoci che la categoria esista nella tabella service_categories
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error("Utente non autenticato");
      
      // Usa getSalonId per ottenere il salon_id
      const { getSalonId } = await import('@/utils/getSalonId');
      const salonId = await getSalonId();
      if (!salonId) throw new Error("Nessun salon_id associato al profilo utente");

      // Verifica se la categoria esiste già, altrimenti la crea
      const { data: existingCategory } = await supabase
        .from("service_categories")
        .select("id")
        .eq("name", newCategory)
        .eq("salon_id", salonId)
        .single();

      if (!existingCategory) {
        // Crea la categoria se non esiste
        const { error: insertError } = await supabase
          .from("service_categories")
          .insert([{ name: newCategory, salon_id: salonId }]);
        
        if (insertError && insertError.code !== "23505") {
          console.warn('Errore nella creazione categoria:', insertError);
        }
      }

      // Aggiorna il servizio
      const { error } = await supabase
        .from("services")
        .update({ category: newCategory })
        .eq("id", serviceId);
      if (error) throw error;

      // Aggiorna lo stato locale senza ricaricare tutto
      const oldCategory = services.find(s => s.id === serviceId)?.category;
      
      // Aggiorna il servizio localmente
      setServices(prev => 
        prev.map(s => 
          s.id === serviceId 
            ? { ...s, category: newCategory }
            : s
        )
      );

      // Aggiorna il conteggio di utilizzo
      setCategoryUsageCount(prev => {
        const newCount = { ...prev };
        if (oldCategory) {
          newCount[oldCategory] = Math.max(0, (newCount[oldCategory] || 0) - 1);
        }
        newCount[newCategory] = (newCount[newCategory] || 0) + 1;
        return newCount;
      });

      // Aggiungi la categoria alla lista se non è presente
      if (!categories.includes(newCategory)) {
        setCategories(prev => [...prev, newCategory]);
      }

      toast({
        title: "Categoria aggiornata",
        description: `La categoria è stata cambiata in "${newCategory}"`,
      });
    } catch (err) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la categoria",
        variant: "destructive",
      });
    }
  };

  // Funzione per creare una nuova categoria e assegnarla al servizio
  const handleCreateCategoryAndAssign = async (categoryName: string) => {
    if (!categoryName.trim() || !pendingCategoryServiceId) return false;
    setNewCategoryLoading(true);
    try {
      // Recupera il salon_id dal servizio selezionato
      const service = services.find(s => s.id === pendingCategoryServiceId);
      if (!service) throw new Error("Servizio non trovato");
      // Recupera il salon_id dal servizio se presente, altrimenti usa getSalonId
      let salonId: string | null = service.salon_id;
      if (!salonId) {
        const { getSalonId } = await import('@/utils/getSalonId');
        salonId = await getSalonId();
        if (!salonId) throw new Error("Nessun salon_id associato al profilo utente");
      }
      // Inserisci la nuova categoria nella tabella service_categories con salon_id
      const { data: newCategory, error: insertError } = await supabase
        .from("service_categories")
        .insert([{ name: categoryName.trim(), salon_id: salonId }])
        .select()
        .single();
      
      // Se la tabella service_categories non esiste, ignora l'errore e procedi
      if (insertError && insertError.code !== "23505" && !insertError.message.includes("does not exist")) {
        console.warn('Errore nell\'inserimento categoria:', insertError);
        // Non lanciare l'errore, procedi con l'aggiornamento del servizio
      }

      // Aggiorna la colonna category nella tabella services
      const { error: updateError } = await supabase
        .from("services")
        .update({ category: categoryName.trim() })
        .eq("id", pendingCategoryServiceId);
      if (updateError) throw updateError;

      // Aggiorna lo stato locale senza ricaricare tutto
      if (newCategory) {
        setServiceCategories(prev => [...prev, newCategory]);
        setCategories(prev => [...prev, categoryName.trim()]);
        setCategoryUsageCount(prev => ({
          ...prev,
          [categoryName.trim()]: 1
        }));
      }

      // Aggiorna il servizio localmente
      setServices(prev => 
        prev.map(s => 
          s.id === pendingCategoryServiceId 
            ? { ...s, category: categoryName.trim() }
            : s
        )
      );

      toast({
        title: "Categoria creata",
        description: `La categoria "${categoryName.trim()}" è stata creata e assegnata.`,
      });
      setIsNewCategoryModalOpen(false);
      setPendingCategoryServiceId(null);
      setNewCategoryLoading(false);
      return true;
    } catch (err) {
      toast({
        title: "Errore",
        description: "Impossibile creare la categoria",
        variant: "destructive",
      });
      setNewCategoryLoading(false);
      return false;
    }
  };

  // Funzione per creare una nuova categoria generale (non assegnata a un servizio specifico)
  const handleCreateCategory = async (categoryName: string) => {
    if (!categoryName.trim()) return false;
    setNewCategoryLoading(true);
    try {
      // Usa getSalonId per ottenere il salon_id
      const { getSalonId } = await import('@/utils/getSalonId');
      const salonId = await getSalonId();
      if (!salonId) throw new Error("Nessun salon_id associato al profilo utente");
      
      // Inserisci la nuova categoria nella tabella service_categories
      const { data: newCategory, error: insertError } = await supabase
        .from("service_categories")
        .insert([{ name: categoryName.trim(), salon_id: salonId }])
        .select()
        .single();
      
      // Se la tabella service_categories non esiste, ignora l'errore
      if (insertError && insertError.code !== "23505" && !insertError.message.includes("does not exist")) {
        console.warn('Errore nell\'inserimento categoria:', insertError);
      }

      // Aggiorna lo stato locale senza ricaricare tutto
      if (newCategory) {
        setServiceCategories(prev => [...prev, newCategory]);
        setCategories(prev => [...prev, categoryName.trim()]);
        setCategoryUsageCount(prev => ({
          ...prev,
          [categoryName.trim()]: 0
        }));
      }

      toast({
        title: "Categoria creata",
        description: `La categoria "${categoryName.trim()}" è stata creata con successo.`,
      });
      setNewCategoryLoading(false);
      return true;
    } catch (err) {
      toast({
        title: "Errore",
        description: "Impossibile creare la categoria",
        variant: "destructive",
      });
      setNewCategoryLoading(false);
      return false;
    }
  };

  // Funzione per aggiornare una categoria esistente
  const handleUpdateCategory = async (categoryId: number, newName: string) => {
    if (!newName.trim()) return false;
    setNewCategoryLoading(true);
    try {
      const { error } = await supabase
        .from("service_categories")
        .update({ name: newName.trim() })
        .eq("id", categoryId);
      
      if (error) throw error;

      // Aggiorna anche tutti i servizi che usano questa categoria
      const oldCategory = serviceCategories.find(c => c.id === categoryId)?.name;
      if (oldCategory) {
        const { error: updateServicesError } = await supabase
          .from("services")
          .update({ category: newName.trim() })
          .eq("category", oldCategory);
        
        if (updateServicesError) {
          console.warn('Errore nell\'aggiornamento dei servizi:', updateServicesError);
        }
      }

      // Aggiorna lo stato locale senza ricaricare tutto
      setServiceCategories(prev => 
        prev.map(cat => 
          cat.id === categoryId 
            ? { ...cat, name: newName.trim() }
            : cat
        )
      );
      
      setCategories(prev => 
        prev.map(cat => 
          cat === oldCategory 
            ? newName.trim()
            : cat
        )
      );

      // Aggiorna i servizi localmente
      setServices(prev => 
        prev.map(service => 
          service.category === oldCategory 
            ? { ...service, category: newName.trim() }
            : service
        )
      );

      // Aggiorna il conteggio di utilizzo
      setCategoryUsageCount(prev => {
        const newCount = { ...prev };
        if (oldCategory) {
          const count = newCount[oldCategory] || 0;
          delete newCount[oldCategory];
          newCount[newName.trim()] = count;
        }
        return newCount;
      });

      toast({
        title: "Categoria aggiornata",
        description: `La categoria è stata rinominata in "${newName.trim()}"`,
      });
      setEditingCategoryId(null);
      setEditingCategoryName("");
      setNewCategoryLoading(false);
      return true;
    } catch (err) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la categoria",
        variant: "destructive",
      });
      setNewCategoryLoading(false);
      return false;
    }
  };

  // Funzione per eliminare una categoria
  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    // Verifica se ci sono servizi che usano questa categoria
    const usageCount = categoryUsageCount[categoryName] || 0;
    if (usageCount > 0) {
      toast({
        title: "Impossibile eliminare",
        description: `Questa categoria è utilizzata da ${usageCount} servizio${usageCount > 1 ? 'i' : ''}. Rimuovi prima i servizi associati.`,
        variant: "destructive",
      });
      return false;
    }

    setNewCategoryLoading(true);
    try {
      const { error } = await supabase
        .from("service_categories")
        .delete()
        .eq("id", categoryId);
      
      if (error) throw error;

      // Aggiorna lo stato locale senza ricaricare tutto
      setServiceCategories(prev => 
        prev.filter(cat => cat.id !== categoryId)
      );
      
      setCategories(prev => 
        prev.filter(cat => cat !== categoryName)
      );

      // Aggiorna il conteggio di utilizzo
      setCategoryUsageCount(prev => {
        const newCount = { ...prev };
        delete newCount[categoryName];
        return newCount;
      });

      toast({
        title: "Categoria eliminata",
        description: `La categoria "${categoryName}" è stata eliminata con successo.`,
      });
      setNewCategoryLoading(false);
      return true;
    } catch (err) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare la categoria",
        variant: "destructive",
      });
      setNewCategoryLoading(false);
      return false;
    }
  };

  // Funzione per formattare il prezzo secondo le impostazioni fiscali
  const formatPrice = (basePrice: number) => {
    // Usa sempre Intl.NumberFormat, anche se le impostazioni non sono ancora caricate
    const price = basePrice;
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
    
    // Formattazione semplice senza calcoli IVA (come in FormModalServices.tsx)
    // Il prezzo salvato nel database include già l'IVA
    const formatter = new Intl.NumberFormat(formato_numero, {
      style: mostra_valuta_simbolo ? 'currency' : 'decimal',
      currency: valuta,
      minimumFractionDigits: numero_decimali,
      maximumFractionDigits: numero_decimali,
    });
    return formatter.format(price);
  };

  // Funzioni per il sistema Apple-style mobile
  const handleCardClick = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    // Su mobile, apri a tutto schermo
    if (window.innerWidth < 1024) {
      setIsMobileFullscreen(true);
    }
  };

  const handleCloseMobileFullscreen = () => {
    setIsMobileFullscreen(false);
    setSelectedServiceId(null);
    setDragY(0);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.y > 100) {
      // Se trascinato più di 100px verso il basso, chiudi
      handleCloseMobileFullscreen();
    } else {
      // Altrimenti, torna alla posizione originale
      setDragY(0);
    }
  };

  const handleDrag = (event: any, info: PanInfo) => {
    setDragY(info.offset.y);
  };

  if (loading) return <div className="flex justify-center items-center h-screen">{t('services.loading', 'Caricamento...')}</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Navbar secondaria servizi - ottimizzata per mobile */}
      <div className="sticky top-0 z-30 bg-background border-b border-border shadow-sm">
        <div className="px-3 sm:px-4 py-3 bg-white h-auto min-h-16 border-b border-gray-200 flex-none">
          {/* Header principale - responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
            {/* Sezione sinistra */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              {/* Titolo principale */}
              <h1 className="text-lg font-bold text-gray-800">{t('services.management.title', 'Gestione Servizi')}</h1>
              
              {/* Controlli filtro e ricerca - stack su mobile */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Filtro categorie con stile moderno */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer px-3 py-2 h-9 rounded-lg transition-all duration-200 bg-gray-50 hover:bg-gray-100 min-w-0">
                      <Filter className="h-4 w-4 text-gray-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {filterCategory === "all" ? t('services.filters.all_categories', 'Tutte le categorie') : filterCategory}
                      </span>
                      <Badge 
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0.5 text-xs font-medium flex-shrink-0"
                      >
                        {categories.length}
                      </Badge>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[280px] sm:w-[250px]">
                    <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                      <h3 className="font-bold text-gray-900">{t('services.filters.filter_by_category', 'Filtra per categoria')}</h3>
                      <p className="text-xs text-gray-600 mt-1">{t('services.filters.select_category_description', 'Seleziona una categoria per filtrare i servizi')}</p>
                    </div>
                    <div className="p-2">
                      <DropdownMenuItem
                        onSelect={() => setFilterCategory("all")}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                          filterCategory === "all" ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50'
                        }`}
                      >
                        <Tag className="h-4 w-4" />
                        <span className="flex-1 font-medium">{t('services.filters.all_categories', 'Tutte le categorie')}</span>
                        <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
                          {services.length}
                        </Badge>
                      </DropdownMenuItem>
                      {categories.map((cat) => (
                        <DropdownMenuItem
                          key={cat}
                          onSelect={() => setFilterCategory(cat)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                            filterCategory === cat ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50'
                          }`}
                        >
                          <Tag className="h-4 w-4" />
                          <span className="flex-1 font-medium">{cat}</span>
                          <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
                            {services.filter(s => s.category === cat).length}
                          </Badge>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Barra di ricerca con stile moderno - responsive */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t('services.search.placeholder', 'Cerca servizi...')}
                    className="pl-10 pr-4 h-9 w-full sm:w-80 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-all duration-200"
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Pulsanti azioni - ottimizzati per mobile */}
            <div className="flex items-center gap-2 sm:gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setModalOpen(true)}
                      className="flex items-center justify-center p-2 h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="center">
                    <span className="text-xs">{t('services.actions.new_service', 'Nuovo Servizio')}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreateCategoryModalOpen(true)}
                      className="flex items-center justify-center p-2 h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="center">
                    <span className="text-xs">{t('services.actions.new_category', 'Nuova Categoria')}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center justify-center p-2 h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="center">
                    <span className="text-xs">{t('services.actions.settings', 'Impostazioni')}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Main content: grid + dettaglio - ottimizzato per mobile */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Main: Grid servizi organizzati per categoria */}
        <main className="flex-1 overflow-auto p-2 sm:p-4 md:p-6">
          <div className="space-y-6 sm:space-y-8">
            {/* Raggruppa servizi per categoria */}
            {(() => {
              const groupedServices = filteredServices.reduce((acc, service) => {
                const category = service.category || 'Senza categoria';
                if (!acc[category]) {
                  acc[category] = [];
                }
                acc[category].push(service);
                return acc;
              }, {} as Record<string, Service[]>);

              return Object.entries(groupedServices).map(([category, categoryServices]) => (
                <div key={category} className="space-y-3 sm:space-y-4">
                  {/* Header categoria - responsive */}
                  <div className="flex items-center gap-2 sm:gap-3 pb-2 border-b border-gray-200">
                    <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                      <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{category}</h2>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm">
                      {categoryServices.length} {t('services.category.services_count', 'servizi')}
                    </Badge>
                  </div>

                  {/* Grid servizi per categoria - responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {categoryServices.map((service) => (
                      <motion.div
                        layout
                        key={service.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                        className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100
                          ${selectedServiceId === service.id ? 'ring-2 ring-purple-500 shadow-lg' : 'hover:border-gray-200'} 
                          p-3 sm:p-4 cursor-pointer`}
                        onClick={() => {
                          handleCardClick(service.id);
                        }}
                      >
                        <div className="relative">
                          {service.promo && (
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 sm:px-3 py-1 text-xs font-semibold rounded-bl-xl shadow-sm">
                              Promo
                            </div>
                          )}
                          
                          {/* Header card - ottimizzato per mobile */}
                          <div className="mb-2 sm:mb-3">
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 line-clamp-1">{service.name}</h3>
                            
                            {/* Badge stato */}
                            <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                              <Badge
                                variant={service.status === "active" ? "default" : "secondary"}
                                className={`text-xs flex items-center gap-1 font-medium ${
                                  service.status === "active"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-gray-50 text-gray-600 border-gray-200"
                                }`}
                              >
                                {service.status === "active" ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                {service.status}
                              </Badge>
                            </div>
                          </div>

                          {/* Contenuto principale - responsive */}
                          <div className="space-y-2 sm:space-y-3">
                            {/* Prezzo e durata - ottimizzato per mobile */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 sm:gap-2 text-gray-600 bg-gray-50 px-2 sm:px-3 py-1 rounded-lg">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs sm:text-sm font-medium">{service.duration}{t('services.details.minutes', 'm')}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm sm:text-lg font-bold text-gray-900">
                                  {formatPrice(service.price)}
                                </div>
                              </div>
                            </div>

                            {/* Descrizione - responsive */}
                            {service.description && (
                              <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 bg-gray-50 p-2 sm:p-3 rounded-lg">
                                {service.description}
                              </p>
                            )}

                            {/* Azioni - ottimizzate per mobile */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedServiceId(service.id);
                                          setEditModalOpen(true);
                                        }}
                                        aria-label="Modifica servizio"
                                      >
                                        <PencilIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" align="center">
                                      <span className="text-xs">{t('services.actions.edit_service', 'Modifica servizio')}</span>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(service.id);
                                        }}
                                        aria-label="Elimina servizio"
                                      >
                                        <TrashIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" align="center">
                                      <span className="text-xs">{t('services.actions.delete_service', 'Elimina servizio')}</span>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>

                            {/* Toggle Prenotazione Online */}
                            <div className="pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                              <OnlineBookingToggle
                                serviceId={service.id}
                                initialValue={service.online_booking_enabled ?? true}
                                onToggle={(enabled) => {
                                  // Aggiorna lo stato locale
                                  setServices(prev => prev.map(s => 
                                    s.id === service.id 
                                      ? { ...s, online_booking_enabled: enabled }
                                      : s
                                  ));
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </main>

        {/* Sidebar: Dettaglio servizio - ottimizzata per mobile */}
        <aside
          className={`${selectedServiceId ? 'flex' : 'hidden lg:flex'} flex-col w-full lg:w-1/3 xl:w-1/4 min-h-0 border-t lg:border-l border-border bg-white overflow-y-auto transition-all duration-200`}
          style={{ maxWidth: '100vw' }}
        >
          <div className="p-3 sm:p-4 lg:p-6 flex flex-col gap-3 lg:gap-4 flex-1 min-h-0">
            {selectedServiceId ? (
              <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-xl shadow-lg p-3 sm:p-4 lg:p-5 transition-all duration-300 flex-1 min-h-0 flex flex-col">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 bg-blue-600 rounded-full">
                    <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-800 line-clamp-2">
                    {services.find((s) => s.id === selectedServiceId)?.name}
                  </h3>
                </div>

                <div className="space-y-3 sm:space-y-4 flex-1 min-h-0 overflow-y-auto">
                  {/* Dettagli servizio */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <Info className="w-4 h-4 text-blue-500" />
                      {t('services.details.service_details', 'Dettagli Servizio')}
                    </h4>
                    {services.find((s) => s.id === selectedServiceId)?.description ? (
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed bg-gray-50 rounded-lg px-3 sm:px-4 py-2 sm:py-3 border border-gray-100">
                        {services.find((s) => s.id === selectedServiceId)?.description}
                      </p>
                    ) : (
                      <p className="text-gray-500 text-xs sm:text-sm italic bg-gray-50 rounded-lg px-3 sm:px-4 py-2 sm:py-3 border border-gray-100">
                        {t('services.details.no_description', 'Nessuna descrizione disponibile')}
                      </p>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Informazioni principali - responsive */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <Tag className="w-4 h-4 text-blue-500" />
                      {t('services.details.main_info', 'Informazioni Principali')}
                    </h4>
                    <div className="space-y-2 sm:space-y-3">
                      {/* Durata */}
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-700 text-sm">{t('services.details.duration', 'Durata')}</span>
                        </div>
                        <span className="text-gray-900 font-semibold text-sm">
                          {services.find((s) => s.id === selectedServiceId)?.duration} min
                        </span>
                      </div>
                      
                      {/* Prezzo */}
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="font-medium text-gray-700 text-sm">{t('services.details.price', 'Prezzo')}</span>
                        <span className="text-green-700 font-bold text-base sm:text-lg">
                          {formatPrice(services.find((s) => s.id === selectedServiceId)?.price || 0)}
                        </span>
                      </div>
                      
                      {/* Categoria */}
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="font-medium text-gray-700 text-sm">{t('services.details.category', 'Categoria')}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="focus:outline-none"
                              aria-label="Cambia categoria"
                              onClick={e => e.stopPropagation()}
                            >
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-medium cursor-pointer hover:bg-blue-100 transition text-xs">
                                {services.find((s) => s.id === selectedServiceId)?.category || t('services.category.no_category', 'Senza categoria')}
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-[250px]">
                            <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                              <h3 className="font-bold text-gray-900 text-sm">Cambia categoria</h3>
                              <p className="text-xs text-gray-600 mt-1">Seleziona una categoria esistente o creane una nuova</p>
                            </div>
                            <div className="p-2 max-h-[200px] overflow-y-auto">
                              {categories.length > 0 ? (
                                categories
                                  .filter((cat) => cat !== services.find((s) => s.id === selectedServiceId)?.category)
                                  .map((cat) => (
                                    <DropdownMenuItem
                                      key={cat}
                                      onSelect={() => handleChangeCategory(selectedServiceId as number, cat)}
                                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 cursor-pointer"
                                    >
                                      <Tag className="h-3 w-3 text-blue-600" />
                                      <span className="flex-1">{cat}</span>
                                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                        {categoryUsageCount[cat] || 0} servizi
                                      </Badge>
                                    </DropdownMenuItem>
                                  ))
                              ) : (
                                <div className="p-2 text-sm text-gray-500 text-center">
                                  Nessuna categoria disponibile
                                </div>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => {
                                  setPendingCategoryServiceId(selectedServiceId!);
                                  setIsNewCategoryModalOpen(true);
                                }}
                                className="text-blue-600 hover:bg-blue-50 font-medium cursor-pointer"
                              >
                                <Tag className="h-3 w-3 mr-2" />
                                + Nuova categoria...
                              </DropdownMenuItem>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Stato */}
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="font-medium text-gray-700 text-sm">{t('services.details.status', 'Stato')}</span>
                        <Badge
                          variant={services.find((s) => s.id === selectedServiceId)?.status === "active" ? "default" : "secondary"}
                          className={
                            services.find((s) => s.id === selectedServiceId)?.status === "active"
                              ? "bg-green-50 text-green-700 border-green-200 font-medium text-xs"
                              : "bg-gray-50 text-gray-600 border-gray-200 font-medium text-xs"
                          }
                        >
                          {services.find((s) => s.id === selectedServiceId)?.status === "active" ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {services.find((s) => s.id === selectedServiceId)?.status}
                        </Badge>
                      </div>
                      
                      {/* Data aggiunta */}
                      <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="font-medium text-gray-700 text-sm">{t('services.details.date_added', 'Data Aggiunta')}</span>
                        <span className="text-gray-900 text-sm">
                          {new Date(services.find((s) => s.id === selectedServiceId)?.date_added || '').toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Promo */}
                      {services.find((s) => s.id === selectedServiceId)?.promo && (
                        <div className="flex items-center justify-between p-2 sm:p-3 bg-red-50 rounded-lg border border-red-100">
                          <span className="font-medium text-red-700 text-sm">{t('services.details.promotion', 'Promozione')}</span>
                          <Badge className="bg-red-500 text-white font-medium text-xs">{t('services.details.active', 'Attiva')}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 sm:p-8">
                <Tag className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-slate-300 mb-3" />
                <p className="text-sm lg:text-base text-slate-500">{t('services.select_service_message', 'Seleziona un servizio per visualizzare i dettagli')}</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Modal a tutto schermo per mobile - Apple-style */}
      <AnimatePresence>
        {isMobileFullscreen && selectedServiceId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={handleCloseMobileFullscreen}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle per il drag */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>
              
              {/* Header con titolo e pulsante chiudi */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-full">
                      <Tag className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 line-clamp-1">
                      {services.find((s) => s.id === selectedServiceId)?.name}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseMobileFullscreen}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Contenuto scrollabile */}
              <ScrollArea className="flex-1 max-h-[calc(90vh-80px)]">
                <div className="p-6 space-y-6">
                  {/* Dettagli servizio */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      Dettagli Servizio
                    </h3>
                    {services.find((s) => s.id === selectedServiceId)?.description ? (
                      <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                        {services.find((s) => s.id === selectedServiceId)?.description}
                      </p>
                    ) : (
                      <p className="text-gray-500 text-sm italic bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                        Nessuna descrizione disponibile
                      </p>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Informazioni principali */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-blue-500" />
                      Informazioni Principali
                    </h3>
                    <div className="space-y-3">
                      {/* Durata */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-700">Durata</span>
                        </div>
                        <span className="text-gray-900 font-semibold">
                          {services.find((s) => s.id === selectedServiceId)?.duration} min
                        </span>
                      </div>
                      
                      {/* Prezzo */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="font-medium text-gray-700">Prezzo</span>
                        <span className="text-green-700 font-bold text-lg">
                          {formatPrice(services.find((s) => s.id === selectedServiceId)?.price || 0)}
                        </span>
                      </div>
                      
                      {/* Categoria */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="font-medium text-gray-700">Categoria</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="focus:outline-none"
                              aria-label="Cambia categoria"
                            >
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-medium cursor-pointer hover:bg-blue-100 transition">
                                {services.find((s) => s.id === selectedServiceId)?.category || 'Senza categoria'}
                              </Badge>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-[250px]">
                            <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                              <h3 className="font-bold text-gray-900 text-sm">Cambia categoria</h3>
                              <p className="text-xs text-gray-600 mt-1">Seleziona una categoria esistente o creane una nuova</p>
                            </div>
                            <div className="p-2 max-h-[200px] overflow-y-auto">
                              {categories.length > 0 ? (
                                categories
                                  .filter((cat) => cat !== services.find((s) => s.id === selectedServiceId)?.category)
                                  .map((cat) => (
                                    <DropdownMenuItem
                                      key={cat}
                                      onSelect={() => handleChangeCategory(selectedServiceId as number, cat)}
                                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 cursor-pointer"
                                    >
                                      <Tag className="h-3 w-3 text-blue-600" />
                                      <span className="flex-1">{cat}</span>
                                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                        {categoryUsageCount[cat] || 0} servizi
                                      </Badge>
                                    </DropdownMenuItem>
                                  ))
                              ) : (
                                <div className="p-2 text-sm text-gray-500 text-center">
                                  Nessuna categoria disponibile
                                </div>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => {
                                  setPendingCategoryServiceId(selectedServiceId!);
                                  setIsNewCategoryModalOpen(true);
                                }}
                                className="text-blue-600 hover:bg-blue-50 font-medium cursor-pointer"
                              >
                                <Tag className="h-3 w-3 mr-2" />
                                + Nuova categoria...
                              </DropdownMenuItem>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Stato */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="font-medium text-gray-700">Stato</span>
                        <Badge
                          variant={services.find((s) => s.id === selectedServiceId)?.status === "active" ? "default" : "secondary"}
                          className={
                            services.find((s) => s.id === selectedServiceId)?.status === "active"
                              ? "bg-green-50 text-green-700 border-green-200 font-medium"
                              : "bg-gray-50 text-gray-600 border-gray-200 font-medium"
                          }
                        >
                          {services.find((s) => s.id === selectedServiceId)?.status === "active" ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {services.find((s) => s.id === selectedServiceId)?.status}
                        </Badge>
                      </div>
                      
                      {/* Data aggiunta */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="font-medium text-gray-700">Data Aggiunta</span>
                        <span className="text-gray-900">
                          {new Date(services.find((s) => s.id === selectedServiceId)?.date_added || '').toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Promo */}
                      {services.find((s) => s.id === selectedServiceId)?.promo && (
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                          <span className="font-medium text-red-700">Promozione</span>
                          <Badge className="bg-red-500 text-white font-medium">Attiva</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Azioni */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setEditModalOpen(true);
                        handleCloseMobileFullscreen();
                      }}
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Modifica
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        handleDelete(selectedServiceId as number);
                        handleCloseMobileFullscreen();
                      }}
                    >
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Elimina
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
                

      {/* Modals */}
      {isModalOpen && (
        <FormModal
          isDialogOpen={isModalOpen}
          setIsDialogOpen={setModalOpen}
          onServiceCreated={fetchservices}
        />
      )}
      {isEditModalOpen && selectedServiceId !== null && (
        <EditFormModal
          isDialogOpen={isEditModalOpen}
          setIsDialogOpen={setEditModalOpen}
          serviceId={selectedServiceId as number}
          onServiceUpdated={fetchservices}
        />
      )}
      {/* Modal per nuova categoria (assegnata a servizio specifico) */}
      <Dialog open={isNewCategoryModalOpen} onOpenChange={open => {
        setIsNewCategoryModalOpen(open);
        if (!open) {
          setPendingCategoryServiceId(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('services.modals.new_category_title', 'Nuova Categoria')}</DialogTitle>
          </DialogHeader>
          <Formik
            initialValues={{ name: "" }}
            enableReinitialize
            validationSchema={Yup.object({
              name: Yup.string()
                .min(2, t('services.validation.min_2_chars', 'Minimo 2 caratteri'))
                .max(30, t('services.validation.max_30_chars', 'Massimo 30 caratteri'))
                .required(t('services.validation.name_required', 'Il nome è obbligatorio')),
            })}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              // Verifica che pendingCategoryServiceId sia valido
              if (!pendingCategoryServiceId) {
                setSubmitting(false);
                return;
              }
              const ok = await handleCreateCategoryAndAssign(values.name);
              setSubmitting(false);
              if (ok) {
                resetForm();
              }
            }}
          >
            {({ isSubmitting, resetForm }) => (
              <Form className="space-y-4">
                <div>
                  <Field
                    as={Input}
                    name="name"
                    placeholder={t('services.modals.category_name_placeholder', 'Nome categoria')}
                    autoFocus
                    onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                  />
                  <ErrorMessage name="name">
                    {msg => (
                      <div className="text-xs text-red-500 mt-1">{msg}</div>
                    )}
                  </ErrorMessage>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      setIsNewCategoryModalOpen(false);
                      setPendingCategoryServiceId(null);
                      resetForm();
                    }}
                  >
                    {t('common.cancel', 'Annulla')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || newCategoryLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {newCategoryLoading ? t('services.actions.saving', 'Salvataggio...') : t('common.save', 'Salva')}
                  </Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Modal per nuova categoria generale */}
      <Dialog open={isCreateCategoryModalOpen} onOpenChange={setIsCreateCategoryModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-blue-600" />
              {t('services.modals.category_management_title', 'Gestione Categorie')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col h-full">
            {/* Sezione crea nuova categoria */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">{t('services.modals.create_new_category', 'Crea Nuova Categoria')}</h3>
              <Formik
                initialValues={{ name: "" }}
                enableReinitialize
                validationSchema={Yup.object({
                  name: Yup.string()
                    .min(2, "Minimo 2 caratteri")
                    .max(30, "Massimo 30 caratteri")
                    .required("Il nome è obbligatorio"),
                })}
                onSubmit={async (values, { setSubmitting, resetForm }) => {
                  const ok = await handleCreateCategory(values.name);
                  setSubmitting(false);
                  if (ok) {
                    resetForm();
                  }
                }}
              >
                {({ isSubmitting, resetForm }) => (
                  <Form className="flex gap-2">
                    <div className="flex-1">
                      <Field
                        as={Input}
                        name="name"
                        placeholder={t('services.modals.category_examples_placeholder', 'Es. Taglio, Colore, Styling...')}
                        className="h-9"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting || newCategoryLoading}
                      className="bg-blue-600 hover:bg-blue-700 h-9 px-4"
                    >
                      {newCategoryLoading ? t('services.actions.creating', 'Creazione...') : t('services.actions.create', 'Crea')}
                    </Button>
                  </Form>
                )}
              </Formik>
            </div>

            {/* Sezione lista categorie esistenti */}
            <div className="flex-1 overflow-hidden">
              <h3 className="font-semibold text-gray-900 mb-3">{t('services.modals.existing_categories', 'Categorie Esistenti')}</h3>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {serviceCategories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Tag className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>{t('services.modals.no_categories_created', 'Nessuna categoria creata')}</p>
                      <p className="text-sm">{t('services.modals.create_first_category', 'Crea la tua prima categoria per organizzare i servizi')}</p>
                    </div>
                  ) : (
                    serviceCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                            <Tag className="h-4 w-4 text-blue-600" />
                          </div>
                          
                          {editingCategoryId === category.id ? (
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Input
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                className="h-8 flex-1 min-w-0"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateCategory(category.id, editingCategoryName);
                                  } else if (e.key === 'Escape') {
                                    setEditingCategoryId(null);
                                    setEditingCategoryName("");
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleUpdateCategory(category.id, editingCategoryName)}
                                disabled={newCategoryLoading}
                                className="h-8 px-2 bg-green-600 hover:bg-green-700"
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingCategoryId(null);
                                  setEditingCategoryName("");
                                }}
                                className="h-8 px-2"
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="font-medium text-gray-900 truncate">
                                {category.name}
                              </span>
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs flex-shrink-0">
                                {categoryUsageCount[category.name] || 0} {t('services.category.services_count', 'servizi')}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {editingCategoryId !== category.id && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                                                         <TooltipProvider>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => {
                                       setEditingCategoryId(category.id);
                                       setEditingCategoryName(category.name);
                                     }}
                                     className={`h-8 w-8 p-0 ${
                                       (categoryUsageCount[category.name] || 0) > 0
                                         ? 'text-gray-400 cursor-not-allowed'
                                         : 'hover:bg-blue-50 hover:text-blue-600'
                                     }`}
                                     disabled={newCategoryLoading || (categoryUsageCount[category.name] || 0) > 0}
                                   >
                                     <Edit className="h-4 w-4" />
                                   </Button>
                                 </TooltipTrigger>
                                 <TooltipContent side="top">
                                                                    <span className="text-xs">
                                   {(categoryUsageCount[category.name] || 0) > 0
                                     ? t('services.category.cannot_edit_with_services', `Impossibile modificare: ${categoryUsageCount[category.name]} servizio${(categoryUsageCount[category.name] || 0) > 1 ? 'i' : ''} associato${(categoryUsageCount[category.name] || 0) > 1 ? 'i' : ''}`)
                                     : t('services.actions.edit_category', 'Modifica categoria')
                                   }
                                 </span>
                                 </TooltipContent>
                               </Tooltip>
                             </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCategory(category.id, category.name)}
                                    className={`h-8 w-8 p-0 ${
                                      (categoryUsageCount[category.name] || 0) > 0
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'hover:bg-red-50 hover:text-red-600'
                                    }`}
                                    disabled={newCategoryLoading || (categoryUsageCount[category.name] || 0) > 0}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                                                   <span className="text-xs">
                                   {(categoryUsageCount[category.name] || 0) > 0
                                     ? t('services.category.cannot_delete_with_services', `Impossibile eliminare: ${categoryUsageCount[category.name]} servizio${(categoryUsageCount[category.name] || 0) > 1 ? 'i' : ''} associato${(categoryUsageCount[category.name] || 0) > 1 ? 'i' : ''}`)
                                     : t('services.actions.delete_category', 'Elimina categoria')
                                   }
                                 </span>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Footer con informazioni */}
                         <div className="border-t border-gray-200 pt-4 mt-4">
               <div className="flex items-center gap-2 text-sm text-gray-600">
                 <AlertTriangle className="h-4 w-4 text-amber-500" />
                 <span>
                   {t('services.modals.category_warning', 'Le categorie con servizi associati non possono essere modificate o eliminate. Rimuovi prima i servizi dalla categoria.')}
                 </span>
               </div>
             </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateCategoryModalOpen(false)}
            >
              {t('common.close', 'Chiudi')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestioneServizi;
