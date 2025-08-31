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
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus search input when component mounts
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    
    // Get salon ID
    getSalonId().then(setSalonId);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchQuery, salonId]);

  const performSearch = async () => {
    if (!salonId || searchQuery.trim().length < 2) return;

    console.log('🔍 Starting search with:', { salonId, query: searchQuery.trim() });

    setIsLoading(true);
    const supabase = createClient();
    const query = searchQuery.toLowerCase().trim();

    try {
      const searchPromises = [];

      // Debug: Test basic query first
      console.log('🧪 Testing basic orders query...');
      const basicTest = await supabase
        .from('orders')
        .select('id, nome, data, salon_id, task')
        .eq('salon_id', salonId)
        .limit(5);
      
      console.log('🧪 Basic query result:', {
        error: basicTest.error,
        count: basicTest.data?.length || 0,
        sample: basicTest.data?.slice(0, 2)
      });

      // Search orders (exclude tasks) - removed 'servizio' field as it doesn't exist in orders table
      searchPromises.push(
        supabase
          .from('orders')
          .select(`
            *,
            team:team_id(name),
            order_services(*)
          `)
          .eq('salon_id', salonId)
          .eq('task', false)
          .or(`nome.ilike.%${query}%,telefono.ilike.%${query}%,email.ilike.%${query}%,note.ilike.%${query}%,note_richtext.ilike.%${query}%,data.ilike.%${query}%,orarioInizio.ilike.%${query}%,orarioFine.ilike.%${query}%,stilista.ilike.%${query}%,parrucchiere.ilike.%${query}%,descrizione.ilike.%${query}%,status.ilike.%${query}%,booking_source.ilike.%${query}%`)
          .limit(20)
      );

      // Also search for orders that have services matching the query
      searchPromises.push(
        supabase
          .from('orders')
          .select(`
            *,
            team:team_id(name),
            order_services!inner(*)
          `)
          .eq('salon_id', salonId)
          .eq('task', false)
          .or(`order_services.servizio.ilike.%${query}%,order_services.name.ilike.%${query}%`)
          .limit(10)
      );

      // Search customers
      searchPromises.push(
        supabase
          .from('customers')
          .select('*')
          .eq('salon_id', salonId)
          .or(`nome.ilike.%${query}%,telefono.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(10)
      );

      // Search services
      searchPromises.push(
        supabase
          .from('services')
          .select('*')
          .eq('salon_id', salonId)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
          .limit(10)
      );

      // Search team members
      searchPromises.push(
        supabase
          .from('team')
          .select('*')
          .eq('salon_id', salonId)
          .or(`name.ilike.%${query}%,role.ilike.%${query}%`)
          .limit(10)
      );

      const [ordersResult, ordersWithServicesResult, customersResult, servicesResult, teamResult] = await Promise.all(searchPromises);

      // Debug logging
      console.log('🔍 Search Results:', {
        orders: ordersResult.data?.length || 0,
        ordersWithServices: ordersWithServicesResult.data?.length || 0,
        customers: customersResult.data?.length || 0,
        services: servicesResult.data?.length || 0,
        team: teamResult.data?.length || 0,
        query,
        salonId
      });

      // Verifica se ci sono appuntamenti nel database per questo salon
      if ((ordersResult.data?.length || 0) + (ordersWithServicesResult.data?.length || 0) === 0) {
        const { count: totalOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('salon_id', salonId);
        
        const { count: totalAppointments } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('salon_id', salonId)
          .eq('task', false);
          
        console.log('📊 Database statistics for salon:', {
          totalOrders,
          totalAppointments: totalAppointments,
          salonId,
          searchQuery: query
        });
      }

      if (ordersResult.error) {
        console.error('❌ Orders search error:', ordersResult.error);
        console.error('❌ Orders search query details:', {
          salon_id: salonId,
          query,
          fullQuery: `nome.ilike.%${query}%,telefono.ilike.%${query}%,email.ilike.%${query}%,note.ilike.%${query}%,note_richtext.ilike.%${query}%,data.ilike.%${query}%,orarioInizio.ilike.%${query}%,orarioFine.ilike.%${query}%,stilista.ilike.%${query}%,parrucchiere.ilike.%${query}%,descrizione.ilike.%${query}%,status.ilike.%${query}%,booking_source.ilike.%${query}%`
        });
      } else {
        console.log('✅ Orders search successful:', {
          count: ordersResult.data?.length || 0,
          salonId,
          query,
          sampleData: ordersResult.data?.slice(0, 2)
        });
        
        // Debug: log some sample appointments to verify data structure
        if (ordersResult.data && ordersResult.data.length > 0) {
          console.log('📋 Sample appointment data:', {
            firstAppointment: ordersResult.data[0],
            fields: Object.keys(ordersResult.data[0])
          });
        }
      }

      if (ordersWithServicesResult.error) {
        console.error('❌ Orders with services search error:', ordersWithServicesResult.error);
      } else {
        console.log('✅ Orders with services search successful:', {
          count: ordersWithServicesResult.data?.length || 0,
          salonId,
          query
        });
      }

      const allResults: SearchResult[] = [];

      // Combine orders from both queries and remove duplicates
      const allOrders = [...(ordersResult.data || []), ...(ordersWithServicesResult.data || [])];
      const uniqueOrders = allOrders.filter((order, index, self) => 
        index === self.findIndex(o => o.id === order.id)
      );

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
        // Search in associated services (removed servizio field as it doesn't exist in orders table)
        if (item.order_services && item.order_services.length > 0) {
          item.order_services.forEach((service: any) => {
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
            placeholder="Cerca appuntamenti, clienti, servizi, team..."
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
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all">Tutti ({results.length})</TabsTrigger>
                    <TabsTrigger value="order">
                      Appuntamenti ({results.filter(r => r.type === 'order').length})
                    </TabsTrigger>
                    <TabsTrigger value="customer">
                      Clienti ({results.filter(r => r.type === 'customer').length})
                    </TabsTrigger>
                    <TabsTrigger value="service">
                      Servizi ({results.filter(r => r.type === 'service').length})
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

                <TabsContent value="service" className="mt-4">
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
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-slate-100 font-['Manrope']">{data.nome}</CardTitle>
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
            <Badge variant="outline" className="font-medium border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 font-['Manrope']">
              {formatPrice(data.prezzo)}
            </Badge>
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
          {data.order_services && data.order_services.length > 0 && (
            <div className="flex items-center gap-2 col-span-2">
              <Scissors className="w-4 h-4 text-gray-500 dark:text-slate-400" />
              <span className="text-sm text-gray-600 dark:text-slate-300 font-['Manrope']">
                Servizi: {data.order_services.map((service: any) => service.servizio).join(', ')}
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
