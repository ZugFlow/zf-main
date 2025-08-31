import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Euro, 
  Activity, 
  Search, 
  Plus, 
  ArrowLeft, 
  Edit, 
  Trash, 
  Tag, 
  Star,
  Clock,
  TrendingUp,
  CreditCard,
  MapPin,
  FileText,
  ChevronRight,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  Users,
  Award,
  Target,
  BarChart3,
  PieChart,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Info,
  PhoneCall,
  MessageSquare,
  CalendarDays,
  DollarSign,
  ShoppingBag,
  Heart,
  Crown,
  Zap,
  Shield,
  Gift,
  Clock3,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  Check,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { createClient } from "@/utils/supabase/client";
import { showToast } from "../HelperToast";
import { getSalonId } from '@/utils/getSalonId';
import { CreateClientForm } from "./_component/form";
import EditFormModal from "./_component/EditFormModal";
import { TagManager } from "./_components/TagManager";
import { MobileNavbar } from "../navbarMobile";
import { ChevronLeft, MoreVertical, Scissors, Eye, Settings, Minus, Menu, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const supabase = createClient();

// Interfaces from AnagraficaClienti.tsx
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
  tag?: ClientTag[] | null;
  created_at?: string;
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

interface AnagraficaClientiMobileProps {
  onCloseMobileView?: () => void;
  hasPermission?: (permission: string) => boolean;
  userRole?: string | null;
  // Add toggle functions for mobile navbar
  toggleDay?: () => void;
  toggleClients?: () => void;
  toggleServices?: () => void;
  togglePermessiFerie?: () => void;
  toggleOnlineBookings?: () => void;
  toggleTaskManager?: () => void;
  toggleImpostazioni?: () => void;
  // Add visibility states for mobile navbar
  showDay?: boolean;
  showClients?: boolean;
  showGestioneServizi?: boolean;
  showPermessiFerie?: boolean;
  showOnlineBookings?: boolean;
  showTaskManager?: boolean;
  showImpostazioni?: boolean;
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
} as const;

export function AnagraficaClientiMobile({
  onCloseMobileView,
  hasPermission,
  userRole,
  // Add toggle functions for mobile navbar
  toggleDay,
  toggleClients,
  toggleServices,
  togglePermessiFerie,
  toggleOnlineBookings,
  toggleTaskManager,
  toggleImpostazioni,
  // Add visibility states for mobile navbar
  showDay,
  showClients,
  showGestioneServizi,
  showPermessiFerie,
  showOnlineBookings,
  showTaskManager,
  showImpostazioni
}: AnagraficaClientiMobileProps) {
  console.log("🚀 [AnagraficaClientiMobile] Componente montato");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Modal states
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("statistiche");

  // Pull to refresh gesture
  const [refreshY, setRefreshY] = useState(0);

  // Fetch clients from database with optimized query
  const fetchClients = useCallback(async () => {
    console.log("🔄 [AnagraficaClientiMobile] Iniziando caricamento clienti...");
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("❌ [AnagraficaClientiMobile] Utente non autenticato.");
        setIsLoading(false);
        return;
      }
      
      const salon_id = await getSalonId();
      if (!salon_id) {
        console.error("❌ [AnagraficaClientiMobile] Impossibile determinare il salone.");
        setIsLoading(false);
        return;
      }
      
      // Query ottimizzata: seleziona solo i campi necessari
      const { data, error } = await supabase
        .from("customers")
        .select(`
          id,
          nome,
          telefono,
          email,
          note,
          customer_uuid,
          tag,
          created_at
        `)
        .eq("salon_id", salon_id)
        .order("nome", { ascending: true });
        
      if (error) {
        console.error("❌ [AnagraficaClientiMobile] Errore nel recupero dei clienti:", error.message);
        showToast({
          title: "Errore",
          description: "Errore nel caricamento dei clienti",
          type: "error"
        });
      } else {
        console.log("📊 [AnagraficaClientiMobile] Clienti recuperati:", data?.length || 0);
        
        // Mappatura ottimizzata con parsing dei tag
        const mappedClients = data ? data.map((client) => ({
          ...client,
          tag: client.tag ? (() => {
            try {
              return JSON.parse(client.tag);
            } catch (e) {
              console.error("⚠️ [AnagraficaClientiMobile] Errore nel parsing dei tag per il cliente:", client.id, e);
              return null;
            }
          })() : null,
        })) : [];
        
        setClients(mappedClients);
        console.log("✅ [AnagraficaClientiMobile] Caricamento completato, clienti mappati:", mappedClients.length);
      }
    } catch (error) {
      console.error("❌ [AnagraficaClientiMobile] Errore generico:", error);
      showToast({
        title: "Errore",
        description: "Errore nel caricamento dei clienti",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch client orders
  const fetchClientOrders = async (customer_uuid: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_services (
          id,
          order_id,
          service_id,
          services (name, price)
        )
      `)
      .eq("customer_uuid", customer_uuid)
      .order("data", { ascending: false });

    if (error) {
      console.error("Errore nel recupero degli ordini:", error);
      return [];
    }

    return data.map((order) => ({
      ...order,
      services: order.order_services?.map((os: any) => ({
        id: os.id,
        order_id: os.order_id,
        service_id: os.service_id,
        servizio: os.services?.name || "Servizio",
        price: os.services?.price || 0,
      })) || [],
    }));
  };

  // Calculate client score with memoization
  const calculateClientScore = useCallback((orders: Order[], client: Client): number => {
    if (orders.length === 0) return 0;

    const totalSpent = orders.reduce((sum, order) => sum + order.prezzo, 0);
    const avgSpent = totalSpent / orders.length;
    const frequency = orders.length;
    const recency = orders.length > 0 ? 
      (new Date().getTime() - new Date(orders[0].data).getTime()) / (1000 * 60 * 60 * 24) : 365;

    // Normalize values
    const normalizedSpent = Math.min(avgSpent / 100, 1); // Max 100€ per appuntamento
    const normalizedFrequency = Math.min(frequency / 10, 1); // Max 10 appuntamenti
    const normalizedRecency = Math.max(0, 1 - (recency / 365)); // Recent = better

    // Weighted score
    return Math.round((normalizedSpent * 0.4 + normalizedFrequency * 0.4 + normalizedRecency * 0.2) * 100);
  }, []);

  // Get client level with memoization
  const getClientLevel = useCallback((score: number) => {
    if (score >= 80) return { level: 'VIP', color: 'bg-purple-100 text-purple-800', icon: Crown };
    if (score >= 60) return { level: 'Fedele', color: 'bg-blue-100 text-blue-800', icon: Heart };
    if (score >= 40) return { level: 'Regolare', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    if (score >= 20) return { level: 'Occasionale', color: 'bg-orange-100 text-orange-800', icon: Clock };
    return { level: 'Nuovo', color: 'bg-gray-100 text-gray-800', icon: User };
  }, []);

  // Handle client selection
  const handleSelectClient = async (client: Client) => {
    setSelectedClient(client);
    const orders = await fetchClientOrders(client.customer_uuid);
    setClientOrders(orders);
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedClient(null);
    setClientOrders([]);
  };

  // Handle search with debouncing
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Memoized filtered clients based on search
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) {
      return clients;
    }
    
    const query = searchQuery.toLowerCase();
    return clients.filter((client) => {
      const name = (client.nome || "").toLowerCase();
      const email = (client.email || "").toLowerCase();
      const phone = String(client.telefono || "");
      return (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      );
    });
  }, [clients, searchQuery]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchClients();
    setIsRefreshing(false);
  };

  // Handle sort
  const handleSort = (field: 'name' | 'score' | 'date') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Apply sorting with memoization
  const sortedClients = useMemo(() => {
    if (!filteredClients.length) return [];
    
    let sorted = [...filteredClients];
    
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => {
          const result = a.nome.localeCompare(b.nome);
          return sortOrder === 'asc' ? result : -result;
        });
        break;
      case 'date':
        sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          const result = dateA.getTime() - dateB.getTime();
          return sortOrder === 'asc' ? result : -result;
        });
        break;
      case 'score':
        // This would need to be calculated with orders, simplified for now
        sorted.sort((a, b) => {
          const scoreA = a.id; // Placeholder
          const scoreB = b.id; // Placeholder
          const result = scoreA - scoreB;
          return sortOrder === 'asc' ? result : -result;
        });
        break;
    }
    
    return sorted;
  }, [filteredClients, sortBy, sortOrder]);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (selectedClient) handleBackToList();
    },
    onSwipedRight: () => {
      if (!selectedClient && onCloseMobileView) onCloseMobileView();
    },
    trackMouse: false,
    delta: 50,
    swipeDuration: 500,
    preventScrollOnSwipe: true,
  });

  // Load clients on mount with optimized loading
  useEffect(() => {
    let isMounted = true;
    
    const loadClients = async () => {
      if (!isMounted) return;
      await fetchClients();
    };
    
    loadClients();
    
    // Timeout di sicurezza per evitare caricamento infinito
    const timeout = setTimeout(() => {
      if (isLoading && isMounted) {
        console.warn("Timeout di caricamento clienti - forzando fine caricamento");
        setIsLoading(false);
      }
    }, 8000); // Ridotto a 8 secondi
    
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [fetchClients]);

  // Refresh clients when client form is closed (to catch new additions)
  useEffect(() => {
    if (!isClientFormOpen) {
      fetchClients();
    }
  }, [isClientFormOpen]);

  // Client Card Component
  const ClientCard = ({ client }: { client: Client }) => {
    const score = calculateClientScore([], client); // Simplified for now
    const level = getClientLevel(score);
    const LevelIcon = level.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl active:scale-98 mb-4 overflow-hidden group mobile-touch-feedback"
          onClick={() => handleSelectClient(client)}
          style={{
            touchAction: 'manipulation',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          <CardContent className="py-4 px-5">
            {/* Header with client name and level */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate text-base group-hover:text-blue-700 transition-colors duration-200">
                    {client.nome}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge className={`${level.color} text-xs px-3 py-1 rounded-full font-medium shadow-sm`}>
                      <LevelIcon className="h-3 w-3 mr-1" />
                      {level.level}
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                      Score: {score}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
              </div>
            </div>

            {/* Contact info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  {client.telefono}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 truncate">
                  {client.email}
                </span>
              </div>
            </div>

            {/* Tags */}
            {client.tag && client.tag.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {client.tag.slice(0, 3).map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                  >
                    {tag.name}
                  </span>
                ))}
                {client.tag.length > 3 && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    +{client.tag.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Footer with creation date */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500">
                  Registrato: {client.created_at ? new Date(client.created_at).toLocaleDateString('it-IT') : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Client Details Component
  const ClientDetails = ({ client, orders }: { client: Client; orders: Order[] }) => {
    const score = calculateClientScore(orders, client);
    const level = getClientLevel(score);
    const LevelIcon = level.icon;

    return (
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -300 }}
        className="h-full flex flex-col bg-[#f8fafc]"
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToList}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h2 className="font-bold text-lg text-gray-900">{client.nome}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${level.color} text-xs px-3 py-1 rounded-full`}>
                  <LevelIcon className="h-3 w-3 mr-1" />
                  {level.level}
                </Badge>
                <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                  Score: {score}
                </Badge>
              </div>
            </div>

          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="statistiche" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="appuntamenti" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                App.
              </TabsTrigger>
              <TabsTrigger value="info" className="text-xs">
                <User className="h-3 w-3 mr-1" />
                Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="statistiche" className="space-y-4">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Appuntamenti</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Euro className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Spesa Totale</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    €{orders.reduce((sum, order) => sum + order.prezzo, 0).toFixed(2)}
                  </p>
                </Card>
              </div>

              {/* Score Details */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Analisi Cliente</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Livello</span>
                    <Badge className={level.color}>
                      <LevelIcon className="h-3 w-3 mr-1" />
                      {level.level}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Score</span>
                    <span className="font-semibold text-gray-900">{score}/100</span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="appuntamenti" className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nessun appuntamento trovato</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 10).map((order) => (
                    <Card key={order.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{order.servizio}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.data).toLocaleDateString('it-IT')} - {order.orarioInizio}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">€{order.prezzo.toFixed(2)}</p>
                          <Badge className="text-xs" variant={order.status === 'completed' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="info" className="space-y-4">
              {/* Contact Info */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Informazioni di Contatto</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-700">{client.telefono}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700">{client.email}</span>
                  </div>
                </div>
              </Card>

              {/* Tags */}
              {client.tag && client.tag.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Tag</h3>
                  <div className="flex flex-wrap gap-2">
                    {client.tag.map((tag) => (
                      <Badge key={tag.id} className={tag.color}>
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Notes */}
              {client.note && (
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Note</h3>
                  <p className="text-sm text-gray-700">{client.note}</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    );
  };

  // Loading screen
  if (isLoading) {
    console.log("⏳ [AnagraficaClientiMobile] Mostrando schermata di caricamento");
    return (
      <div className="fixed inset-0 bg-[#f8fafc] flex items-center justify-center z-50">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce"></div>
          </div>
          <p className="text-sm text-gray-500 text-center">Caricamento clienti...</p>
        </div>
      </div>
    );
  }

  // Client details view
  if (selectedClient) {
    return (
      <ClientDetails client={selectedClient} orders={clientOrders} />
    );
  }

  // Main list view
  return (
    <div 
      className="h-full flex flex-col bg-[#f8fafc] mobile-safe-top mobile-safe-bottom"
      style={{
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
      {...swipeHandlers}
    >
      {/* Fixed Header Container with both navbars */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white">
        {/* Mobile Navigation Bar */}
        <div className="border-b border-gray-100" style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}>
          <div className="w-full">
            <MobileNavbar
              toggleDay={toggleDay || (() => {})}
              toggleClients={toggleClients || (() => {})}
              toggleOnlineBookings={toggleOnlineBookings || (() => {})}
              showDay={showDay ?? false}
              showClients={showClients ?? true}
              showOnlineBookings={showOnlineBookings ?? false}
              hasPermission={hasPermission || (() => false)}
              canAccess={(requiredPermissions: string[]) => requiredPermissions.every(p => hasPermission?.(p) || false)}
            />
          </div>
        </div>

        {/* Main Navbar - Responsive and Adaptive */}
        <motion.div 
          className="border-b border-gray-100 touch-manipulation"
          style={{ 
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            transform: 'translate3d(0, 0, 0)',
            WebkitTransform: 'translate3d(0, 0, 0)',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            paddingLeft: 'max(1rem, env(safe-area-inset-left, 1rem))',
            paddingRight: 'max(1rem, env(safe-area-inset-right, 1rem))'
          }}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
        >
        {/* Responsive Quick Actions Bar */}
        <div className="flex items-center justify-between w-full min-w-0">
          {/* Left side - Primary actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0">
            {/* Filter Button - Hidden on very small screens */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden xs:block flex-shrink-0">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowFilterModal(true)}
                className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full text-xs font-semibold transition-all duration-200 border-2 p-0 relative ${
                  selectedTags.length > 0 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-300 shadow-md' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
                title="Filtri"
              >
                <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                {selectedTags.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <span className="text-[6px] sm:text-[8px] font-bold text-white">
                      {selectedTags.length}
                    </span>
                  </div>
                )}
              </Button>
            </motion.div>

            {/* Sort Button - Hidden on small screens */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden sm:block flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterModal(true)}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full text-xs font-semibold transition-all duration-200 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 p-0"
                title="Ordinamento"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </motion.div>
          </div>

          {/* Right side - Essential actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Refresh Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full text-xs font-semibold shadow-lg hover:from-violet-700 hover:to-purple-700 transition-all duration-200 active:scale-95 p-0"
                title="Aggiorna"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </motion.div>
            
            {/* Create Client Button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-shrink-0">
              <Button
                onClick={() => setIsClientFormOpen(true)}
                className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full text-xs font-semibold shadow-lg hover:from-violet-700 hover:to-purple-700 transition-all duration-200 active:scale-95 p-0"
                title="Nuovo cliente"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Secondary Actions Bar - Only visible on larger screens */}
        <div className="hidden md:flex items-center justify-center gap-2 mt-2 pt-2 border-t border-gray-100">
          {/* Filter Button - Full size on desktop */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowFilterModal(true)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2 relative ${
                selectedTags.length > 0 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-300 shadow-md' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
              title="Filtri"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtri
              {selectedTags.length > 0 && (
                <div className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                  {selectedTags.length}
                </div>
              )}
            </Button>
          </motion.div>

          {/* Sort Button - Full size on desktop */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterModal(true)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              title="Ordinamento"
            >
              <Settings className="h-4 w-4 mr-2" />
              Ordinamento
            </Button>
          </motion.div>
        </div>

        </motion.div>
      </div>

      {/* Scrollable Content */}
      <div 
        className="flex-1 overflow-y-auto" 
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain'
        }}
      >
        <div className="p-3 pb-20">
          {/* Search Bar - Now in scrollable area */}
          <div className="mb-4 mt-32">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca clienti..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border-gray-200 focus:bg-white focus:border-violet-300"
              />
            </div>
          </div>

          {/* Stats Card */}
          <motion.div 
            className="mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Gestione Clienti</h2>
                  <p className="text-sm text-gray-600">{filteredClients.length} clienti totali</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-violet-600">{filteredClients.length}</div>
                  <p className="text-xs text-violet-700">Clienti</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Client List */}
          {sortedClients.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-64 text-center"
            >
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'Nessun cliente trovato' : 'Nessun cliente'}
              </h3>
              <p className="text-gray-500 mb-4 text-sm">
                {searchQuery ? 'Prova a modificare i criteri di ricerca' : 'Inizia aggiungendo il tuo primo cliente'}
              </p>
              <Button onClick={() => setIsClientFormOpen(true)} className="bg-violet-600 hover:bg-violet-700">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Cliente
              </Button>
            </motion.div>
                      ) : (
            <div className="space-y-2">
              {sortedClients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ClientCard client={client} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Create Client Modal */}
        {isClientFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            style={{ zIndex: 9999 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full h-full max-w-full max-h-full rounded-none overflow-y-auto bg-white border-none shadow-none p-0 flex flex-col relative"
              style={{ zIndex: 9999 }}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex items-center justify-between p-3 shadow-sm">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsClientFormOpen(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors h-8 w-8"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </Button>
                </motion.div>
                <h1 className="text-base font-bold text-gray-900 flex-1 text-center mx-3 truncate">
                  Nuovo Cliente
                </h1>
                <div className="w-8"></div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <CreateClientForm
                  setIsDialogOpen={setIsClientFormOpen}
                />
              </div>

              {/* Custom CSS for mobile optimization */}
              <style jsx global>{`
                /* iOS Safari specific fixes */
                @supports (-webkit-touch-callout: none) {
                  input[type="date"],
                  input[type="time"] {
                    -webkit-appearance: none;
                    appearance: none;
                    background-color: white;
                    border-radius: 0.5rem;
                    border: 1px solid #e5e7eb;
                    padding: 0.75rem;
                    font-size: 1rem;
                    line-height: 1.5;
                  }
                  
                  input[type="date"]::-webkit-calendar-picker-indicator,
                  input[type="time"]::-webkit-calendar-picker-indicator {
                    background: transparent;
                    bottom: 0;
                    color: transparent;
                    cursor: pointer;
                    height: auto;
                    left: 0;
                    position: absolute;
                    right: 0;
                    top: 0;
                    width: auto;
                  }
                }
                
                /* Android Chrome fixes */
                @media screen and (max-width: 768px) {
                  input[type="date"],
                  input[type="time"] {
                    min-height: 48px;
                    font-size: 16px; /* Prevents zoom on iOS */
                  }
                  
                  select {
                    min-height: 48px;
                    font-size: 16px;
                  }
                }
                
                /* Focus states for better accessibility */
                .focus\\:ring-2:focus {
                  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
                }
                
                /* Smooth transitions */
                * {
                  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
                  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                  transition-duration: 150ms;
                }
              `}</style>
            </motion.div>
          </motion.div>
        )}

        {/* Edit Client Modal */}
        {isEditModalOpen && editingClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsEditModalOpen(false);
              }
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[95vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                    <Edit className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Modifica Cliente</h2>
                    <p className="text-xs text-gray-500">Aggiorna i dati del cliente</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <EditFormModal
                  isDialogOpen={isEditModalOpen}
                  setIsDialogOpen={setIsEditModalOpen}
                  clientId={editingClient.id}
                  onClientUpdated={(updatedClient) => {
                                      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
                  setSelectedClient(updatedClient);
                    setIsEditModalOpen(false);
                    setEditingClient(null);
                    showToast({
                      title: "Successo",
                      description: "Cliente aggiornato con successo",
                      type: "success"
                    });
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Tag Manager Modal */}
        {isTagModalOpen && selectedClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsTagModalOpen(false);
              }
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[95vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                    <Tag className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Gestione Tag</h2>
                    <p className="text-xs text-gray-500">Organizza i tag del cliente</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsTagModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <TagManager
                  isOpen={isTagModalOpen}
                  onClose={() => setIsTagModalOpen(false)}
                  selectedTags={(selectedClient as Client).tag || []}
                  onTagsUpdate={async (updatedTags: ClientTag[]) => {
                    if (selectedClient) {
                      const updatedClient: Client = { ...(selectedClient as Client), tag: updatedTags };
                                        setSelectedClient(updatedClient);
                  setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
                  setIsTagModalOpen(false);
                      showToast({
                        title: "Successo",
                        description: "Tag aggiornati con successo",
                        type: "success"
                      });
                    }
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Sort Modal */}
      <AnimatePresence>
        {showFilterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowFilterModal(false);
              }
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[95vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                    <Filter className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Filtri e Ordinamento</h2>
                    <p className="text-xs text-gray-500">Personalizza la visualizzazione</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSortBy('name');
                      setSortOrder('asc');
                      setSelectedTags([]);
                    }}
                    className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
                  >
                    Reset
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowFilterModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Sort Options */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4 text-base">Ordinamento</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'name', label: 'Nome', icon: User },
                      { key: 'score', label: 'Score', icon: TrendingUp },
                      { key: 'date', label: 'Data di registrazione', icon: Calendar }
                    ].map((option, index) => {
                      const Icon = option.icon;
                      const isSelected = sortBy === option.key;
                      
                      return (
                        <motion.button
                          key={option.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSort(option.key as 'name' | 'score' | 'date')}
                          className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                            isSelected
                              ? 'bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 shadow-md' 
                              : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                            <Icon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <span className="text-base font-bold text-gray-900 truncate block">{option.label}</span>
                            <p className="text-sm text-gray-500 mt-1">
                              {isSelected ? `Ordinato per ${option.label.toLowerCase()}` : `Clicca per ordinare per ${option.label.toLowerCase()}`}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="flex flex-col items-center gap-1">
                              {sortOrder === 'asc' ? (
                                <SortAsc className="h-4 w-4 text-violet-600" />
                              ) : (
                                <SortDesc className="h-4 w-4 text-violet-600" />
                              )}
                              <span className="text-xs font-medium text-violet-700">
                                {sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
                              </span>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Tag Filters */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4 text-base">Filtri per Tag</h3>
                  <div className="space-y-3">
                    {Object.entries(CLIENT_TAGS).map(([category, tags]) => (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">{category}</h4>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <motion.button
                              key={tag.id}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedTags(prev => 
                                  prev.includes(tag.id) 
                                    ? prev.filter(id => id !== tag.id)
                                    : [...prev, tag.id]
                                );
                              }}
                              className={`px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 border ${
                                selectedTags.includes(tag.id)
                                  ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                              }`}
                            >
                              {tag.name}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>


              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilterModal(false)}
                    className="flex-1 h-12 rounded-2xl border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Annulla
                  </Button>
                  <Button
                    onClick={() => setShowFilterModal(false)}
                    className="flex-1 h-12 bg-violet-600 hover:bg-violet-700 rounded-2xl"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Applica ({selectedTags.length})
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
