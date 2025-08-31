import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PencilIcon, TrashIcon, PhoneIcon, MailIcon, ActivityIcon, UserIcon, CalendarIcon, EuroIcon, CreditCardIcon, ArrowLeftIcon, MenuIcon, TagIcon, ChevronDownIcon, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { CreateOrder } from "./_component/CreateOrder";
import EditFormModal from "./_component/EditFormModal";
import { CreateClientForm } from "./_component/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { showToast } from "../HelperToast";
import NavbarSecondariaClienti from "./_component/navbar_Secondaria_clienti";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TagManager } from "./_components/TagManager"; // Assicurati che il percorso sia corretto
import { getSalonId } from '@/utils/getSalonId';
import { useLocalization } from '@/hooks/useLocalization';

const supabase = createClient();

// Sposta questa definizione in un file separato, ad esempio ClientTag.ts, e importala sia qui che in TagManager.tsx
export interface ClientTag {
  id: string;
  name: string;
  category: 'profile' | 'frequency' | 'preferences' | 'payment' | 'marketing' | 'fiscal' | 'internal';
  color: string;
}

interface Client {
  id: number;
  nome: string;
  telefono: string;
  email: string;
  note?: string;
  descrizione?: string;
  status?: string;
  customer_uuid: string;
  coupon_id?: string;
  coupon?: {
    code: string;
    description: string;
  } | null;
  // Fatturazione
  richiede_fattura?: boolean;
  tipo_cliente?: 'privato' | 'azienda' | 'libero_professionista';
  intestazione_fattura?: string;
  codice_fiscale?: string;
  partita_iva?: string;
  pec?: string;
  codice_sdi?: string;
  // Indirizzo
  indirizzo_fatturazione?: string;
  cap?: string;
  citta?: string;
  provincia?: string;
  nazione?: string;
  // Pagamento
  metodo_pagamento?: string;
  pagato?: boolean;
  data_pagamento?: string;
  iva_inclusa?: boolean;
  aliquota_iva?: number;
  ritenuta_acconto?: number;
  bollo?: boolean;
  // Fattura descrittiva
  note_fattura?: string;
  numero_fattura?: string;
  data_fattura?: string;
  totale?: number;
  totale_imponibile?: number;
  totale_iva?: number;
  totale_netto?: number;
  valuta?: string;
  // Interni
  fattura_emessa?: boolean;
  fattura_pdf_url?: string;
  user_id_emittente?: string;
  team_id?: string;
  cliente_id?: string;
  // Extra
  firma_cliente_url?: string;
  documento_identita_url?: string;
  telefono_fatturazione?: string;
  tag?: ClientTag[] | null; // Corrisponde alla colonna tag in Supabase (Json)
  created_at?: string; // Aggiunto per la data di creazione
}

interface Order {
  id: number;
  customer_uuid: string;
  data: string;
  orarioInizio: string;
  orarioFine: string;
  servizio: string;
  prezzo: number;
  status?: string;
  services?: Array<{
    id: number;
    order_id: string;
    service_id: string;
    servizio: string;
    price: number;
  }>;
}

const CLIENT_TAGS = {
  profile: [
    { id: 'vip', name: 'VIP', color: 'bg-purple-100 text-purple-800' },
    { id: 'new', name: 'Nuovo Cliente', color: 'bg-green-100 text-green-800' },
    { id: 'historic', name: 'Cliente Storico', color: 'bg-blue-100 text-blue-800' },
    { id: 'regular', name: 'Cliente Abituale', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'occasional', name: 'Cliente Saltuario', color: 'bg-orange-100 text-orange-800' },
    { id: 'friend', name: 'Amico/Familiare', color: 'bg-pink-100 text-pink-800' },
    { id: 'business', name: 'Cliente Aziendale', color: 'bg-gray-100 text-gray-800' },
    { id: 'influencer', name: 'Influencer', color: 'bg-yellow-100 text-yellow-800' },
  ],
  frequency: [
    { id: 'inactive30', name: 'Inattivo da 30 giorni', color: 'bg-amber-100 text-amber-800' },
    { id: 'inactive90', name: 'Inattivo da 90 giorni', color: 'bg-red-100 text-red-800' },
    { id: 'late', name: 'Sempre in ritardo', color: 'bg-orange-100 text-orange-800' },
    { id: 'reliable', name: 'Mai salta un appuntamento', color: 'bg-green-100 text-green-800' },
    { id: 'noshow', name: 'Ultimo appuntamento no-show', color: 'bg-red-100 text-red-800' },
    { id: 'cancels', name: 'Cancellazioni frequenti', color: 'bg-orange-100 text-orange-800' },
  ],
  // ... other tag categories
} as const;

