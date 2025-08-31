"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Calendar, 
  User, 
  Scissors, 
  Users, 
  Phone, 
  Mail, 
  Clock, 
  Euro,
  MapPin,
  FileText,
  Tag,
  Star,
  CalendarDays,
  Clock4,
  UserCheck,
  Building,
  CreditCard,
  Receipt,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  X
} from 'lucide-react';
import { createClient } from "@/utils/supabase/client";
import { getSalonId } from "@/utils/getSalonId";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface SearchResult {
  type: 'order' | 'customer' | 'service' | 'team';
  data: any;
  relevance: number;
}

interface SearchModalProps {
  onClose: () => void;
}

export function SearchModal({ onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [salonId, setSalonId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus search input when component mounts
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    
    // Get salon ID and test user session
    getSalonId().then(async (id) => {
      console.log('🏪 Salon ID obtained for search:', id);
      setSalonId(id);
      
      // Also check user session
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('👤 User session for search:', {
        userId: user?.id,
        email: user?.email,
        error
      });
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchQuery, salonId, currentUserId]);

  const performSearch = async () => {
    if (!salonId || searchQuery.trim().length < 2) return;

    console.log('🔍 Starting search with:', { salonId, query: searchQuery.trim() });

    setIsLoading(true);
    const supabase = createClient();
    const query = searchQuery.toLowerCase().trim();

    try {
      const searchPromises = [];

      // Search orders using the same approach as sidebar
      console.log('🔍 Searching orders (using sidebar approach)...');
      
      // First, get all orders (appointments and tasks) for this salon
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('❌ Orders search error:', ordersError);
      } else {
        console.log('✅ Orders fetched successfully:', {
          count: orders?.length || 0,
          salonId
        });
      }

      // Filter orders based on search query
      const filteredOrders = (orders || []).filter(order => {
        // Enforce: tasks only for current user
        if (order?.task) {
          if (!currentUserId || order.user_id !== currentUserId) {
            return false;
          }
        }
        const searchText = [
          order.nome,
          order.telefono,
          order.email,
          order.note,
          order.note_richtext,
          order.data,
          order.orarioInizio,
          order.orarioFine,
          order.stilista,
          order.parrucchiere,
          order.descrizione,
          order.status,
          order.booking_source
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchText.includes(query);
      });

      console.log('🔍 Filtered orders by text search:', {
        originalCount: orders?.length || 0,
        filteredCount: filteredOrders.length
      });

      // Then fetch associated services for each filtered order (same as sidebar)
      const appointmentsWithServices = await Promise.all(
        filteredOrders.map(async (order) => {
          const { data: services, error: servicesError } = await supabase
            .from('order_services')
            .select('*')
            .eq('order_id', order.id);

          if (servicesError) {
            console.error(`Error fetching services for order ${order.id}:`, servicesError.message);
            return order;
          }

          return {
            ...order,
            services: services || []
          };
        })
      );

      // Also search for appointments that have services matching the query
      console.log('� Searching by services...');
      const { data: matchingServices, error: servicesSearchError } = await supabase
        .from('order_services')
        .select('order_id, *')
        .ilike('servizio', `%${query}%`);

      if (servicesSearchError) {
        console.error('❌ Services search error:', servicesSearchError);
      } else {
        console.log('✅ Services search successful:', {
          count: matchingServices?.length || 0
        });
      }

      // Get orders that match by services
      let ordersFromServices: any[] = [];
      if (matchingServices && matchingServices.length > 0) {
        const serviceOrderIds = matchingServices.map(s => s.order_id);
        const { data: serviceOrders, error: serviceOrdersError } = await supabase
          .from('orders')
          .select('*')
          .eq('salon_id', salonId)
          .in('id', serviceOrderIds);

        if (!serviceOrdersError && serviceOrders) {
          // Add services to these orders too
          ordersFromServices = await Promise.all(
            serviceOrders.map(async (order) => {
              const { data: services } = await supabase
                .from('order_services')
                .select('*')
                .eq('order_id', order.id);

              return {
                ...order,
                services: services || []
              };
            })
          );
          // Enforce: tasks only for current user
          ordersFromServices = ordersFromServices.filter((order: any) => {
            if (order?.task) {
              return !!currentUserId && order.user_id === currentUserId;
            }
            return true;
          });
        }
      }

      // Combine and deduplicate orders
      const allOrders = [...appointmentsWithServices, ...ordersFromServices];
      const uniqueOrders = allOrders.filter((order, index, self) => 
        index === self.findIndex(o => o.id === order.id)
      );

      console.log('🔍 Combined unique orders:', {
        textMatches: appointmentsWithServices.length,
        serviceMatches: ordersFromServices.length,
        totalUnique: uniqueOrders.length
      });

      // Search customers
      const customersPromise = supabase
        .from('customers')
        .select('*')
        .eq('salon_id', salonId)
        .or(`nome.ilike.%${query}%,telefono.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      // Search services
      const servicesPromise = supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonId)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(10);

      // Search team members
      const teamPromise = supabase
        .from('team')
        .select('*')
        .eq('salon_id', salonId)
        .or(`name.ilike.%${query}%,role.ilike.%${query}%`)
        .limit(10);

      const [customersResult, servicesResult, teamResult] = await Promise.all([
        customersPromise,
        servicesPromise,
        teamPromise
      ]);

      // Debug logging
      console.log('� Search Results:', {
        orders: uniqueOrders.length,
        customers: customersResult.data?.length || 0,
        services: servicesResult.data?.length || 0,
        team: teamResult.data?.length || 0,
        query,
        salonId
      });

      const allResults: SearchResult[] = [];

      // Process orders
      if (uniqueOrders.length > 0) {
        uniqueOrders.forEach((order: any) => {
          const relevance = calculateRelevance(order, query, 'order');
          allResults.push({
            type: 'order',
            data: order,
            relevance
          });
        });
      }

      // Process customers
      if (customersResult.data) {
        customersResult.data.forEach((customer: any) => {
          const relevance = calculateRelevance(customer, query, 'customer');
          allResults.push({
            type: 'customer',
            data: customer,
            relevance
          });
        });
      }

      // Process services
      if (servicesResult.data) {
        servicesResult.data.forEach((service: any) => {
          const relevance = calculateRelevance(service, query, 'service');
          allResults.push({
            type: 'service',
            data: service,
            relevance
          });
        });
      }

      // Process team members
      if (teamResult.data) {
        teamResult.data.forEach((member: any) => {
          const relevance = calculateRelevance(member, query, 'team');
          allResults.push({
            type: 'team',
            data: member,
            relevance
          });
        });
      }

      // Sort by relevance
      allResults.sort((a, b) => b.relevance - a.relevance);
      
      console.log('🎯 Final search results:', {
        totalResults: allResults.length,
        orderResults: allResults.filter(r => r.type === 'order').length,
        customerResults: allResults.filter(r => r.type === 'customer').length,
        serviceResults: allResults.filter(r => r.type === 'service').length,
        teamResults: allResults.filter(r => r.type === 'team').length,
        topOrderResults: allResults.filter(r => r.type === 'order').slice(0, 3).map(r => ({
          name: r.data.nome,
          relevance: r.relevance,
          id: r.data.id
        }))
      });
      
      setResults(allResults);

    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRelevance = (item: any, query: string, type: string): number => {
    let relevance = 0;
    const queryLower = query.toLowerCase();

    switch (type) {
      case 'order':
        if (item.nome?.toLowerCase().includes(queryLower)) relevance += 10;
        if (item.telefono?.toLowerCase().includes(queryLower)) relevance += 8;
        if (item.email?.toLowerCase().includes(queryLower)) relevance += 8;
        if (item.note?.toLowerCase().includes(queryLower)) relevance += 5;
        if (item.note_richtext?.toLowerCase().includes(queryLower)) relevance += 5;
        if (item.data?.toLowerCase().includes(queryLower)) relevance += 6;
        if (item.orarioInizio?.toLowerCase().includes(queryLower)) relevance += 6;
        if (item.orarioFine?.toLowerCase().includes(queryLower)) relevance += 4;
        if (item.stilista?.toLowerCase().includes(queryLower)) relevance += 8;
        if (item.parrucchiere?.toLowerCase().includes(queryLower)) relevance += 8;
        if (item.descrizione?.toLowerCase().includes(queryLower)) relevance += 7;
        if (item.status?.toLowerCase().includes(queryLower)) relevance += 6;
        if (item.booking_source?.toLowerCase().includes(queryLower)) relevance += 3;
        // Search in associated services (using services array like sidebar)
        if (item.services && item.services.length > 0) {
          item.services.forEach((service: any) => {
            if (service.servizio?.toLowerCase().includes(queryLower)) relevance += 8;
            if (service.name?.toLowerCase().includes(queryLower)) relevance += 8;
          });
        }
        // Search in team name
        if (item.team?.name?.toLowerCase().includes(queryLower)) relevance += 8;
        break;
      case 'customer':
        if (item.nome?.toLowerCase().includes(queryLower)) relevance += 10;
        if (item.telefono?.toLowerCase().includes(queryLower)) relevance += 8;
        if (item.email?.toLowerCase().includes(queryLower)) relevance += 8;
        if (item.note?.toLowerCase().includes(queryLower)) relevance += 5;
        break;
      case 'service':
        if (item.name?.toLowerCase().includes(queryLower)) relevance += 10;
        if (item.description?.toLowerCase().includes(queryLower)) relevance += 8;
        if (item.category?.toLowerCase().includes(queryLower)) relevance += 6;
        break;
      case 'team':
        if (item.name?.toLowerCase().includes(queryLower)) relevance += 10;
        if (item.role?.toLowerCase().includes(queryLower)) relevance += 8;
        break;
    }

    return relevance;
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completato':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in corso':
      case 'in progress':
        return <Clock4 className="w-4 h-4 text-blue-500" />;
      case 'cancellato':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: it });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return timeString.substring(0, 5); // Extract HH:MM
    } catch {
      return timeString;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const filteredResults = activeTab === 'all' 
    ? results 
    : results.filter(result => result.type === activeTab);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900">
      <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-slate-100 font-['Manrope']">
            <Search className="w-5 h-5 text-gray-600 dark:text-slate-300" />
            Ricerca Globale
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 rounded-full text-gray-600 dark:text-slate-300 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
          <Input
            ref={searchInputRef}
            placeholder="Cerca appuntamenti, clienti, servizi, team... (stessa logica della sidebar)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3 text-base bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 font-['Manrope']"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 dark:text-blue-400" />
            <span className="ml-2 text-gray-600 dark:text-slate-300 font-['Manrope']">Ricerca in corso...</span>
          </div>
        ) : (
          <>
            {results.length > 0 && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <div className="px-6 pt-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">Tutti ({results.length})</TabsTrigger>
                    <TabsTrigger value="order">
                      Appuntamenti ({results.filter(r => r.type === 'order').length})
                    </TabsTrigger>
                    <TabsTrigger value="customer">
                      Clienti ({results.filter(r => r.type === 'customer').length})
                    </TabsTrigger>
                    <TabsTrigger value="team">
                      Team ({results.filter(r => r.type === 'team').length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="all" className="mt-4">
                  <ScrollArea className="h-[calc(100vh-200px)] px-6">
                    <div className="space-y-4">
                      {filteredResults.map((result, index) => (
                        <SearchResultCard key={`${result.type}-${index}`} result={result} />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="order" className="mt-4">
                  <ScrollArea className="h-[calc(100vh-200px)] px-6">
                    <div className="space-y-4">
                      {filteredResults.map((result, index) => (
                        <SearchResultCard key={`${result.type}-${index}`} result={result} />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="customer" className="mt-4">
                  <ScrollArea className="h-[calc(100vh-200px)] px-6">
                    <div className="space-y-4">
                      {filteredResults.map((result, index) => (
                        <SearchResultCard key={`${result.type}-${index}`} result={result} />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="team" className="mt-4">
                  <ScrollArea className="h-[calc(100vh-200px)] px-6">
                    <div className="space-y-4">
                      {filteredResults.map((result, index) => (
                        <SearchResultCard key={`${result.type}-${index}`} result={result} />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}

            {searchQuery.length >= 2 && results.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Search className="w-12 h-12 text-gray-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2 font-['Manrope']">Nessun risultato trovato</h3>
                <p className="text-gray-500 dark:text-slate-400 font-['Manrope']">
                  Prova con termini di ricerca diversi o verifica l'ortografia.
                </p>
              </div>
            )}

            {searchQuery.length < 2 && (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Search className="w-12 h-12 text-gray-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2 font-['Manrope']">Inizia a cercare</h3>
                <p className="text-gray-500 dark:text-slate-400 font-['Manrope']">
                  Digita almeno 2 caratteri per iniziare la ricerca.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface SearchResultCardProps {
  result: SearchResult;
}

function SearchResultCard({ result }: SearchResultCardProps) {
  const { type, data } = result;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: it });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return timeString.substring(0, 5); // Extract HH:MM
    } catch {
      return timeString;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completato':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in corso':
      case 'in progress':
        return <Clock4 className="w-4 h-4 text-blue-500" />;
      case 'cancellato':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const renderOrderCard = () => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-slate-700/50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-slate-100 font-['Manrope']">{data.nome}</CardTitle>
                {data.task && (
                  <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-600 font-['Manrope']">
                    Task
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 font-['Manrope']">
                <CalendarDays className="w-4 h-4" />
                {formatDate(data.data)}
                <Clock className="w-4 h-4" />
                {formatTime(data.orarioInizio)}
                {data.orarioFine && (
                  <>
                    <span>-</span>
                    {formatTime(data.orarioFine)}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(data.status)}
            {typeof data.prezzo === 'number' && (
              <Badge variant="outline" className="font-medium border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-['Manrope']">
                {formatPrice(data.prezzo)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500 dark:text-slate-400" />
            <span className="text-gray-700 dark:text-slate-200 font-['Manrope']">{data.telefono || 'Non specificato'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500 dark:text-slate-400" />
            <span className="text-gray-700 dark:text-slate-200 font-['Manrope']">{data.email || 'Non specificato'}</span>
          </div>
                     {data.team && (
             <div className="flex items-center gap-2">
               <UserCheck className="w-4 h-4 text-gray-500 dark:text-slate-400" />
               <span className="text-gray-700 dark:text-slate-200 font-['Manrope']">{data.team.name}</span>
             </div>
           )}
           {data.stilista && (
             <div className="flex items-center gap-2">
               <User className="w-4 h-4 text-gray-500 dark:text-slate-400" />
               <span className="text-gray-700 dark:text-slate-200 font-['Manrope']">Stilista: {data.stilista}</span>
             </div>
           )}
           {data.parrucchiere && (
             <div className="flex items-center gap-2">
               <User className="w-4 h-4 text-gray-500 dark:text-slate-400" />
               <span className="text-gray-700 dark:text-slate-200 font-['Manrope']">Parrucchiere: {data.parrucchiere}</span>
             </div>
           )}
          {data.note && (
            <div className="flex items-center gap-2 col-span-2">
              <FileText className="w-4 h-4 text-gray-500 dark:text-slate-400" />
              <span className="truncate text-gray-700 dark:text-slate-200 font-['Manrope']">{data.note}</span>
            </div>
          )}
          {data.services && data.services.length > 0 && (
            <div className="flex items-center gap-2 col-span-2">
              <Scissors className="w-4 h-4 text-gray-500 dark:text-slate-400" />
              <span className="text-sm text-gray-600 dark:text-slate-300 font-['Manrope']">
                Servizi: {data.services.map((service: any) => service.servizio).join(', ')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderCustomerCard = () => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-blue-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400">
                {data.nome?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-slate-100 font-['Manrope']">{data.nome}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 font-['Manrope']">
                <User className="w-4 h-4" />
                Cliente
                {data.created_at && (
                  <>
                    <span>•</span>
                    <span>Registrato il {formatDate(data.created_at)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {data.tag && data.tag.length > 0 && (
            <div className="flex gap-1">
              {data.tag.slice(0, 2).map((tag: any, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-600 font-['Manrope']">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500 dark:text-slate-400" />
            <span className="text-gray-700 dark:text-slate-200 font-['Manrope']">{data.telefono || 'Non specificato'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500 dark:text-slate-400" />
            <span className="text-gray-700 dark:text-slate-200 font-['Manrope']">{data.email || 'Non specificato'}</span>
          </div>
          {data.tipo_cliente && (
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-500 dark:text-slate-400" />
              <span className="capitalize text-gray-700 dark:text-slate-200 font-['Manrope']">{data.tipo_cliente.replace('_', ' ')}</span>
            </div>
          )}
          {data.note && (
            <div className="flex items-center gap-2 col-span-2">
              <FileText className="w-4 h-4 text-gray-500 dark:text-slate-400" />
              <span className="truncate text-gray-700 dark:text-slate-200 font-['Manrope']">{data.note}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderServiceCard = () => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
                         <div className="p-2 bg-green-100 dark:bg-slate-700/50 rounded-lg">
               <Scissors className="w-5 h-5 text-green-600 dark:text-green-400" />
             </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-slate-100 font-['Manrope']">{data.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 font-['Manrope']">
                <Clock className="w-4 h-4" />
                {data.duration} min
                {data.category && (
                  <>
                    <span>•</span>
                    <span>{data.category}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-medium border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-['Manrope']">
              {formatPrice(data.price)}
            </Badge>
            {data.promo && (
              <Badge variant="destructive" className="text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 font-['Manrope']">
                PROMO
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
          {data.description && (
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-500 dark:text-slate-400 mt-0.5" />
              <span className="line-clamp-2 text-gray-700 dark:text-slate-200 font-['Manrope']">{data.description}</span>
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500 dark:text-slate-400" />
              <span className="text-gray-700 dark:text-slate-200 font-['Manrope']">Max {data.max_clients || 'N/A'} clienti</span>
            </div>
            {data.visible_online && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                <span className="text-gray-700 dark:text-slate-200 font-['Manrope']">Online</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTeamCard = () => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={data.avatar_url} />
              <AvatarFallback className="bg-purple-100 dark:bg-slate-700 text-purple-600 dark:text-purple-400">
                {data.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-slate-100 font-['Manrope']">{data.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 font-['Manrope']">
                <Users className="w-4 h-4" />
                Team Member
                {data.role && (
                  <>
                    <span>•</span>
                    <span>{data.role}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={data.is_active ? "default" : "secondary"} className="font-['Manrope']">
              {data.is_active ? 'Attivo' : 'Inattivo'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {data.role && (
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-gray-500 dark:text-slate-400" />
              <span className="text-gray-700 dark:text-slate-200 font-['Manrope']">{data.role}</span>
            </div>
          )}
          {data.created_at && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500 dark:text-slate-400" />
              <span className="text-gray-700 dark:text-slate-200 font-['Manrope']">Dal {formatDate(data.created_at)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  switch (type) {
    case 'order':
      return renderOrderCard();
    case 'customer':
      return renderCustomerCard();
    case 'service':
      return renderServiceCard();
    case 'team':
      return renderTeamCard();
    default:
      return null;
  }
}
