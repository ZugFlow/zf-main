"use client";
import React, { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subDays, addDays, subWeeks, addWeeks, subMonths, addMonths, subYears, addYears } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { ActivityIcon, CalendarIcon, ArrowUpDown, DollarSign, ChevronUp, ChevronDown, Command, Search, Menu, X, FileDownIcon } from "lucide-react";
import { saveAs } from "file-saver"; // Add file-saver for exporting CSV
import ClipLoader from "react-spinners/ClipLoader"; // Add spinner for loading state
import { generateInvoicePDF } from "@/app/utils/pdfUtils";
import { saveInvoiceToSupabase, generateInvoice } from "@/app/utils/fatture";
import { Separator } from "@/components/ui/separator";
import InvoiceModal from '@/components/InvoiceModal';

const supabase = createClient();

// Time period types
type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

const Incassi = () => {
  const [dailyTotals, setDailyTotals] = useState<{ date: Date; total: number }[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredEarnings, setFilteredEarnings] = useState<{ date: Date; total: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userOrders, setUserOrders] = useState<{ 
    id: number; 
    nome: string; 
    prezzo: number; 
    data: string;
    numero?: string;
    status?: string;
    data_incasso?: string | null;
    fattura_generata?: boolean;
  }[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<null | any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('daily');
  const [periodSummary, setPeriodSummary] = useState<{
    total: number;
    count: number;
    periodLabel: string;
  }>({
    total: 0,
    count: 0,
    periodLabel: format(new Date(), "dd MMMM yyyy")
  });

  const [todaySummary, setTodaySummary] = useState<{
    total: number;
    count: number;
  }>({
    total: 0,
    count: 0
  });
  
  // Define the DateRange type
  type DateRange = {
    from: Date;
    to: Date;
  };
  
  const [filters, setFilters] = useState({
    dateRange: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    } as DateRange,
    priceRange: { min: 0, max: 1000 },
    searchTerm: '',
    sortBy: 'date',
    sortOrder: 'desc',
    viewMode: 'table'
  });

  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [orderServices, setOrderServices] = useState<{ servizio: string; price: number }[]>([]);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);

  useEffect(() => {
    const fetchStatusOptions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("settings")
          .select("key")
          .eq("user_id", user.id);

        if (error) throw error;

        setStatusOptions(data.map(setting => setting.key));
      } catch (error) {
        console.error("Errore nel recupero degli stati:", error);
      }
    };

    fetchStatusOptions();
  }, []);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("orders")
          .select("id, nome, prezzo, data, status, data_incasso, fattura_generata") // Added 'status', 'data_incasso', and 'fattura_generata' fields
          .order('data', { ascending: false });

        if (error) throw error;

        setUserOrders(data.map(order => ({
          ...order,
          id: order.id || 0
        })));
        
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  useEffect(() => {
    const today = new Date();
    const todayOrders = userOrders.filter(order => {
      const orderDate = new Date(order.data);
      return format(orderDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') && order.status === "pagato";
    });

    setTodaySummary({
      total: todayOrders.reduce((sum, order) => sum + order.prezzo, 0),
      count: todayOrders.length
    });
  }, [userOrders]);

  useEffect(() => {
    const fetchOrderServices = async (orderId: number) => {
      try {
        const { data, error } = await supabase
          .from("order_services")
          .select("servizio, price")
          .eq("order_id", orderId);

        if (error) throw error;

        setOrderServices(data || []);
      } catch (error) {
        console.error("Errore nel recupero dei servizi dell'ordine:", error);
      }
    };

    if (selectedOrder) {
      fetchOrderServices(selectedOrder.id);
    } else {
      setOrderServices([]);
    }
  }, [selectedOrder]);

  const handleSaveInvoice = async (order: any) => {
    try {
      await saveInvoiceToSupabase(order);
      alert("Fattura salvata con successo!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Si è verificato un errore");
    }
  };

  const handleGenerateInvoice = async (order: any) => {
    try {
      setIsLoading(true);
      const result = await generateInvoice(order);
      
      if (result.success) {
        // Aggiorna l'ordine localmente
        setUserOrders(prevOrders =>
          prevOrders.map(o =>
            o.id === order.id ? { ...o, fattura_generata: true } : o
          )
        );

        // Mostra toast di successo
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = `Fattura ${result.invoice.numero} generata con successo`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
    } catch (error) {
      // Mostra toast di errore
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      toast.textContent = error instanceof Error ? error.message : 'Errore durante la generazione della fattura';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const order = userOrders.find(o => o.id === orderId);
      if (order?.status === 'pagato' && !isEditingOrder) {
        alert("Non è possibile modificare lo stato di un ordine già pagato");
        return;
      }

      const updateData = {
        status: newStatus,
        data_incasso: newStatus === 'pagato' ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;

      setUserOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, ...updateData } : order
        )
      );

      alert("Stato aggiornato con successo!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Errore durante l'aggiornamento dello stato");
    }
  };

  const handleUpdateOrder = async (orderId: number, updates: Partial<typeof selectedOrder>) => {
    try {
      // Show loading state
      setIsLoading(true);
      
      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", orderId);

      if (error) throw error;

      // Update local state
      setUserOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, ...updates } : order
        )
      );

      setSelectedOrder((prev: typeof selectedOrder) => prev ? { ...prev, ...updates } : null);
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 ease-in-out';
      toast.textContent = 'Ordine aggiornato con successo';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (error) {
      console.error('Errore durante l\'aggiornamento:', error);
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
      toast.textContent = error instanceof Error ? error.message : 'Errore durante l\'aggiornamento';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderClick = (order: any) => {
    if (window.innerWidth < 768) {
      setExpandedOrderId(expandedOrderId === order.id ? null : order.id);
    } else {
      setSelectedOrder(order);
    }
  };

  const handleViewInvoice = async (order: any) => {
    try {
      setIsLoading(true);
      
      // Fetch existing invoice or generate preview
      const { data: existingInvoice } = await supabase
        .from("fatture")
        .select("*")
        .eq("ordine_id", order.id)
        .single();

      if (existingInvoice) {
        setCurrentInvoice(existingInvoice);
      } else {
        // Create preview invoice data
        const previewInvoice = {
          numero: 'PREVIEW',
          cliente_nome: order.nome,
          data_emissione: new Date().toISOString(),
          scadenza: addDays(new Date(), 30).toISOString(),
          imponibile: Number(order.prezzo.toFixed(2)),
          iva: Number((order.prezzo * 0.22).toFixed(2)),
          totale: Number((order.prezzo * 1.22).toFixed(2)),
          note: 'Anteprima fattura'
        };
        setCurrentInvoice(previewInvoice);
      }
      
      setShowInvoiceModal(true);
    } catch (error) {
      console.error('Errore nel caricamento della fattura:', error);
      // Show error toast
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      toast.textContent = error instanceof Error ? error.message : 'Errore nel caricamento della fattura';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for date range manipulation
  const getPeriodRange = (date: Date, period: TimePeriod): { from: Date; to: Date } => {
    switch (period) {
      case 'daily':
        return { from: date, to: date };
      case 'weekly':
        return { from: startOfWeek(date, { weekStartsOn: 1 }), to: endOfWeek(date, { weekStartsOn: 1 }) };
      case 'monthly':
        return { from: startOfMonth(date), to: endOfMonth(date) };
      case 'yearly':
        return { from: startOfYear(date), to: endOfYear(date) };
    }
  };

  const getPeriodLabel = (date: Date, period: TimePeriod): string => {
    switch (period) {
      case 'daily':
        return format(date, "dd MMMM yyyy");
      case 'weekly': {
        const start = startOfWeek(date, { weekStartsOn: 1 });
        const end = endOfWeek(date, { weekStartsOn: 1 });
        return `${format(start, "dd MMM")} - ${format(end, "dd MMM yyyy")}`;
      }
      case 'monthly':
        return format(date, "MMMM yyyy");
      case 'yearly':
        return format(date, "yyyy");
    }
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    let newDate: Date;
    
    switch (selectedPeriod) {
      case 'daily':
        newDate = direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1);
        break;
      case 'weekly':
        newDate = direction === 'prev' ? subWeeks(selectedDate, 1) : addWeeks(selectedDate, 1);
        break;
      case 'monthly':
        newDate = direction === 'prev' ? subMonths(selectedDate, 1) : addMonths(selectedDate, 1);
        break;
      case 'yearly':
        newDate = direction === 'prev' ? subYears(selectedDate, 1) : addYears(selectedDate, 1);
        break;
    }
    
    setSelectedDate(newDate);
  };

  useEffect(() => {
    const range = getPeriodRange(selectedDate, selectedPeriod);

    // Update date range in filters
    setFilters(prev => ({
      ...prev,
      dateRange: { from: range.from, to: range.to }
    }));

    // Calculate period summary
    const ordersInPeriod = userOrders.filter(order => {
      const orderDate = new Date(order.data);
      return orderDate >= range.from && orderDate <= range.to;
    });

    const total = ordersInPeriod.reduce((sum, order) => sum + order.prezzo, 0);

    // Include today's orders in the total count and sum
    const todayOrders = userOrders.filter(order => {
      const orderDate = new Date(order.data);
      return format(orderDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    });

    const todayTotal = todayOrders.reduce((sum, order) => sum + order.prezzo, 0);

    setPeriodSummary({
      total: total + todayTotal,
      count: ordersInPeriod.length + todayOrders.length,
      periodLabel: getPeriodLabel(selectedDate, selectedPeriod)
    });
  }, [selectedDate, selectedPeriod, userOrders]);

  useEffect(() => {
    setIsEditingOrder(false);
  }, [selectedOrder]);

  const filterOrders = (orders: typeof userOrders) => {
    return orders
      .filter(order => {
        const orderDate = new Date(order.data);
        const matchesDate = selectedPeriod === 'daily'
          ? format(orderDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
          : (!filters.dateRange.from || orderDate >= filters.dateRange.from) &&
            (!filters.dateRange.to || orderDate <= filters.dateRange.to);

        const matchesPrice = order.prezzo >= filters.priceRange.min &&
                             order.prezzo <= filters.priceRange.max;
        const matchesSearch = order.nome.toLowerCase().includes(filters.searchTerm.toLowerCase());

        return matchesDate && matchesPrice && matchesSearch;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'date') {
          return filters.sortOrder === 'desc'
            ? new Date(b.data).getTime() - new Date(a.data).getTime()
            : new Date(a.data).getTime() - new Date(b.data).getTime();
        } else if (filters.sortBy === 'price') {
          return filters.sortOrder === 'desc'
            ? b.prezzo - a.prezzo
            : a.prezzo - b.prezzo;
        }
        return 0;
      });
  };

  const exportToCSV = (orders: typeof userOrders) => {
    const headers = "ID,Nome,Prezzo,Data\n";
    const rows = orders.map(order => `${order.id},${order.nome},${order.prezzo},${format(new Date(order.data), "yyyy-MM-dd")}`).join("\n");
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "filtered_orders.csv");
  };

  const toggleDetailsSidebar = () => {
    setShowDetailsSidebar(!showDetailsSidebar);
    if (!showDetailsSidebar) setShowFiltersSidebar(false);
  };

  const toggleFiltersSidebar = () => {
    setShowFiltersSidebar(!showFiltersSidebar);
    if (!showFiltersSidebar) setShowDetailsSidebar(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Navigation */}
      <div className="md:hidden flex justify-between items-center p-4 bg-white border-b">
        <h1 className="text-xl font-bold">Incassi</h1>
        <div className="flex gap-2">
          <button onClick={toggleDetailsSidebar} className="p-2 rounded-full bg-gray-100">
            <ActivityIcon className="h-5 w-5" />
          </button>
          <button onClick={toggleFiltersSidebar} className="p-2 rounded-full bg-gray-100">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Details Sidebar */}
      <aside className={`
        ${showDetailsSidebar ? 'fixed inset-0 z-50 flex flex-col' : 'hidden'}
        md:relative md:flex md:flex-col md:w-1/3 lg:w-2/5
        bg-white shadow-lg border-r p-4 md:p-6 overflow-auto
      `}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ActivityIcon className="h-5 w-5 text-muted-foreground" /> Dettagli Ordine
          </h2>
          <button className="md:hidden" onClick={toggleDetailsSidebar}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {selectedOrder ? (
          <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  {isEditingOrder ? (
                    <input
                      type="text"
                      value={selectedOrder.nome}
                      onChange={(e) => handleUpdateOrder(selectedOrder.id, { nome: e.target.value })}
                      className="border-b-2 border-purple-500 focus:outline-none px-1 py-0.5 text-xl font-bold"
                    />
                  ) : (
                    selectedOrder.nome
                  )}
                </h3>
                <p className="text-sm text-gray-500">Ordine #{selectedOrder.id}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedOrder.status === 'pagato' && (
                  <button
                    onClick={() => setIsEditingOrder(!isEditingOrder)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      isEditingOrder 
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    {isEditingOrder ? (
                      <>
                        <X className="h-4 w-4" />
                        <span>Esci</span>
                      </>
                    ) : (
                      <>
                        <Command className="h-4 w-4" />
                        <span>Modifica</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Warning Banner */}
            {isEditingOrder && selectedOrder.status === 'pagato' && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-amber-700">
                  <strong>Attenzione:</strong> Sei in modalità modifica di un ordine già pagato. Le modifiche influenzeranno lo storico dei pagamenti.
                </p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-600 block mb-2">Prezzo</label>
                  {isEditingOrder ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                      <input
                        type="number"
                        value={selectedOrder.prezzo}
                        onChange={(e) => handleUpdateOrder(selectedOrder.id, { prezzo: parseFloat(e.target.value) })}
                        className="pl-8 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-purple-600">€{selectedOrder.prezzo.toFixed(2)}</p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-600 block mb-2">Data Ordine</label>
                  {isEditingOrder ? (
                    <input
                      type="date"
                      value={format(new Date(selectedOrder.data), "yyyy-MM-dd")}
                      onChange={(e) => handleUpdateOrder(selectedOrder.id, { data: e.target.value })}
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-700">
                      {format(new Date(selectedOrder.data), "dd MMMM yyyy")}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-600 block mb-2">Data Incasso</label>
                  {isEditingOrder ? (
                    <input
                      type="date"
                      value={selectedOrder.data_incasso ? format(new Date(selectedOrder.data_incasso), "yyyy-MM-dd") : ''}
                      onChange={(e) => handleUpdateOrder(selectedOrder.id, { data_incasso: e.target.value || null })}
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-700">
                      {selectedOrder.data_incasso 
                        ? format(new Date(selectedOrder.data_incasso), "dd MMMM yyyy")
                        : "Non ancora incassato"}
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-sm font-medium text-gray-600 block mb-2">Stato</label>
                  <select
                    value={selectedOrder.status || ""}
                    onChange={(e) => handleUpdateOrder(selectedOrder.id, { 
                      status: e.target.value,
                      data_incasso: e.target.value === 'pagato' ? new Date().toISOString() : null
                    })}
                    disabled={selectedOrder.status === 'pagato' && !isEditingOrder}
                    className={`w-full border rounded-lg p-2 ${
                      selectedOrder.status === 'pagato' 
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-white border-gray-200'
                    } ${
                      selectedOrder.status === 'pagato' && !isEditingOrder 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'focus:ring-2 focus:ring-purple-500 focus:border-transparent'
                    }`}
                  >
                    <option value="" disabled>Seleziona stato</option>
                    {statusOptions.map((status, index) => (
                      <option key={index} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Services Section */}
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Servizi Acquistati</h4>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                {orderServices.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {orderServices.map((service, index) => (
                      <div key={index} className="flex justify-between items-center p-4 hover:bg-gray-100 transition-colors">
                        <span className="text-sm font-medium text-gray-700">{service.servizio}</span>
                        <span className="text-sm font-semibold text-purple-600">€{service.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Nessun servizio associato a questo ordine
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => handleGenerateInvoice(selectedOrder)}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || selectedOrder.status !== 'pagato' || selectedOrder.fattura_generata}
              >
                {isLoading ? (
                  <ClipLoader size={16} color="#ffffff" />
                ) : (
                  <>
                    <FileDownIcon className="h-5 w-5" />
                    <span>
                      {selectedOrder.fattura_generata 
                        ? 'Fattura già generata'
                        : 'Genera Fattura'
                      }
                    </span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleViewInvoice(selectedOrder)}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <ClipLoader size={16} color="#ffffff" />
                ) : (
                  <>
                    <FileDownIcon className="h-5 w-5" />
                    <span>Visualizza Fattura</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg shadow hover:bg-gray-300 transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
            <ActivityIcon className="h-12 w-12 mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">Nessun ordine selezionato</p>
            <p className="text-sm">Seleziona un ordine dalla lista per visualizzare i dettagli</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800">Lista Ordini</h2>
            <span className="text-sm text-gray-500">
              {periodSummary.periodLabel}
            </span>
          </div>
        </div>
        <ul className="space-y-2">
          {filterOrders(userOrders).map((order) => (
            <li key={order.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => handleOrderClick(order)}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">{order.nome}</p>
                  <p className="text-xs text-gray-600">{format(new Date(order.data), "dd/MM/yyyy")}</p>
                  <p className="text-xs text-gray-600">€ {order.prezzo.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={order.status || ""}
                    onChange={(e) => handleChangeOrderStatus(order.id, e.target.value)}
                    disabled={order.status === 'pagato'}
                    className={`p-1.5 text-xs rounded-md border transition-colors duration-200 bg-white text-gray-600 border-gray-200 hover:bg-gray-50 focus:outline-none focus:border-purple-500 ${
                      order.status === 'pagato' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="" disabled>Stato</option>
                    {statusOptions.map((status, index) => (
                      <option key={index} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className={`h-4 w-4 transition-transform md:hidden ${
                    expandedOrderId === order.id ? 'rotate-180' : ''
                  }`} />
                </div>
              </div>
              
              {/* Mobile Expandable Details */}
              <div className={`md:hidden ${expandedOrderId === order.id ? 'block' : 'hidden'}`}>
                <div className="p-4 border-t bg-gray-50">
                  <ul className="space-y-2">
                    <li className="text-sm text-gray-600">
                      <strong>Stato:</strong>
                      <select
                        value={order.status || ""}
                        onChange={(e) => handleChangeOrderStatus(order.id, e.target.value)}
                        disabled={order.status === 'pagato'}
                        className={`ml-2 p-1 border rounded text-sm ${
                          order.status === 'pagato' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <option value="" disabled>Seleziona stato</option>
                        {statusOptions.map((status, index) => (
                          <option key={index} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </li>
                    <li className="text-sm text-gray-600">
                      <strong>Servizi:</strong>
                      <ul className="mt-1 pl-4">
                        {orderServices.length > 0 && expandedOrderId === order.id ? (
                          orderServices.map((service, index) => (
                            <li key={index} className="text-sm">
                              {service.servizio}: €{service.price.toFixed(2)}
                            </li>
                          ))
                        ) : (
                          <li className="text-sm italic">Nessun servizio</li>
                        )}
                      </ul>
                    </li>
                  </ul>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateInvoice(order);
                      }}
                      disabled={order.status !== 'pagato' || order.fattura_generata}
                      className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {order.fattura_generata ? 'Fattura già generata' : 'Genera Fattura'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewInvoice(order);
                      }}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Visualizza Fattura
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>

      {/* Filters Sidebar */}
      <aside className={`
        ${showFiltersSidebar ? 'fixed inset-0 z-50 flex flex-col' : 'hidden'}
        md:relative md:flex md:flex-col md:w-1/4 lg:w-1/5
        bg-white shadow-lg border-l p-4 md:p-6 overflow-auto
      `}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Filtri e Menu</h2>
          <button className="md:hidden" onClick={toggleFiltersSidebar}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Period Selection */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-3">Periodo</h3>
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedPeriod('daily')}
                className={`px-3 py-1 text-sm rounded-lg ${selectedPeriod === 'daily' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                G
              </button>
              <button
                onClick={() => setSelectedPeriod('weekly')}
                className={`px-3 py-1 text-sm rounded-lg ${selectedPeriod === 'weekly' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                S
              </button>
              <button
                onClick={() => setSelectedPeriod('monthly')}
                className={`px-3 py-1 text-sm rounded-lg ${selectedPeriod === 'monthly' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                M
              </button>
              <button
                onClick={() => setSelectedPeriod('yearly')}
                className={`px-3 py-1 text-sm rounded-lg ${selectedPeriod === 'yearly' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                A
              </button>
            </div>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-lg border border-purple-200"
            >
              Oggi
            </button>
          </div>
        </div>

        {/* Sorting Options */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Ordinamento</h3>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  sortBy: 'date',
                  sortOrder: prev.sortBy === 'date' ? (prev.sortOrder === 'asc' ? 'desc' : 'asc') : prev.sortOrder
                }))
              }}
              className={`p-1.5 text-xs rounded-md border transition-colors duration-200 flex items-center gap-1 ${
                filters.sortBy === 'date' 
                ? 'bg-gray-100 text-gray-900 border-gray-200' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span className="text-[11px]">Data</span>
              {filters.sortBy === 'date' && (
                filters.sortOrder === 'asc' ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )
              )}
            </button>
            <button
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  sortBy: 'price',
                  sortOrder: prev.sortBy === 'price' ? (prev.sortOrder === 'asc' ? 'desc' : 'asc') : prev.sortOrder
                }))
              }}
              className={`p-1.5 text-xs rounded-md border transition-colors duration-200 flex items-center gap-1 ${
                filters.sortBy === 'price'
                ? 'bg-gray-100 text-gray-900 border-gray-200'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-[11px]">Prezzo</span>
              {filters.sortBy === 'price' && (
                filters.sortOrder === 'asc' ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )
              )}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Ricerca</h3>
          <div className="flex items-center gap-1.5">
            <div className={`p-1.5 text-xs rounded-md border transition-colors duration-200 flex items-center gap-1 bg-white text-gray-600 border-gray-200 hover:bg-gray-50 ${
              filters.searchTerm ? 'border-purple-500' : ''
            }`}>
              <Search className="h-3.5 w-3.5" />
              <input
                type="text"
                placeholder="Cerca..."
                className="w-24 min-w-0 outline-none bg-transparent"
                value={filters.searchTerm}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Prezzo</h3>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="Min €"
              className="p-1.5 text-xs rounded-md border bg-white text-gray-600 border-gray-200 hover:bg-gray-50 transition-colors duration-200 w-20 focus:outline-none focus:border-purple-500"
              value={filters.priceRange.min}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  priceRange: { ...prev.priceRange, min: Number(e.target.value) },
                }))
              }
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="Max €"
              className="p-1.5 text-xs rounded-md border bg-white text-gray-600 border-gray-200 hover:bg-gray-50 transition-colors duration-200 w-20 focus:outline-none focus:border-purple-500"
              value={filters.priceRange.max}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  priceRange: { ...prev.priceRange, max: Number(e.target.value) },
                }))
              }
            />
          </div>
        </div>

        {/* Export CSV Button */}
        <div className="mt-6 mb-6">
          <button
            onClick={() => exportToCSV(filterOrders(userOrders))}
            className="p-2 bg-blue-500 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
            title="Esporta CSV"
          >
            <FileDownIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Summary Section */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Dashboard Finanziario</h3>
          
          {/* Dynamic Summary Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Riepilogo {
                  selectedPeriod === 'daily' ? 'Giornaliero' :
                  selectedPeriod === 'weekly' ? 'Settimanale' :
                  selectedPeriod === 'monthly' ? 'Mensile' : 'Annuale'
                }
              </span>
              <span className="text-xs text-gray-500">{periodSummary.periodLabel}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Incasso</span>
                <p className="text-lg font-semibold text-purple-600">
                  €{(selectedPeriod === 'daily' ? todaySummary.total : periodSummary.total)
                    .toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">N° Ordini</span>
                <p className="text-lg font-semibold text-gray-700">
                  {selectedPeriod === 'daily' ? todaySummary.count : periodSummary.count}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Media per Ordine</span>
                <p className="text-sm font-medium text-gray-600">
                  €{(() => {
                    const count = selectedPeriod === 'daily' ? todaySummary.count : periodSummary.count;
                    const total = selectedPeriod === 'daily' ? todaySummary.total : periodSummary.total;
                    return count > 0 
                      ? (total / count).toLocaleString('it-IT', { minimumFractionDigits: 2 })
                      : '0,00';
                  })()}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Tasso Completamento</span>
                <p className="text-sm font-medium text-gray-600">
                  {(() => {
                    const count = selectedPeriod === 'daily' ? todaySummary.count : periodSummary.count;
                    return count > 0
                      ? ((userOrders.filter(o => o.status === 'completato').length / count) * 100).toFixed(0)
                      : 0;
                  })()}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <InvoiceModal 
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        invoice={currentInvoice}
      />
    </div>
  );
};

export default Incassi;