const AnagraficaClienti = () => {
  const { t, formatDate, formatCurrency, currentLanguage } = useLocalization();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for edit modal
  const [editingClient, setEditingClient] = useState<Client | null>(null); // State for the client being edited
  const [isClientFormOpen, setIsClientFormOpen] = useState(false); // State for client form modal
  const [userId, setUserId] = useState(""); // State for user ID
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatsMonth, setSelectedStatsMonth] = useState<number>(new Date().getMonth());
  const [selectedStatsYear, setSelectedStatsYear] = useState<number>(new Date().getFullYear());
  const [isTagModalOpen, setIsTagModalOpen] = useState(false); // Stato per la modale dei tag
  const [activeTab, setActiveTab] = useState<string>("statistiche"); // Stato per il tab attivo
  const [isActionModalOpen, setIsActionModalOpen] = useState(false); // Stato per la modale delle azioni
  const [selectedAction, setSelectedAction] = useState<any>(null); // Stato per l'azione selezionata
  const [isLoading, setIsLoading] = useState(true); // Loading state for clients

  // Array dei tab disponibili
  const availableTabs = [
    { value: "statistiche", label: t('clients.tabs.statistics', 'Statistiche'), icon: ActivityIcon },
    { value: "appuntamenti", label: t('clients.tabs.appointments', 'Appuntamenti'), icon: CalendarIcon },
    { value: "info", label: t('clients.tabs.info', 'Info'), icon: UserIcon },
    { value: "analisi", label: t('clients.tabs.analysis', 'Analisi'), icon: EuroIcon },
    { value: "fatturazione", label: t('clients.tabs.billing', 'Fatturazione'), icon: CreditCardIcon },
    { value: "indirizzo", label: t('clients.tabs.address', 'Indirizzo'), icon: MailIcon },
    { value: "pagamento", label: t('clients.tabs.payment', 'Pagamento'), icon: CreditCardIcon },
  ];

  // Funzione per recuperare i clienti dal database (per salone, non per user)
  const fetchClients = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("Utente non autenticato.");
      setIsLoading(false);
      return;
    }
    setUserId(user.id); // Set the user ID
    
    // Usa getSalonId() che gestisce sia manager che membri del team
    console.log('[DEBUG] Recupero clienti - user_id:', user.id);
    
    const salon_id = await getSalonId();
    
    if (!salon_id) {
      console.error("Impossibile determinare il salone.");
      return;
    }
    console.log('[DEBUG] Query clienti con salon_id:', salon_id);
    
    const { data, error } = await supabase
      .from("customers")
      .select(`
        *,
        customer_coupons (
          coupon_id,
          discount_coupons (code, description)
        )
      `)
      .eq("salon_id", salon_id);
      
    console.log('[DEBUG] Risultato query clienti:', { data: data?.length, error });
    
    if (error) {
      console.error("Errore nel recupero dei clienti:", error.message);
    } else {
      // Mappa i dati per includere il coupon abbinato e gestire i tag
      const mappedClients = data.map((client) => ({
        ...client,
        coupon: client.customer_coupons?.[0]?.discount_coupons || null,
        // Assicurati che i tag siano sempre un array
        tag: Array.isArray(client.tag) ? client.tag : null,
      }));
      setClients(mappedClients);
    }
    setIsLoading(false);
  };

  const fetchClientOrders = async (customer_uuid: string) => {
    console.log("Fetching orders for customer_uuid:", customer_uuid);
    
    // Get salon_id to ensure we only fetch orders for clients in this salon
    const salon_id = await getSalonId();
    if (!salon_id) {
      console.error("Impossibile determinare il salone.");
      return;
    }
    
    // Prima recupera gli ordini
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_uuid", customer_uuid);

    if (ordersError) {
      console.error("Errore nel recupero degli appuntamenti:", ordersError.message);
      return;
    }

    if (!orders || orders.length === 0) {
      setClientOrders([]);
      return;
    }

    // Poi recupera i servizi per tutti gli ordini
    const orderIds = orders.map(order => order.id);
    const { data: services, error: servicesError } = await supabase
      .from("order_services")
      .select("*")
      .in("order_id", orderIds);

    if (servicesError) {
      console.error("Errore nel recupero dei servizi:", servicesError.message);
      // Fallback: usa solo gli ordini senza servizi
      setClientOrders(orders || []);
      return;
    }

    // Combina ordini e servizi
    const ordersWithServices = orders.map(order => ({
      ...order,
      services: services?.filter(service => service.order_id === order.id) || []
    }));

    console.log("Appuntamenti trovati con servizi:", ordersWithServices);
    setClientOrders(ordersWithServices);
  };

  useEffect(() => {
    fetchClients();
    
    // Subscription per aggiornamenti in tempo reale della tabella customers
    const customersSubscription = supabase
      .channel('realtime:customers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => {
          console.log('Evento realtime customers:', payload);
          // Ricarica i clienti quando ci sono cambiamenti
          fetchClients();
        }
      )
      .subscribe();

    return () => {
      customersSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchClientOrders(selectedClient.customer_uuid);
    }
  }, [selectedClient]);

  const handleAddClient = async (newClient: Client) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("Utente non autenticato.");
      return;
    }

    // Usa getSalonId() per ottenere il salon_id corretto
    const salon_id = await getSalonId();
    if (!salon_id) {
      console.error("Impossibile determinare il salone.");
      showToast({
        title: t('common.error', 'Errore'),
        description: t('clients.error.salon_not_found', 'Impossibile determinare il salone. Riprova più tardi.'),
        type: "error",
      });
      return;
    }

    const { data, error } = await supabase.from("customers").insert({
      ...newClient,
      user_id: user.id,
      salon_id: salon_id,
    }).select();

    if (error) {
      console.error("Errore nell'aggiunta del cliente:", error.message);
      showToast({
        title: t('common.error', 'Errore'),
        description: t('clients.error.add_failed', 'Non è stato possibile aggiungere il cliente. Riprova più tardi.'),
        type: "error",
      });
    } else {
      setIsDialogOpen(false);
      setIsClientFormOpen(false);
      
      // Aggiorna immediatamente lo stato locale per responsività
      const newClientWithCoupon = {
        ...data[0],
        coupon: null
      };
      setClients(prevClients => [...prevClients, newClientWithCoupon]);
      
      // Seleziona immediatamente il nuovo cliente
      setSelectedClient(newClientWithCoupon);
      setIsMobileDetailsOpen(true);
      
      showToast({
        title: t('clients.success.added', 'Cliente aggiunto'),
        description: t('clients.success.added_description', 'Il cliente è stato aggiunto con successo.'),
        type: "success",
      });
    }
  };

  const handleEdit = async (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const handleClientUpdated = (updatedClient: any) => {
    // Aggiorna lo stato locale dei clienti
    setClients(prevClients =>
      prevClients.map(client =>
        client.id === updatedClient.id ? { ...client, ...updatedClient } : client
      )
    );
    
    // Aggiorna anche il cliente selezionato se è quello modificato
    if (selectedClient && selectedClient.id === updatedClient.id) {
      setSelectedClient({ ...selectedClient, ...updatedClient });
    }
  };

  const handleDelete = async (id: number) => {
    // Get salon_id to ensure we only delete clients in this salon
    const salon_id = await getSalonId();
    if (!salon_id) {
      console.error("Impossibile determinare il salone.");
      showToast({
        title: t('common.error', 'Errore'),
        description: t('clients.error.salon_not_found', 'Impossibile determinare il salone. Riprova più tardi.'),
        type: "error",
      });
      return;
    }

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .eq("salon_id", salon_id); // Ensure we only delete clients in this salon
  
    if (error) {
      console.error("Errore nella cancellazione del cliente:", error.message);
      showToast({
        title: t('common.error', 'Errore'),
        description: t('clients.error.delete_failed', 'Non è stato possibile eliminare il cliente. Riprova più tardi.'),
        type: "error",
      });
    } else {
      // Aggiorna lo stato locale
      setClients(prevClients => prevClients.filter(client => client.id !== id));
      
      // Se il cliente eliminato era selezionato, deselezionalo
      if (selectedClient && selectedClient.id === id) {
        setSelectedClient(null);
        setIsMobileDetailsOpen(false);
      }
      
      showToast({
        title: t('clients.success.deleted', 'Cliente eliminato'),
        description: t('clients.success.deleted_description', 'Il cliente è stato eliminato con successo.'),
        type: "success",
      });
    }
  };
  
  const handleSelectClient = (client: Client) => {
    console.log("Cliente selezionato:", client);
    setSelectedClient(client);
    setIsMobileDetailsOpen(true); // Open details on mobile when client is selected
  };

  const handleBackToList = () => {
    setIsMobileDetailsOpen(false);
    setSelectedClient(null);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const lowercaseQuery = query.toLowerCase();
    const filtered = clients.filter((client) =>
      Object.values(client).some((value) =>
        value?.toString().toLowerCase().includes(lowercaseQuery)
      )
    );
    setFilteredClients(filtered);
  };

  useEffect(() => {
    setFilteredClients(clients);
  }, [clients]);

  const handleRefresh = () => {
    fetchClients();
  };

  const handleSortByScore = (ascending: boolean) => {
    const sortedClients = [...filteredClients].sort((a, b) => {
      const ordersA = clientOrders.filter(order => order.customer_uuid === a.customer_uuid);
      const ordersB = clientOrders.filter(order => order.customer_uuid === b.customer_uuid);

      const scoreA = calculateClientScore(ordersA, a);
      const scoreB = calculateClientScore(ordersB, b);

      return ascending ? scoreA - scoreB : scoreB - scoreA;
    });
    setFilteredClients(sortedClients);
  };

  const handleSortByName = (ascending: boolean) => {
    const sortedClients = [...filteredClients].sort((a, b) => {
      const nameA = a.nome.toLowerCase();
      const nameB = b.nome.toLowerCase();
      
      if (ascending) {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
    setFilteredClients(sortedClients);
  };

  const handleSortByDate = (ascending: boolean) => {
    const sortedClients = [...filteredClients].sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      
      if (ascending) {
        return dateB.getTime() - dateA.getTime(); // Più recenti prima
      } else {
        return dateA.getTime() - dateB.getTime(); // Più vecchi prima
      }
    });
    setFilteredClients(sortedClients);
  };

  useEffect(() => {
    // Fetch all client orders when the component mounts or when the client list changes
    const fetchAllClientOrders = async () => {
      const allOrders = await Promise.all(
        clients.map(async (client) => {
          const { data, error } = await supabase
            .from("orders")
            .select("*")
            .eq("customer_uuid", client.customer_uuid);

          if (error) {
            console.error(`Errore nel recupero degli ordini per ${client.nome}:`, error.message);
            return [];
          }
          return data || [];
        })
      );
      setClientOrders(allOrders.flat());
    };

    if (clients.length > 0) {
      fetchAllClientOrders();
    }
  }, [clients]);

  useEffect(() => {
    // Reapply the filter when the client details are opened or closed
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  }, [selectedClient]);

  function normalizzaAppuntamenti(n: number) {
    return Math.min(n / 20, 1); // 20+ appuntamenti = 100%
  }

  function normalizzaSpesaTotale(euro: number) {
    return Math.min(euro / 500, 1); // 500€+ = 100%
  }

  function normalizzaRegolarita(giorni: number) {
    if (giorni <= 20) return 1;        // visita ogni 20 giorni = ottimo
    if (giorni >= 90) return 0;        // visita oltre 3 mesi = scarso
    return 1 - (giorni - 20) / 70;     // scala tra 1 e 0
  }

  // 🧠 SISTEMA DI ANALISI AVANZATO
  const calculateClientScore = (orders: Order[], client: Client): number => {
    if (orders.length === 0) return 0;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // 📊 ANALISI TEMPORALE
    const monthlyOrders = orders.filter(order => {
      const orderDate = new Date(order.data);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    const last3MonthsOrders = orders.filter(order => {
      const orderDate = new Date(order.data);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return orderDate >= threeMonthsAgo;
    });

    // 📅 FREQUENZA E CONSISTENZA (25%)
    const frequencyScore = Math.min(monthlyOrders.length / 4, 1) * 0.15; // Max 4 appuntamenti/mese = 100%
    const consistencyScore = Math.min(last3MonthsOrders.length / 12, 1) * 0.10; // Max 12 appuntamenti/3 mesi = 100%

    // 💰 VALORE ECONOMICO (20%)
    const totalSpent = orders.reduce((sum, order) => sum + (order.prezzo || 0), 0);
    const avgOrderValue = totalSpent / orders.length;
    const spendingScore = Math.min(totalSpent / 1000, 1) * 0.12; // Max 1000€ = 100%
    const avgValueScore = Math.min(avgOrderValue / 100, 1) * 0.08; // Max 100€/ordine = 100%

    // ⏱️ REGOLARITÀ E PREDICTIBILITÀ (15%)
    const sortedOrders = orders.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const intervals = sortedOrders.slice(1).map((order, i) => {
      const prevDate = new Date(sortedOrders[i].data);
      const currDate = new Date(order.data);
      return (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    });
    
    const avgInterval = intervals.length > 0 ? intervals.reduce((sum, days) => sum + days, 0) / intervals.length : 90;
    const regularityScore = Math.max(0, 1 - (avgInterval / 60)) * 0.10; // 0-60 giorni = ottimo
    
    // Calcola deviazione standard degli intervalli per la predictibilità
    const intervalVariance = intervals.length > 0 ? 
      intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length : 0;
    const predictabilityScore = Math.max(0, 1 - (Math.sqrt(intervalVariance) / 30)) * 0.05; // Bassa varianza = alta predictibilità

    // 📅 ENGAGEMENT FUTURO (10%)
    const futureOrders = orders.filter(order => {
      const orderDate = new Date(order.data);
      const daysDiff = (orderDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff > 0 && daysDiff <= 30;
    });
    const futureScore = Math.min(futureOrders.length / 2, 1) * 0.10; // Max 2 appuntamenti futuri = 100%

    // ❌ AFFIDABILITÀ (15%)
    const noShowOrders = orders.filter(order => 
      order.status === 'cancellato' || order.status === 'no-show' || order.status === 'disdetto'
    );
    const noShowRate = orders.length > 0 ? noShowOrders.length / orders.length : 0;
    const reliabilityScore = Math.max(0, 1 - (noShowRate * 2)) * 0.15; // 0% no-show = 100%, 50%+ no-show = 0%

    // 🕐 RECENCY (10%)
    const lastOrder = sortedOrders[sortedOrders.length - 1];
    let recencyScore = 0;
    if (lastOrder) {
      const lastVisitDate = new Date(lastOrder.data);
      const daysSinceLastVisit = (currentDate.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastVisit <= 7) recencyScore = 0.10;
      else if (daysSinceLastVisit <= 30) recencyScore = 0.08;
      else if (daysSinceLastVisit <= 60) recencyScore = 0.05;
      else if (daysSinceLastVisit <= 90) recencyScore = 0.02;
    }

    // 🎯 ANALISI SERVIZI (10%)
    const allServices = orders.flatMap(order => order.services || []);
    const uniqueServices = [...new Set(allServices.map(s => s.servizio))];
    const serviceDiversityScore = Math.min(uniqueServices.length / 5, 1) * 0.05; // Max 5 servizi diversi = 100%
    
    // Analizza servizi premium (prezzo > 50€)
    const premiumServices = allServices.filter(s => s.price > 50);
    const premiumScore = Math.min(premiumServices.length / 3, 1) * 0.05; // Max 3 servizi premium = 100%

    // 🎫 FIDELIZZAZIONE (5%)
    const couponScore = client.coupon ? 0.05 : 0;

    // Calcola punteggio finale
    const finalScore = Math.max(0, Math.min(1, 
      frequencyScore + 
      consistencyScore +
      spendingScore + 
      avgValueScore +
      regularityScore + 
      predictabilityScore +
      futureScore + 
      reliabilityScore + 
      recencyScore + 
      serviceDiversityScore +
      premiumScore +
      couponScore
    ));

    return Math.round(finalScore * 100);
  };

  // 🏆 FUNZIONE PER DETERMINARE IL LIVELLO DEL CLIENTE AVANZATO
  const getClientLevel = (score: number) => {
    if (score >= 90) return { 
      level: "Diamante", 
      color: "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200", 
      icon: "💎",
      description: "Cliente VIP di massimo valore"
    };
    if (score >= 80) return { 
      level: "Oro", 
      color: "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200", 
      icon: "🥇",
      description: "Cliente di alto valore"
    };
    if (score >= 70) return { 
      level: "Platino", 
      color: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200", 
      icon: "🥈",
      description: "Cliente fedele e regolare"
    };
    if (score >= 60) return { 
      level: "Argento", 
      color: "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-800 border-slate-200", 
      icon: "🥉",
      description: "Cliente attivo"
    };
    if (score >= 40) return { 
      level: "Bronzo", 
      color: "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200", 
      icon: "🏅",
      description: "Cliente occasionale"
    };
    return { 
      level: "Rame", 
      color: "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200", 
      icon: "🔶",
      description: "Cliente a rischio"
    };
  };

  // 🎯 CALCOLO PROBABILITÀ DI RITORNO AVANZATO
  const calculateReturnProbability = (orders: Order[], client: Client): number => {
    if (orders.length === 0) return 0;

    const currentDate = new Date();
    const sortedOrders = orders.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    
    // 📅 RECENCY - Tempo dall'ultima visita (25%)
    const lastOrder = sortedOrders[sortedOrders.length - 1];
    let daysSinceLastVisit = 0;
    if (lastOrder) {
      const lastVisitDate = new Date(lastOrder.data);
      daysSinceLastVisit = (currentDate.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24);
    }
    
    let recencyScore = 0;
    if (daysSinceLastVisit <= 7) recencyScore = 0.25;
    else if (daysSinceLastVisit <= 14) recencyScore = 0.20;
    else if (daysSinceLastVisit <= 30) recencyScore = 0.15;
    else if (daysSinceLastVisit <= 60) recencyScore = 0.10;
    else if (daysSinceLastVisit <= 90) recencyScore = 0.05;

    // 📈 FREQUENCY - Pattern di frequenza (25%)
    const intervals = sortedOrders.slice(1).map((order, i) => {
      const prevDate = new Date(sortedOrders[i].data);
      const currDate = new Date(order.data);
      return (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    });
    
    const avgInterval = intervals.length > 0 ? intervals.reduce((sum, days) => sum + days, 0) / intervals.length : 90;
    let frequencyScore = 0;
    if (avgInterval <= 14) frequencyScore = 0.25; // Settimanale
    else if (avgInterval <= 30) frequencyScore = 0.20; // Mensile
    else if (avgInterval <= 60) frequencyScore = 0.15; // Bimestrale
    else if (avgInterval <= 90) frequencyScore = 0.10; // Trimestrale
    else if (avgInterval <= 180) frequencyScore = 0.05; // Semestrale

    // 📆 ENGAGEMENT - Appuntamenti futuri e recenti (20%)
    const futureOrders = orders.filter(order => {
      const orderDate = new Date(order.data);
      const daysDiff = (orderDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff > 0 && daysDiff <= 30;
    });
    
    const recentOrders = orders.filter(order => {
      const orderDate = new Date(order.data);
      const daysDiff = (currentDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });
    
    const engagementScore = Math.min((futureOrders.length * 0.15) + (recentOrders.length * 0.05), 0.20);

    // ❌ RELIABILITY - Affidabilità e comportamento (20%)
    const noShowOrders = orders.filter(order => 
      order.status === 'cancellato' || order.status === 'no-show' || order.status === 'disdetto'
    );
    const noShowRate = orders.length > 0 ? noShowOrders.length / orders.length : 0;
    const reliabilityScore = Math.max(0, 1 - (noShowRate * 2)) * 0.20;

    // 🎯 SERVICE LOYALTY - Fedeltà ai servizi (10%)
    const allServices = orders.flatMap(order => order.services || []);
    const serviceCount = allServices.length;
    const uniqueServices = [...new Set(allServices.map(s => s.servizio))];
    
    // Cliente che usa sempre gli stessi servizi = più fedele
    const serviceLoyaltyScore = serviceCount > 0 ? 
      Math.min(serviceCount / uniqueServices.length, 3) / 3 * 0.10 : 0;

    // Calcola probabilità finale
    const finalProbability = Math.max(0, Math.min(1, 
      recencyScore + 
      frequencyScore + 
      engagementScore + 
      reliabilityScore + 
      serviceLoyaltyScore
    ));

    return Math.round(finalProbability * 100);
  };

  // 📊 FUNZIONE PER CALCOLARE METRICHE DETTAGLIATE
  const getScoreDetails = (orders: Order[], client: Client) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // 📅 METRICHE TEMPORALI
    const monthlyOrders = orders.filter(order => {
      const orderDate = new Date(order.data);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    const last3MonthsOrders = orders.filter(order => {
      const orderDate = new Date(order.data);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return orderDate >= threeMonthsAgo;
    });

    const last6MonthsOrders = orders.filter(order => {
      const orderDate = new Date(order.data);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return orderDate >= sixMonthsAgo;
    });

    // 💰 METRICHE ECONOMICHE
    const totalSpent = orders.reduce((sum, order) => sum + (order.prezzo || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
    const sortedOrders = orders.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    
    // 📈 METRICHE DI ENGAGEMENT
    const futureOrders = orders.filter(order => {
      const orderDate = new Date(order.data);
      const daysDiff = (orderDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff > 0 && daysDiff <= 30;
    });

    const recentOrders = orders.filter(order => {
      const orderDate = new Date(order.data);
      const daysDiff = (currentDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });

    // ❌ METRICHE DI AFFIDABILITÀ
    const noShowOrders = orders.filter(order => 
      order.status === 'cancellato' || order.status === 'no-show' || order.status === 'disdetto'
    );
    const noShowRate = orders.length > 0 ? (noShowOrders.length / orders.length) * 100 : 0;

    // 🕐 METRICHE DI RECENCY
    const lastOrder = sortedOrders[sortedOrders.length - 1];
    let daysSinceLastVisit = 0;
    if (lastOrder) {
      const lastVisitDate = new Date(lastOrder.data);
      daysSinceLastVisit = (currentDate.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24);
    }

    // 🎯 METRICHE DEI SERVIZI
    const allServices = orders.flatMap(order => order.services || []);
    const uniqueServices = [...new Set(allServices.map(s => s.servizio))];
    const premiumServices = allServices.filter(s => s.price > 50);
    const avgServicePrice = allServices.length > 0 ? 
      allServices.reduce((sum, s) => sum + s.price, 0) / allServices.length : 0;

    // 📊 METRICHE DI REGOLARITÀ
    const intervals = sortedOrders.slice(1).map((order, i) => {
      const prevDate = new Date(sortedOrders[i].data);
      const currDate = new Date(order.data);
      return (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    });
    
    const avgInterval = intervals.length > 0 ? intervals.reduce((sum, days) => sum + days, 0) / intervals.length : 0;
    const intervalVariance = intervals.length > 0 ? 
      intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length : 0;

    return {
      // Metriche temporali
      monthlyOrders: monthlyOrders.length,
      last3MonthsOrders: last3MonthsOrders.length,
      last6MonthsOrders: last6MonthsOrders.length,
      totalOrders: orders.length,
      
      // Metriche economiche
      totalSpent: Math.round(totalSpent * 100) / 100,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      
      // Metriche di engagement
      futureOrders: futureOrders.length,
      recentOrders: recentOrders.length,
      
      // Metriche di affidabilità
      noShowRate: Math.round(noShowRate * 10) / 10,
      reliabilityScore: Math.max(0, 100 - (noShowRate * 2)),
      
      // Metriche di recency
      daysSinceLastVisit: Math.round(daysSinceLastVisit),
      
      // Metriche dei servizi
      totalServices: allServices.length,
      uniqueServices: uniqueServices.length,
      premiumServices: premiumServices.length,
      avgServicePrice: Math.round(avgServicePrice * 100) / 100,
      serviceDiversity: uniqueServices.length > 0 ? 
        Math.round((allServices.length / uniqueServices.length) * 10) / 10 : 0,
      
      // Metriche di regolarità
      avgInterval: Math.round(avgInterval),
      intervalVariance: Math.round(intervalVariance),
      predictabilityScore: Math.max(0, 100 - (Math.sqrt(intervalVariance) / 30 * 100)),
      
      // Altro
      hasCoupon: !!client.coupon,
      clientAge: client.created_at ? 
        Math.round((currentDate.getTime() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
    };
  };

  // 🧠 ANALISI PATTERN COMPORTAMENTALI
  const analyzeBehavioralPatterns = (orders: Order[], client: Client) => {
    if (orders.length === 0) return { patterns: [], insights: [] };

    const patterns = [];
    const insights = [];

    // 📅 Analisi pattern temporali
    const orderDates = orders.map(order => new Date(order.data));
    const dayOfWeekCounts = orderDates.reduce((acc, date) => {
      const day = date.getDay();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const preferredDay = Object.entries(dayOfWeekCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (preferredDay) {
      const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
      patterns.push({
        type: 'temporal',
        title: 'Giorno Preferito',
        value: dayNames[parseInt(preferredDay[0])],
        confidence: Math.round((preferredDay[1] / orders.length) * 100)
      });
    }

    // 🕐 Analisi orari preferiti
    const timeSlots = orders.map(order => {
      const hour = parseInt(order.orarioInizio.split(':')[0]);
      if (hour < 12) return 'mattina';
      if (hour < 17) return 'pomeriggio';
      return 'sera';
    });

    const timeSlotCounts = timeSlots.reduce((acc, slot) => {
      acc[slot] = (acc[slot] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const preferredTime = Object.entries(timeSlotCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (preferredTime) {
      patterns.push({
        type: 'temporal',
        title: 'Orario Preferito',
        value: preferredTime[0],
        confidence: Math.round((preferredTime[1] / orders.length) * 100)
      });
    }

    // 🎯 Analisi servizi preferiti
    const allServices = orders.flatMap(order => order.services || []);
    const serviceCounts = allServices.reduce((acc, service) => {
      acc[service.servizio] = (acc[service.servizio] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topServices = Object.entries(serviceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    topServices.forEach(([service, count]) => {
      patterns.push({
        type: 'service',
        title: 'Servizio Preferito',
        value: service,
        confidence: Math.round((count / allServices.length) * 100)
      });
    });

    // 💰 Analisi pattern di spesa
    const orderValues = orders.map(order => order.prezzo);
    const avgValue = orderValues.reduce((sum, val) => sum + val, 0) / orderValues.length;
    const maxValue = Math.max(...orderValues);
    const minValue = Math.min(...orderValues);

    if (maxValue > avgValue * 1.5) {
      insights.push({
        type: 'spending',
        title: 'Cliente Premium',
        description: 'Occasionalmente effettua ordini di valore superiore alla media',
        impact: 'high'
      });
    }

    if (minValue < avgValue * 0.5) {
      insights.push({
        type: 'spending',
        title: 'Cliente Variabile',
        description: 'Alterna ordini di valore molto diverso',
        impact: 'medium'
      });
    }

    // 📈 Analisi trend
    const sortedOrders = orders.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const recentOrders = sortedOrders.slice(-3);
    const olderOrders = sortedOrders.slice(0, -3);

    if (recentOrders.length > 0 && olderOrders.length > 0) {
      const recentAvg = recentOrders.reduce((sum, order) => sum + order.prezzo, 0) / recentOrders.length;
      const olderAvg = olderOrders.reduce((sum, order) => sum + order.prezzo, 0) / olderOrders.length;

      if (recentAvg > olderAvg * 1.2) {
        insights.push({
          type: 'trend',
          title: 'Trend Crescente',
          description: 'Il valore medio degli ordini è in aumento',
          impact: 'high'
        });
      } else if (recentAvg < olderAvg * 0.8) {
        insights.push({
          type: 'trend',
          title: 'Trend Decrescente',
          description: 'Il valore medio degli ordini è in diminuzione',
          impact: 'medium'
        });
      }
    }

    // 🔄 Analisi stagionalità
    const monthlyCounts = orderDates.reduce((acc, date) => {
      const month = date.getMonth();
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakMonth = Object.entries(monthlyCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (peakMonth && peakMonth[1] > orders.length / 6) {
      const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
      patterns.push({
        type: 'seasonal',
        title: 'Mese di Picco',
        value: monthNames[parseInt(peakMonth[0])],
        confidence: Math.round((peakMonth[1] / orders.length) * 100)
      });
    }

    return { patterns, insights };
  };

  // 🎯 FUNZIONE PER GENERARE SUGGERIMENTI INTELLIGENTI AVANZATI
  const generateSmartSuggestions = (orders: Order[], client: Client) => {
    const currentDate = new Date();
    const score = calculateClientScore(orders, client);
    const probability = calculateReturnProbability(orders, client);
    const details = getScoreDetails(orders, client);
    const probDetails = getProbabilityDetails(orders, client);
    const behaviorPatterns = analyzeBehavioralPatterns(orders, client);
    
    const suggestions = [];
    const actions = [];

    // 🎯 Analisi situazione cliente
    const isInactive = probDetails.daysSinceLastVisit > 60;
    const hasNoFutureAppointments = details.futureOrders === 0;
    const isHighSpender = details.totalSpent > 500;
    const isFrequent = probDetails.avgInterval <= 14;
    const hasNoShowIssues = details.noShowRate > 20;
    const hasCoupon = details.hasCoupon;
    const isVIP = score >= 80;
    const isAtRisk = probability < 40;

    // 📱 Suggerimenti basati su inattività
    if (isInactive) {
      suggestions.push({
        type: "warning",
        icon: "📱",
        title: "Cliente Inattivo",
        message: `Non visita da ${probDetails.daysSinceLastVisit} giorni`,
        action: "Invia WhatsApp con invito personalizzato",
        priority: "high"
      });
      actions.push({
        type: "whatsapp",
        label: "Invia Invito WhatsApp",
        icon: "💬",
        color: "bg-green-500 hover:bg-green-600"
      });
    }

    // 📅 Suggerimenti per appuntamenti futuri
    if (hasNoFutureAppointments) {
      suggestions.push({
        type: "info",
        icon: "📅",
        title: "Nessun Appuntamento Futuro",
        message: "Cliente senza prenotazioni nei prossimi 30 giorni",
        action: "Proponi appuntamento o pacchetto",
        priority: "medium"
      });
      actions.push({
        type: "book",
        label: "Prenota Ora",
        icon: "📝",
        color: "bg-blue-500 hover:bg-blue-600"
      });
    }

    // 💰 Suggerimenti per clienti ad alta spesa
    if (isHighSpender) {
      suggestions.push({
        type: "success",
        icon: "💰",
        title: "Cliente di Alto Valore",
        message: `Ha speso €${details.totalSpent.toFixed(2)} in totale`,
        action: "Proponi pacchetto abbonamento premium",
        priority: "medium"
      });
      actions.push({
        type: "package",
        label: "Proponi Abbonamento",
        icon: "🎁",
        color: "bg-purple-500 hover:bg-purple-600"
      });
    }

    // ⭐ Suggerimenti per clienti frequenti
    if (isFrequent) {
      suggestions.push({
        type: "success",
        icon: "⭐",
        title: "Cliente Molto Frequente",
        message: `Visita ogni ${probDetails.avgInterval} giorni in media`,
        action: "Proponi piano fidelizzazione VIP",
        priority: "medium"
      });
      actions.push({
        type: "vip",
        label: "Piano VIP",
        icon: "👑",
        color: "bg-yellow-500 hover:bg-yellow-600"
      });
    }

    // ⚠️ Suggerimenti per no-show
    if (hasNoShowIssues) {
      suggestions.push({
        type: "error",
        icon: "⚠️",
        title: "Attenzione: Cliente Saltuario",
        message: `${details.noShowRate.toFixed(1)}% di appuntamenti saltati`,
        action: "Implementa strategia di reminder",
        priority: "high"
      });
      actions.push({
        type: "reminder",
        label: "Configura Reminder",
        icon: "🔔",
        color: "bg-orange-500 hover:bg-orange-600"
      });
    }

    // 🎫 Suggerimenti per coupon
    if (hasCoupon) {
      suggestions.push({
        type: "info",
        icon: "🎫",
        title: "Coupon Attivo",
        message: "Cliente con coupon di fidelizzazione",
        action: "Monitora utilizzo e rinnova se necessario",
        priority: "low"
      });
    }

    // 👑 Suggerimenti per VIP
    if (isVIP) {
      suggestions.push({
        type: "success",
        icon: "👑",
        title: "Cliente VIP",
        message: `Punteggio ${score}% - Cliente di eccellenza`,
        action: "Offri servizi esclusivi e attenzioni speciali",
        priority: "medium"
      });
      actions.push({
        type: "exclusive",
        label: "Servizi Esclusivi",
        icon: "💎",
        color: "bg-indigo-500 hover:bg-indigo-600"
      });
    }

    // 🚨 Suggerimenti per clienti a rischio
    if (isAtRisk) {
      suggestions.push({
        type: "error",
        icon: "🚨",
        title: "Cliente a Rischio",
        message: `Solo ${probability}% di probabilità di ritorno`,
        action: "Implementa strategia di retention urgente",
        priority: "high"
      });
      actions.push({
        type: "retention",
        label: "Strategia Retention",
        icon: "🎯",
        color: "bg-red-500 hover:bg-red-600"
      });
    }

    // Se non ci sono suggerimenti specifici, mostra suggerimento generico
    if (suggestions.length === 0) {
      suggestions.push({
        type: "info",
        icon: "💡",
        title: "Cliente Stabile",
        message: "Cliente con comportamento regolare",
        action: "Continua a monitorare e mantenere la relazione",
        priority: "low"
      });
    }

    return { suggestions, actions };
  };

  // Funzione per calcolare i dettagli della probabilità di ritorno
  // 📈 FUNZIONE PER CALCOLARE DETTAGLI PROBABILITÀ AVANZATI
  const getProbabilityDetails = (orders: Order[], client: Client) => {
    const currentDate = new Date();
    const sortedOrders = orders.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    
    const lastOrder = sortedOrders[sortedOrders.length - 1];
    let daysSinceLastVisit = 0;
    if (lastOrder) {
      const lastVisitDate = new Date(lastOrder.data);
      daysSinceLastVisit = (currentDate.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24);
    }

    const intervals = sortedOrders.slice(1).map((order, i) => {
      const prevDate = new Date(sortedOrders[i].data);
      const currDate = new Date(order.data);
      return (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    });
    const avgInterval = intervals.length > 0 ? intervals.reduce((sum, days) => sum + days, 0) / intervals.length : 90;

    const futureOrders = orders.filter(order => {
      const orderDate = new Date(order.data);
      const daysDiff = (orderDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff > 0 && daysDiff <= 30;
    });

    const noShowOrders = orders.filter(order => 
      order.status === 'cancellato' || order.status === 'no-show' || order.status === 'disdetto'
    );
    const noShowRate = orders.length > 0 ? (noShowOrders.length / orders.length) * 100 : 0;

    return {
      daysSinceLastVisit: Math.round(daysSinceLastVisit),
      avgInterval: Math.round(avgInterval),
      futureOrders: futureOrders.length,
      noShowRate: Math.round(noShowRate * 10) / 10,
      reliabilityScore: Math.max(0, 100 - (noShowRate * 2)),
      hasFutureAppointment: futureOrders.length > 0
    };
  };

  // 📊 FUNZIONE PER GENERARE REPORT DETTAGLIATI
  const generateDetailedReport = (orders: Order[], client: Client) => {
    const details = getScoreDetails(orders, client);
    const probDetails = getProbabilityDetails(orders, client);
    const behaviorPatterns = analyzeBehavioralPatterns(orders, client);
    const score = calculateClientScore(orders, client);
    const probability = calculateReturnProbability(orders, client);

    return {
      // 📋 Informazioni generali
      summary: {
        clientName: client.nome,
        totalOrders: details.totalOrders,
        totalSpent: details.totalSpent,
        avgOrderValue: details.avgOrderValue,
        clientAge: details.clientAge,
        hasCoupon: details.hasCoupon
      },

      // 📈 Metriche di performance
      performance: {
        score: score,
        probability: probability,
        reliabilityScore: details.reliabilityScore,
        predictabilityScore: details.predictabilityScore,
        serviceDiversity: details.serviceDiversity
      },

      // 📅 Metriche temporali
      temporal: {
        monthlyOrders: details.monthlyOrders,
        last3MonthsOrders: details.last3MonthsOrders,
        last6MonthsOrders: details.last6MonthsOrders,
        daysSinceLastVisit: details.daysSinceLastVisit,
        avgInterval: details.avgInterval,
        futureOrders: details.futureOrders,
        recentOrders: details.recentOrders
      },

      // 🎯 Metriche dei servizi
      services: {
        totalServices: details.totalServices,
        uniqueServices: details.uniqueServices,
        premiumServices: details.premiumServices,
        avgServicePrice: details.avgServicePrice
      },

      // ❌ Metriche di affidabilità
      reliability: {
        noShowRate: details.noShowRate,
        reliabilityScore: details.reliabilityScore
      },

      // 🧠 Pattern comportamentali
      patterns: behaviorPatterns.patterns,
      insights: behaviorPatterns.insights,

      // 🎯 Raccomandazioni
      recommendations: generateRecommendations(orders, client, details, probDetails)
    };
  };

  // 💡 FUNZIONE PER GENERARE RACCOMANDAZIONI PERSONALIZZATE
  const generateRecommendations = (orders: Order[], client: Client, details: any, probDetails: any) => {
    const recommendations = [];

    // Raccomandazioni basate sulla frequenza
    if (details.monthlyOrders === 0 && details.daysSinceLastVisit > 30) {
      recommendations.push({
        type: 're-engagement',
        priority: 'high',
        title: 'Cliente Inattivo',
        description: 'Cliente non ha appuntamenti da più di 30 giorni',
        action: 'Invia promemoria personalizzato o offerta speciale'
      });
    }

    if (details.futureOrders === 0) {
      recommendations.push({
        type: 'booking',
        priority: 'medium',
        title: 'Nessun Appuntamento Futuro',
        description: 'Cliente non ha prenotazioni future',
        action: 'Suggerisci prossimo appuntamento basato sui pattern storici'
      });
    }

    // Raccomandazioni basate sui servizi
    if (details.premiumServices > 0 && details.avgServicePrice > 80) {
      recommendations.push({
        type: 'upselling',
        priority: 'medium',
        title: 'Cliente Premium',
        description: 'Cliente utilizza servizi di alto valore',
        action: 'Offri servizi premium esclusivi o pacchetti VIP'
      });
    }

    if (details.uniqueServices === 1 && details.totalServices > 3) {
      recommendations.push({
        type: 'diversification',
        priority: 'low',
        title: 'Cliente Specializzato',
        description: 'Cliente utilizza sempre lo stesso servizio',
        action: 'Suggerisci servizi complementari o correlati'
      });
    }

    // Raccomandazioni basate sull'affidabilità
    if (details.noShowRate > 20) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'Bassa Affidabilità',
        description: 'Alto tasso di no-show o cancellazioni',
        action: 'Implementa politica di conferma o deposito cauzionale'
      });
    }

    // Raccomandazioni basate sui pattern temporali
    if (details.avgInterval < 14) {
      recommendations.push({
        type: 'frequency',
        priority: 'medium',
        title: 'Cliente Frequente',
        description: 'Visita settimanalmente',
        action: 'Offri abbonamento o pacchetto mensile'
      });
    }

    return recommendations;
  };

  // Funzione per aprire il modal delle azioni
  const handleActionClick = (action: any) => {
    setSelectedAction(action);
    setIsActionModalOpen(true);
  };

  // Funzione per aggiornare i tag del client selezionato
  const handleTagUpdate = async (clientId: number, tags: ClientTag[]) => {
    console.log('[DEBUG] handleTagUpdate chiamato con:', { clientId, tags });
    
    // Enforce 5 tag limit
    if (tags.length > 5) {
      showToast({
        title: t('clients.tags.limit_reached', 'Limite tag raggiunto'),
        description: t('clients.tags.max_limit', 'Puoi selezionare massimo 5 tag per cliente'),
        type: "error",
      });
      return;
    }

    try {
      // Get salon_id to ensure we only update clients in this salon
      const salon_id = await getSalonId();
      if (!salon_id) {
        console.error("Impossibile determinare il salone.");
        showToast({
          title: "Errore",
          description: "Impossibile determinare il salone. Riprova più tardi.",
          type: "error",
        });
        return;
      }

      const { data, error } = await supabase
        .from('customers')
        .update({ tag: tags })
        .eq('id', clientId)
        .eq('salon_id', salon_id) // Ensure we only update clients in this salon
        .select();

      console.log('[DEBUG] Risultato update tag:', { data, error });

      if (error) {
        console.error('[ERROR] Errore nell\'aggiornamento dei tag:', error);
        showToast({
          title: t('common.error', 'Errore'),
          description: t('clients.tags.update_error', 'Impossibile aggiornare i tag: ') + error.message,
          type: "error",
        });
      } else {
        console.log('[DEBUG] Tag aggiornati con successo');
        
        // Aggiorna lo stato locale
        setClients(prevClients =>
          prevClients.map(c =>
            c.id === clientId ? { ...c, tag: tags } : c
          )
        );
        
        if (selectedClient && selectedClient.id === clientId) {
          setSelectedClient({ ...selectedClient, tag: tags });
        }
        
        setIsTagModalOpen(false);
        
        showToast({
          title: t('common.success', 'Successo'),
          description: t('clients.tags.updated_success', 'Tag aggiornati con successo'),
          type: "success",
        });
      }
    } catch (err) {
      console.error('[ERROR] Errore generale nell\'aggiornamento dei tag:', err);
      showToast({
        title: t('common.error', 'Errore'),
        description: t('clients.tags.general_error', 'Errore generale nell\'aggiornamento dei tag'),
        type: "error",
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Navbar secondaria clienti - senza ricerca */}
      <div className="sticky top-0 z-30 bg-background border-b border-border shadow-sm flex-shrink-0">
        <NavbarSecondariaClienti
          onRefresh={handleRefresh}
          onSortByScore={handleSortByScore}
          onSortByName={handleSortByName}
          onSortByDate={handleSortByDate}
          onClientsImported={fetchClients}
        />
      </div>
      {/* Main content: lista + dettaglio */}
      <div className="flex-1 flex flex-row min-h-0">
        {/* Sidebar: Lista clienti */}
        <aside
          className={`${isMobileDetailsOpen ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-2/5 min-h-0 border-r border-border bg-white overflow-y-auto transition-all duration-200`}
          style={{ maxWidth: '100vw' }}
        >
          <div className="p-0 lg:p-0 space-y-4 h-full flex flex-col min-h-0">
            {/* Search bar - ora sopra la lista clienti */}
            <div className="p-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('clients.search_placeholder', 'Cerca clienti...')}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="hidden lg:flex justify-between items-center mb-6">
              {/* <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Lista Clienti
              </h2> */}
            </div>
            <div className="space-y-2 lg:space-y-3 flex-1 min-h-0 overflow-y-auto pb-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)]">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce"></div>
                  </div>
                  <p className="mt-4 text-sm text-gray-500">{t('clients.loading', 'Caricamento clienti...')}</p>
                </div>
              ) : (
                <>
                  {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className={`p-3 lg:p-4 bg-white border-2 rounded-xl flex items-center justify-between cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-blue-300 ${
                    selectedClient?.id === client.id 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  onClick={() => handleSelectClient(client)
                  }
                >
                  <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
                    <div className={`p-1.5 lg:p-2 rounded-full ${
                      selectedClient?.id === client.id ? 'bg-blue-600' : 'bg-slate-200'
                    }`}>
                      <UserIcon className={`h-4 w-4 lg:h-5 lg:w-5 ${
                        selectedClient?.id === client.id ? 'text-white' : 'text-slate-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-800 text-sm lg:text-base">{client.nome}</p>
                        {Array.isArray(client.tag) && client.tag.length > 0 ? client.tag.map((tag) => (
                          <Badge
                            key={tag.id}
                            className={`${tag.color} text-xs`}
                          >
                            {tag.name}
                          </Badge>
                        )) : null}
                      </div>
                      <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4 mt-1">
                        <div className="flex items-center gap-1">
                          <MailIcon className="h-3 w-3 text-slate-500 flex-shrink-0" />
                          <span className="text-xs text-slate-600 truncate">{client.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <PhoneIcon className="h-3 w-3 text-slate-500 flex-shrink-0" />
                          <span className="text-xs text-slate-600">{client.telefono}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 lg:gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-purple-50 hover:border-purple-300 transition-colors duration-200 p-1.5 lg:p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(client);
                      }}
                    >
                      <PencilIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="hover:bg-red-600 transition-colors duration-200 p-1.5 lg:p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(client.id);
                      }}
                    >
                      <TrashIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
                </>
              )}
              {/* Spacer per margine inferiore */}
              <div className="h-2" />
            </div>
          </div>
        </aside>
        {/* Main: Dettaglio cliente */}
        <main
          className={`${isMobileDetailsOpen ? 'flex' : 'hidden lg:flex'} flex-1 flex-col w-full lg:w-3/5 bg-white shadow-xl border-l border-border min-h-0 overflow-y-auto transition-all duration-200 ${isMobileDetailsOpen ? 'fixed inset-0 z-50 lg:relative' : ''}`}
          style={isMobileDetailsOpen ? { overflowY: 'auto', maxHeight: '100vh' } : {}}
        >
          {/* Mobile back button */}
          {isMobileDetailsOpen && (
            <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-purple-50"
                onClick={handleBackToList}
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="p-4 lg:p-6 flex flex-col gap-3 lg:gap-4 flex-1 min-h-0">
            {/* Desktop header */}
            <div className="hidden lg:flex items-center gap-3">
              {/* <div className="p-2 bg-blue-600 rounded-lg">
                <ActivityIcon className="h-5 w-5 text-white" />
              </div> */}
              {/* ...rimosso titolo e icona... */}
            </div>
            {/* <Separator className="hidden lg:block bg-gradient-to-r from-blue-200 to-indigo-200 h-0.5" /> */}
            
            {selectedClient ? (
              <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-xl shadow-lg p-4 lg:p-5 transition-all duration-300 flex-1 min-h-0 flex flex-col">

                {/* Tabbed Details */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-full">
                        <UserIcon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg lg:text-xl font-bold text-slate-800">{selectedClient.nome}</h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                          {(() => {
                            const currentTab = availableTabs.find(tab => tab.value === activeTab);
                            const IconComponent = currentTab?.icon || ActivityIcon;
                            return (
                              <>
                                <IconComponent className="h-4 w-4" />
                                {currentTab?.label || "Statistiche"}
                                <ChevronDownIcon className="h-4 w-4" />
                              </>
                            );
                          })()}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {availableTabs.map((tab) => {
                          const IconComponent = tab.icon;
                          return (
                            <DropdownMenuItem
                              key={tab.value}
                              onClick={() => setActiveTab(tab.value)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <IconComponent className="h-4 w-4" />
                              {tab.label}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <TabsContent value="statistiche" className="space-y-3 h-full overflow-y-auto">
                      {/* Statistiche Cliente */}
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-blue-800 mb-2">{t('clients.statistics.title', 'Statistiche Cliente')}</h4>
                        {/* Filtro mese/anno */}
                        <div className="flex flex-wrap gap-2 items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">{t('clients.statistics.month', 'Mese')}:</span>
                            <Select
                              value={selectedStatsMonth.toString()}
                              onValueChange={(value) => setSelectedStatsMonth(Number(value))}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 12 }).map((_, i) => (
                                  <SelectItem key={i} value={i.toString()}>
                                    {new Date(0, i).toLocaleString("it-IT", { month: "long" })}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">{t('clients.statistics.year', 'Anno')}:</span>
                            <Select
                              value={selectedStatsYear.toString()}
                              onValueChange={(value) => setSelectedStatsYear(Number(value))}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 5 }).map((_, i) => {
                                  const year = new Date().getFullYear() - i;
                                  return (
                                    <SelectItem key={year} value={year.toString()}>
                                      {year}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {/* Statistiche filtrate */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Spese totali */}
                          <div className="bg-white rounded-lg border border-blue-100 p-3 flex flex-col items-center">
                            <span className="text-xs text-slate-600">{t('clients.statistics.total_expenses', 'Spese totali')}</span>
                            <span className="text-lg font-bold text-blue-700">
                              {formatCurrency(clientOrders.reduce((sum, o) => sum + (o.prezzo || 0), 0))}
                            </span>
                          </div>
                          {/* Spese annuali */}
                          <div className="bg-white rounded-lg border border-blue-100 p-3 flex flex-col items-center">
                            <span className="text-xs text-slate-600">{t('clients.statistics.yearly_expenses', 'Spese')} {selectedStatsYear}</span>
                            <span className="text-lg font-bold text-blue-700">
                              {formatCurrency(clientOrders
                                .filter(o => new Date(o.data).getFullYear() === selectedStatsYear)
                                .reduce((sum, o) => sum + (o.prezzo || 0), 0))}
                            </span>
                          </div>
                          {/* Appuntamenti annuali */}
                          <div className="bg-white rounded-lg border border-blue-100 p-3 flex flex-col items-center">
                            <span className="text-xs text-slate-600">{t('clients.statistics.yearly_appointments', 'Appuntamenti')} {selectedStatsYear}</span>
                            <span className="text-lg font-bold text-blue-700">
                              {clientOrders.filter(o => new Date(o.data).getFullYear() === selectedStatsYear).length}
                            </span>
                          </div>
                          {/* Spese mese filtrato */}
                          <div className="bg-white rounded-lg border border-blue-100 p-3 flex flex-col items-center">
                            <span className="text-xs text-slate-600">{t('clients.statistics.monthly_expenses', 'Spese')} {new Date(0, selectedStatsMonth).toLocaleString(currentLanguage === 'en' ? 'en-US' : 'it-IT', { month: "long" })}</span>
                            <span className="text-lg font-bold text-blue-700">
                              {formatCurrency(clientOrders
                                .filter(o => {
                                  const d = new Date(o.data);
                                  return d.getMonth() === selectedStatsMonth && d.getFullYear() === selectedStatsYear;
                                })
                                .reduce((sum, o) => sum + (o.prezzo || 0), 0))}
                            </span>
                          </div>
                          {/* Numero appuntamenti mese filtrato */}
                          <div className="bg-white rounded-lg border border-blue-100 p-3 flex flex-col items-center">
                            <span className="text-xs text-slate-600">{t('clients.statistics.monthly_appointments', 'Appuntamenti mese selezionato')}</span>
                            <span className="text-lg font-bold text-blue-700">
                              {clientOrders.filter(o => {
                                const d = new Date(o.data);
                                return d.getMonth() === selectedStatsMonth && d.getFullYear() === selectedStatsYear;
                              }).length}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Fine Statistiche Cliente */}
                    </TabsContent>

                    <TabsContent value="appuntamenti" className="space-y-3 h-full overflow-y-auto">
                      <div className="flex items-center gap-2 mb-3">
                        <CalendarIcon className="h-4 w-4 text-blue-600" />
                        <h4 className="text-base font-bold text-slate-800">{t('clients.appointments.history', 'Cronologia Appuntamenti')}</h4>
                      </div>
                      
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {clientOrders.length > 0 ? (
                          clientOrders.map((order) => (
                            <div key={order.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow duration-200">
                              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-2 gap-2">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="h-3 w-3 text-blue-600" />
                                  <span className="font-semibold text-sm text-slate-800">
                                    {new Date(order.data).toLocaleDateString("it-IT", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <EuroIcon className="h-3 w-3 text-green-600" />
                                  <span className="font-bold text-sm text-green-600">€{order.prezzo.toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="text-xs text-slate-600 space-y-0.5">
                                <p>{t('clients.appointments.services', 'Servizi')}: {order.services && order.services.length > 0 
                                  ? order.services.map(service => service.servizio).join(", ") 
                                  : (order.servizio || t('clients.appointments.not_specified', 'Non specificato'))}</p>
                                <p>{t('clients.appointments.status', 'Stato')}: {order.status || t('clients.appointments.not_specified', 'Non specificato')}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 lg:py-8">
                            <CalendarIcon className="h-8 w-8 lg:h-12 lg:w-12 text-slate-300 mx-auto mb-2 lg:mb-3" />
                            <p className="text-sm text-slate-500">{t('clients.appointments.no_appointments', 'Nessun appuntamento disponibile.')}</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="info" className="space-y-3 h-full overflow-y-auto">
                      <div className="flex items-start gap-2 p-3 lg:p-2 bg-white rounded-lg border border-slate-200">
                        <ActivityIcon className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-slate-600 block">{t('clients.info.notes', 'Note')}</span>
                          <p className="text-sm text-slate-800">{selectedClient.note || t('clients.info.no_notes', 'Nessuna nota')}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 lg:p-2 bg-white rounded-lg border border-slate-200">
                        <ActivityIcon className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-slate-600 block">{t('clients.info.description', 'Descrizione')}</span>
                          <p className="text-sm text-slate-800">{selectedClient.descrizione || t('clients.info.no_description', 'Nessuna descrizione')}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 lg:p-2 bg-white rounded-lg border border-slate-200">
                        <CreditCardIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-slate-600 block">{t('clients.info.assigned_coupon', 'Coupon Abbinato')}</span>
                          {selectedClient.coupon ? (
                            <div className="flex flex-col lg:flex-row lg:items-center gap-2 mt-1">
                              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs w-fit">
                                {selectedClient.coupon.code}
                              </Badge>
                              <span className="text-sm text-slate-800">{selectedClient.coupon.description}</span>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">{t('clients.info.no_coupon', 'Nessun coupon abbinato')}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 lg:p-2 bg-white rounded-lg border border-slate-200">
                        <TagIcon className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-600 block">{t('clients.info.client_tags', 'Tag Cliente')}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsTagModalOpen(true)}
                              className="text-xs"
                            >
                              {t('clients.info.manage_tags', 'Gestisci Tag')}
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {Array.isArray(selectedClient?.tag) && selectedClient.tag.length > 0 ? (
                              selectedClient.tag.map((tag) => (
                                <Badge
                                  key={tag.id}
                                  className={`${tag.color} text-xs`}
                                >
                                  {tag.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-slate-500">{t('clients.info.no_tags', 'Nessun tag')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="fatturazione" className="space-y-3 h-full overflow-y-auto">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="bg-white p-2 rounded border">
                          <span className="text-xs font-medium text-slate-600 block">Tipo Cliente</span>
                          <p className="text-sm text-slate-800">{selectedClient.tipo_cliente || "Non specificato"}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-xs font-medium text-slate-600 block">Intestazione Fattura</span>
                          <p className="text-sm text-slate-800">{selectedClient.intestazione_fattura || "Non specificata"}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-xs font-medium text-slate-600 block">Codice Fiscale</span>
                          <p className="text-sm text-slate-800">{selectedClient.codice_fiscale || "Non specificato"}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-xs font-medium text-slate-600 block">Partita IVA</span>
                          <p className="text-sm text-slate-800">{selectedClient.partita_iva || "Non specificata"}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-xs font-medium text-slate-600 block">PEC</span>
                          <p className="text-sm text-slate-800">{selectedClient.pec || "Non specificata"}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-xs font-medium text-slate-600 block">Codice SDI</span>
                          <p className="text-sm text-slate-800">{selectedClient.codice_sdi || "Non specificato"}</p>
                        </div>
                      </div>

                      {/* Informazioni Fattura */}
                      {(selectedClient.numero_fattura || selectedClient.data_fattura || selectedClient.totale || selectedClient.fattura_emessa) && (
                        <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 mt-4">
                          <h4 className="text-sm font-bold text-indigo-800 mb-3">Dettagli Fattura</h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div className="bg-white p-2 rounded border">
                              <span className="text-xs font-medium text-slate-600 block">Numero Fattura</span>
                              <p className="text-sm text-slate-800">{selectedClient.numero_fattura || "Non emessa"}</p>
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <span className="text-xs font-medium text-slate-600 block">Data Fattura</span>
                              <p className="text-sm text-slate-800">{selectedClient.data_fattura || "Non specificata"}</p>
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <span className="text-xs font-medium text-slate-600 block">Totale</span>
                              <p className="text-sm text-slate-800 font-semibold">{selectedClient.totale ? `€${selectedClient.totale.toFixed(2)}` : "Non specificato"}</p>
                            </div>
                            <div className="bg-white p-2 rounded border flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-600">Fattura Emessa:</span>
                              <Badge variant={selectedClient.fattura_emessa ? "default" : "secondary"} className={selectedClient.fattura_emessa ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                {selectedClient.fattura_emessa ? "Sì" : "No"}
                              </Badge>
                            </div>
                          </div>
                          {selectedClient.note_fattura && (
                            <div className="bg-white p-2 rounded border mt-3">
                              <span className="text-xs font-medium text-slate-600 block">Note Fattura</span>
                              <p className="text-sm text-slate-800">{selectedClient.note_fattura}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="indirizzo" className="space-y-3 h-full overflow-y-auto">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="bg-white p-2 rounded border lg:col-span-2">
                          <span className="text-xs font-medium text-slate-600 block">Indirizzo</span>
                          <p className="text-sm text-slate-800">{selectedClient.indirizzo_fatturazione || "Non specificato"}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-xs font-medium text-slate-600 block">CAP</span>
                          <p className="text-sm text-slate-800">{selectedClient.cap || "Non specificato"}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-xs font-medium text-slate-600 block">Città</span>
                          <p className="text-sm text-slate-800">{selectedClient.citta || "Non specificata"}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-xs font-medium text-slate-600 block">Provincia</span>
                          <p className="text-sm text-slate-800">{selectedClient.provincia || "Non specificata"}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-xs font-medium text-slate-600 block">Nazione</span>
                          <p className="text-sm text-slate-800">{selectedClient.nazione || "Non specificata"}</p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="pagamento" className="space-y-3 h-full overflow-y-auto">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="bg-white p-2 rounded border">
                          <span className="text-xs font-medium text-slate-600 block">Metodo di Pagamento</span>
                          <p className="text-sm text-slate-800">{selectedClient.metodo_pagamento || "Non specificato"}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-xs font-medium text-slate-600 block">Data Pagamento</span>
                          <p className="text-sm text-slate-800">{selectedClient.data_pagamento || "Non specificata"}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-xs font-medium text-slate-600 block">Valuta</span>
                          <p className="text-sm text-slate-800">{selectedClient.valuta || "EUR"}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-xs font-medium text-slate-600 block">Aliquota IVA</span>
                          <p className="text-sm text-slate-800">{selectedClient.aliquota_iva ? `${selectedClient.aliquota_iva}%` : "Non specificata"}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-xs font-medium text-slate-600 block">Ritenuta d'acconto</span>
                          <p className="text-sm text-slate-800">{selectedClient.ritenuta_acconto ? `${selectedClient.ritenuta_acconto}%` : "Non specificata"}</p>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="text-xs font-medium text-slate-600 block">Telefono Fatturazione</span>
                          <p className="text-sm text-slate-800">{selectedClient.telefono_fatturazione || "Non specificato"}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
                        <div className="bg-white p-2 rounded border flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-600">Pagato:</span>
                          <Badge variant={selectedClient.pagato ? "default" : "secondary"} className={selectedClient.pagato ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {selectedClient.pagato ? "Sì" : "No"}
                          </Badge>
                        </div>
                        <div className="bg-white p-2 rounded border flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-600">IVA Inclusa:</span>
                          <Badge variant={selectedClient.iva_inclusa ? "default" : "secondary"} className={selectedClient.iva_inclusa ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {selectedClient.iva_inclusa ? "Sì" : "No"}
                          </Badge>
                        </div>
                        <div className="bg-white p-2 rounded border flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-600">Bollo:</span>
                          <Badge variant={selectedClient.bollo ? "default" : "secondary"} className={selectedClient.bollo ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}>
                            {selectedClient.bollo ? "Necessario" : "Non necessario"}
                          </Badge>
                        </div>
                      </div>

                      {/* Documenti e Link */}
                      {(selectedClient.fattura_pdf_url || selectedClient.firma_cliente_url || selectedClient.documento_identita_url) && (
                        <div className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200 mt-4">
                          <h4 className="text-sm font-bold text-gray-800 mb-3">Documenti</h4>
                          <div className="space-y-2">
                            {selectedClient.fattura_pdf_url && (
                              <div className="bg-white p-2 rounded border">
                                <span className="text-xs font-medium text-slate-600 block">PDF Fattura</span>
                                <a href={selectedClient.fattura_pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                  Visualizza PDF
                                </a>
                              </div>
                            )}
                            {selectedClient.firma_cliente_url && (
                              <div className="bg-white p-2 rounded border">
                                <span className="text-xs font-medium text-slate-600 block">Firma Cliente</span>
                                <a href={selectedClient.firma_cliente_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                  Visualizza Firma
                                </a>
                              </div>
                            )}
                            {selectedClient.documento_identita_url && (
                              <div className="bg-white p-2 rounded border">
                                <span className="text-xs font-medium text-slate-600 block">Documento Identità</span>
                                <a href={selectedClient.documento_identita_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                  Visualizza Documento
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                                        <TabsContent value="analisi" className="space-y-4 h-full overflow-y-auto">
                      {/* Valutazione Cliente */}
                      {selectedClient && (
                        <>
                          {/* Header con punteggio e livello */}
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-lg font-bold text-blue-800">Analisi Cliente</h4>
                              {(() => {
                                const score = calculateClientScore(clientOrders, selectedClient);
                                const level = getClientLevel(score);
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl">{level.icon}</span>
                                    <Badge className={`${level.color} border`}>
                                      {level.level} - {score}%
                                    </Badge>
                                  </div>
                                );
                              })()}
                            </div>
                            
                            {/* Barra di progresso */}
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${calculateClientScore(clientOrders, selectedClient)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Sezione Probabilità di Ritorno */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-lg font-bold text-green-800">🧠 Probabilità di Ritorno</h4>
                              {(() => {
                                const probability = calculateReturnProbability(clientOrders, selectedClient);
                                const probabilityColor = probability >= 80 ? 'text-green-600' : probability >= 60 ? 'text-yellow-600' : 'text-red-600';
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl">🎯</span>
                                    <Badge className={`bg-green-100 ${probabilityColor} border-green-200`}>
                                      {probability}%
                                    </Badge>
                                  </div>
                                );
                              })()}
                            </div>
                            
                            {/* Barra di progresso probabilità */}
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${calculateReturnProbability(clientOrders, selectedClient)}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Dettagli del punteggio */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(() => {
                              const details = getScoreDetails(clientOrders, selectedClient);
                              return (
                                <>
                                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h5 className="text-sm font-semibold text-gray-800 mb-3">📊 Metriche Principali</h5>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-xs text-gray-600">Appuntamenti questo mese:</span>
                                        <span className="text-xs font-medium">{details.monthlyOrders}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-xs text-gray-600">Totale appuntamenti:</span>
                                        <span className="text-xs font-medium">{details.totalOrders}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-xs text-gray-600">Spesa totale:</span>
                                        <span className="text-xs font-medium">€{details.totalSpent.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-xs text-gray-600">Appuntamenti futuri (30gg):</span>
                                        <span className="text-xs font-medium">{details.futureOrders}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h5 className="text-sm font-semibold text-gray-800 mb-3">📈 Comportamento</h5>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-xs text-gray-600">No-show rate:</span>
                                        <span className={`text-xs font-medium ${details.noShowRate > 10 ? 'text-red-600' : 'text-green-600'}`}>
                                          {details.noShowRate.toFixed(1)}%
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-xs text-gray-600">Ultima visita:</span>
                                        <span className={`text-xs font-medium ${details.daysSinceLastVisit <= 30 ? 'text-green-600' : details.daysSinceLastVisit <= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                                          {details.daysSinceLastVisit} giorni fa
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-xs text-gray-600">Coupon attivo:</span>
                                        <span className={`text-xs font-medium ${details.hasCoupon ? 'text-green-600' : 'text-gray-500'}`}>
                                          {details.hasCoupon ? 'Sì' : 'No'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          {/* Dettagli della probabilità di ritorno */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(() => {
                              const probDetails = getProbabilityDetails(clientOrders, selectedClient);
                              return (
                                <>
                                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h5 className="text-sm font-semibold text-gray-800 mb-3">🎯 Fattori Probabilità</h5>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-xs text-gray-600">Giorni ultima visita:</span>
                                        <span className={`text-xs font-medium ${probDetails.daysSinceLastVisit <= 30 ? 'text-green-600' : probDetails.daysSinceLastVisit <= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                                          {probDetails.daysSinceLastVisit} giorni
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-xs text-gray-600">Frequenza media:</span>
                                        <span className={`text-xs font-medium ${probDetails.avgInterval <= 21 ? 'text-green-600' : probDetails.avgInterval <= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                          {probDetails.avgInterval} giorni
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-xs text-gray-600">Appuntamento futuro:</span>
                                        <span className={`text-xs font-medium ${probDetails.hasFutureAppointment ? 'text-green-600' : 'text-gray-500'}`}>
                                          {probDetails.hasFutureAppointment ? 'Sì' : 'No'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-xs text-gray-600">No-show rate:</span>
                                        <span className={`text-xs font-medium ${probDetails.noShowRate > 20 ? 'text-red-600' : 'text-green-600'}`}>
                                          {probDetails.noShowRate.toFixed(1)}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h5 className="text-sm font-semibold text-gray-800 mb-3">📊 Interpretazione</h5>
                                    <div className="space-y-2 text-xs text-gray-600">
                                      <div className="flex items-start gap-2">
                                        <span className="text-green-600">🟢</span>
                                        <span><strong>Alta probabilità (80-100%):</strong> Cliente molto fedele, visita recente, frequenza alta</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-yellow-600">🟡</span>
                                        <span><strong>Media probabilità (60-79%):</strong> Cliente regolare, potrebbe tornare</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-red-600">🔴</span>
                                        <span><strong>Bassa probabilità (0-59%):</strong> Cliente inattivo, rischio di perdita</span>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          {/* Spiegazione del sistema di punteggio */}
                          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                            <h5 className="text-sm font-semibold text-gray-800 mb-3">⚙️ Sistema di Punteggio</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
                              <div>
                                <p className="font-medium mb-2">Fattori Positivi:</p>
                                <ul className="space-y-1">
                                  <li>• <strong>Frequenza (20%):</strong> Appuntamenti mensili</li>
                                  <li>• <strong>Spesa (20%):</strong> Valore totale speso</li>
                                  <li>• <strong>Regolarità (10%):</strong> Media giorni tra visite</li>
                                  <li>• <strong>Futuro (10%):</strong> Prenotazioni prossimi 30gg</li>
                                  <li>• <strong>Recenza (10%):</strong> Ultima visita recente</li>
                                  <li>• <strong>Team (10%):</strong> Feedback interno</li>
                                  <li>• <strong>Coupon (10%):</strong> Fidelizzazione</li>
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium mb-2">Fattori Negativi:</p>
                                <ul className="space-y-1">
                                  <li>• <strong>No-show (-10%):</strong> Appuntamenti saltati</li>
                                </ul>
                                <p className="font-medium mt-4 mb-2">Livelli:</p>
                                <ul className="space-y-1">
                                  <li>🥇 <strong>Oro:</strong> 80-100%</li>
                                  <li>🥈 <strong>Argento:</strong> 60-79%</li>
                                  <li>🥉 <strong>Bronzo:</strong> 0-59%</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* Sistema di Suggerimenti Intelligenti */}
                          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-200 p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-bold text-violet-800">🎯 ZugFlow AI Helper</h4>
                              <span className="text-2xl">🤖</span>
                            </div>
                            
                            {(() => {
                              const { suggestions, actions } = generateSmartSuggestions(clientOrders, selectedClient);
                              return (
                                <>
                                  {/* Suggerimenti Principali */}
                                  <div className="space-y-3 mb-4">
                                    {suggestions.slice(0, 3).map((suggestion, index) => (
                                      <div 
                                        key={index}
                                        className={`p-3 rounded-lg border-l-4 ${
                                          suggestion.type === 'error' ? 'bg-red-50 border-red-400' :
                                          suggestion.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                                          suggestion.type === 'success' ? 'bg-green-50 border-green-400' :
                                          'bg-blue-50 border-blue-400'
                                        }`}
                                      >
                                        <div className="flex items-start gap-3">
                                          <span className="text-xl">{suggestion.icon}</span>
                                          <div className="flex-1">
                                            <h5 className="text-sm font-semibold text-gray-800 mb-1">
                                              {suggestion.title}
                                            </h5>
                                            <p className="text-xs text-gray-600 mb-2">
                                              {suggestion.message}
                                            </p>
                                            <p className="text-xs font-medium text-gray-700">
                                              💡 <strong>Azione suggerita:</strong> {suggestion.action}
                                            </p>
                                          </div>
                                          {suggestion.priority === 'high' && (
                                            <Badge className="bg-red-100 text-red-800 text-xs">
                                              Alta Priorità
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Azioni Rapide */}
                                  {actions.length > 0 && (
                                    <div className="mb-4">
                                      <h5 className="text-sm font-semibold text-gray-800 mb-3">⚡ Azioni Rapide</h5>
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {actions.map((action, index) => (
                                          <Button
                                            key={index}
                                            size="sm"
                                            className={`${action.color} text-white text-xs h-8`}
                                            onClick={() => handleActionClick(action)}
                                          >
                                            <span className="mr-1">{action.icon}</span>
                                            {action.label}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Statistiche AI */}
                                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                                    <h5 className="text-sm font-semibold text-gray-800 mb-2">📊 Analisi AI</h5>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Priorità suggerimenti:</span>
                                        <span className="font-medium">
                                          {suggestions.filter(s => s.priority === 'high').length} alta, {suggestions.filter(s => s.priority === 'medium').length} media
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Azioni disponibili:</span>
                                        <span className="font-medium">{actions.length}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Stato cliente:</span>
                                        <span className={`font-medium ${
                                          suggestions.some(s => s.type === 'error') ? 'text-red-600' :
                                          suggestions.some(s => s.type === 'warning') ? 'text-yellow-600' :
                                          'text-green-600'
                                        }`}>
                                          {suggestions.some(s => s.type === 'error') ? 'Attenzione' :
                                           suggestions.some(s => s.type === 'warning') ? 'Monitoraggio' :
                                           'Stabile'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          {/* Spiegazione del sistema di probabilità */}
                          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                            <h5 className="text-sm font-semibold text-gray-800 mb-3">🧠 Sistema di Probabilità di Ritorno</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
                              <div>
                                <p className="font-medium mb-2">Fattori di Probabilità:</p>
                                <ul className="space-y-1">
                                  <li>• <strong>Recenza (30%):</strong> Giorni dall'ultima visita</li>
                                  <li>• <strong>Frequenza (30%):</strong> Media giorni tra appuntamenti</li>
                                  <li>• <strong>Futuro (20%):</strong> Appuntamento già prenotato</li>
                                  <li>• <strong>Feedback (10%):</strong> Valutazione interna</li>
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium mb-2">Fattori Negativi:</p>
                                <ul className="space-y-1">
                                  <li>• <strong>No-show (-10%):</strong> Se {'>'}20% appuntamenti saltati</li>
                                </ul>
                                <p className="font-medium mt-4 mb-2">Interpretazione:</p>
                                <ul className="space-y-1">
                                  <li>🟢 <strong>Alta (80-100%):</strong> Molto probabile che torni</li>
                                  <li>🟡 <strong>Media (60-79%):</strong> Probabile che torni</li>
                                  <li>🔴 <strong>Bassa (0-59%):</strong> Rischio di perdita cliente</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <UserIcon className="h-12 w-12 lg:h-16 lg:w-16 text-slate-300 mb-3" />
                <p className="text-sm lg:text-base text-slate-500">{t('clients.select_client_message', 'Seleziona un cliente per visualizzare i dettagli')}</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Order Dialog */}
      <CreateOrder isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
      
      {/* Edit Client Modal */}
      {isEditModalOpen && (
        <EditFormModal
          isDialogOpen={isEditModalOpen}
          setIsDialogOpen={setIsEditModalOpen}
          clientId={editingClient?.id || null} // Passa l'id del cliente
          onClientUpdated={handleClientUpdated} // Passa la callback per l'aggiornamento
        />
      )}
      
      {/* New Client Form Dialog */}
      {isClientFormOpen && (
        <Dialog open={isClientFormOpen} onOpenChange={setIsClientFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('clients.dialog.new_client_title', 'Nuovo Cliente')}</DialogTitle>
              <DialogDescription>{t('clients.dialog.new_client_description', 'Compila il modulo per aggiungere un nuovo cliente.')}</DialogDescription>
            </DialogHeader>
            <CreateClientForm setIsDialogOpen={setIsClientFormOpen} />
            <DialogFooter>
      
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modale Gestione Tag */}
      {selectedClient && isTagModalOpen && (
        <TagManager
          isOpen={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          selectedTags={Array.isArray(selectedClient.tag) && selectedClient.tag.length > 0 ? selectedClient.tag.map(tag => ({
            id: tag.id,
            name: tag.name,
            color: tag.color,
            category: tag.category || 'profile'
          })) : []}
          onTagsUpdate={async (tagList) => {
            console.log('[DEBUG] onTagsUpdate chiamato con tagList:', tagList);
            
            // Ricostruisci i tag con la struttura completa richiesta dal backend
            const tagsWithCategory = tagList.map(tag => {
              // Trova la categoria dal CLIENT_TAGS globale
              let foundCategory: ClientTag["category"] = "profile";
              Object.entries(CLIENT_TAGS).forEach(([cat, tags]) => {
                if (tags.some(t => t.id === tag.id)) {
                  foundCategory = cat as ClientTag["category"];
                }
              });
              return {
                id: String(tag.id), // Ensure id is always a string
                name: tag.name,
                color: tag.color,
                category: foundCategory,
              };
            });
            
            console.log('[DEBUG] tagsWithCategory ricostruiti:', tagsWithCategory);
            await handleTagUpdate(selectedClient.id, tagsWithCategory);
          }}
        />
      )}

      {/* Modale Azioni Rapide */}
      {isActionModalOpen && selectedAction && (
        <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">{selectedAction.icon}</span>
                {selectedAction.label}
              </DialogTitle>
              <DialogDescription>
                {t('clients.dialog.recommended_action', 'Azione consigliata per il cliente')} {selectedClient?.nome}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Descrizione dell'azione */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">📋 {t('clients.dialog.action_description', 'Descrizione Azione')}</h4>
                <p className="text-sm text-blue-700">
                  {(() => {
                    switch (selectedAction.type) {
                      case 'whatsapp':
                        return `Invia un messaggio WhatsApp personalizzato a ${selectedClient?.nome} per invitarlo a prenotare un nuovo appuntamento. Questo è consigliato per clienti inattivi da più di 60 giorni.`;
                      case 'book':
                        return `Crea una nuova prenotazione per ${selectedClient?.nome}. Proponi servizi basati sulla sua storia e preferenze.`;
                      case 'package':
                        return `Proponi un pacchetto abbonamento premium a ${selectedClient?.nome}. Ideale per clienti ad alto valore che spendono più di €500.`;
                      case 'vip':
                        return `Offri un piano fidelizzazione VIP a ${selectedClient?.nome}. Perfetto per clienti molto frequenti che visitano ogni 14 giorni in media.`;
                      case 'reminder':
                        return `Configura un sistema di reminder personalizzato per ${selectedClient?.nome} per ridurre i no-show.`;
                      case 'exclusive':
                        return `Offri servizi esclusivi e attenzioni speciali a ${selectedClient?.nome}. Riservato ai clienti VIP con punteggio superiore all'80%.`;
                      case 'retention':
                        return `Implementa una strategia di retention urgente per ${selectedClient?.nome}. Cliente a rischio con bassa probabilità di ritorno.`;
                      default:
                        return `Azione personalizzata per ${selectedClient?.nome}.`;
                    }
                  })()}
                </p>
              </div>

              {/* Consigli specifici */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">💡 {t('clients.dialog.operational_tips', 'Consigli Operativi')}</h4>
                <div className="space-y-2 text-sm text-green-700">
                  {(() => {
                    switch (selectedAction.type) {
                      case 'whatsapp':
                        return (
                          <>
                            <p>• <strong>Timing:</strong> Invia il messaggio tra le 10:00 e le 18:00</p>
                            <p>• <strong>Contenuto:</strong> Menziona l'ultima visita e propone un servizio specifico</p>
                            <p>• <strong>Follow-up:</strong> Se non risponde entro 24h, invia un secondo messaggio</p>
                          </>
                        );
                      case 'book':
                        return (
                          <>
                            <p>• <strong>Servizi:</strong> Suggerisci servizi simili a quelli già prenotati</p>
                            <p>• <strong>Orari:</strong> Proponi orari in cui il cliente ha già prenotato in passato</p>
                            <p>• <strong>Promozioni:</strong> Applica eventuali coupon o sconti disponibili</p>
                          </>
                        );
                      case 'package':
                        return (
                          <>
                            <p>• <strong>Valore:</strong> Proponi pacchetti da 3-6 appuntamenti con sconto del 15-20%</p>
                            <p>• <strong>Durata:</strong> Pacchetti validi per 6-12 mesi</p>
                            <p>• <strong>Bonus:</strong> Includi servizi extra o prodotti omaggio</p>
                          </>
                        );
                      case 'vip':
                        return (
                          <>
                            <p>• <strong>Benefici:</strong> Priorità prenotazioni, sconti esclusivi, servizi premium</p>
                            <p>• <strong>Comunicazione:</strong> Trattamento speciale e attenzioni personalizzate</p>
                            <p>• <strong>Fidelizzazione:</strong> Programma punti e ricompense esclusive</p>
                          </>
                        );
                      case 'reminder':
                        return (
                          <>
                            <p>• <strong>Timing:</strong> SMS 24h prima, WhatsApp 2h prima</p>
                            <p>• <strong>Contenuto:</strong> Messaggi personalizzati e cordiali</p>
                            <p>• <strong>Gestione:</strong> Sistema di conferma e cancellazione facile</p>
                          </>
                        );
                      case 'exclusive':
                        return (
                          <>
                            <p>• <strong>Servizi:</strong> Trattamenti esclusivi non disponibili al pubblico</p>
                            <p>• <strong>Orari:</strong> Slot riservati e flessibili</p>
                            <p>• <strong>Esperienza:</strong> Attenzioni speciali e ambiente VIP</p>
                          </>
                        );
                      case 'retention':
                        return (
                          <>
                            <p>• <strong>Urgenza:</strong> Contatto immediato entro 48h</p>
                            <p>• <strong>Offerta:</strong> Sconto significativo o servizio gratuito</p>
                            <p>• <strong>Follow-up:</strong> Monitoraggio intensivo per 2-4 settimane</p>
                          </>
                        );
                      default:
                        return <p>• Personalizza l'approccio in base alle preferenze del cliente</p>;
                    }
                  })()}
                </div>
              </div>

              {/* Metriche e obiettivi */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">📊 {t('clients.dialog.goals_metrics', 'Obiettivi e Metriche')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-purple-700">
                  <div>
                    <p className="font-medium mb-1">{t('clients.dialog.objective', 'Obiettivo')}:</p>
                    <p>{(() => {
                      switch (selectedAction.type) {
                        case 'whatsapp': return t('clients.dialog.objective_whatsapp', 'Ripristinare la relazione e ottenere una prenotazione');
                        case 'book': return t('clients.dialog.objective_book', 'Creare una nuova prenotazione entro 7 giorni');
                        case 'package': return t('clients.dialog.objective_package', 'Vendere un pacchetto entro 30 giorni');
                        case 'vip': return t('clients.dialog.objective_vip', 'Aumentare la frequenza e il valore medio');
                        case 'reminder': return t('clients.dialog.objective_reminder', 'Ridurre i no-show del 50%');
                        case 'exclusive': return t('clients.dialog.objective_exclusive', 'Aumentare la soddisfazione e fidelizzazione');
                        case 'retention': return t('clients.dialog.objective_retention', 'Evitare la perdita del cliente');
                        default: return t('clients.dialog.objective_default', 'Migliorare la relazione cliente');
                      }
                    })()}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">{t('clients.dialog.kpi_to_monitor', 'KPI da monitorare')}:</p>
                    <p>{(() => {
                      switch (selectedAction.type) {
                        case 'whatsapp': return t('clients.dialog.kpi_whatsapp', 'Tasso di risposta e conversione');
                        case 'book': return t('clients.dialog.kpi_book', 'Prenotazioni create e completate');
                        case 'package': return t('clients.dialog.kpi_package', 'Pacchetti venduti e fatturato');
                        case 'vip': return t('clients.dialog.kpi_vip', 'Frequenza visite e valore medio');
                        case 'reminder': return t('clients.dialog.kpi_reminder', 'Tasso di presenza agli appuntamenti');
                        case 'exclusive': return t('clients.dialog.kpi_exclusive', 'Soddisfazione e rinnovo servizi');
                        case 'retention': return t('clients.dialog.kpi_retention', 'Ritorno del cliente entro 30 giorni');
                        default: return t('clients.dialog.kpi_default', 'Soddisfazione generale');
                      }
                    })()}</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>
                {t('common.close', 'Chiudi')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AnagraficaClienti;
