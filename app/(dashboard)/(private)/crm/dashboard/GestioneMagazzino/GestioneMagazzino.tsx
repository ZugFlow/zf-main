import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, TrashIcon } from "lucide-react";
import FormModal from "./_component/FormModalMagazzino";
import EditFormModal from "./_component/EditFormModalMagazzino";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useUser } from "../query/useUser";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subDays, addDays, subWeeks, addWeeks, subMonths, addMonths, subYears, addYears } from "date-fns";
import { ActivityIcon, CalendarIcon, ArrowUpDown, DollarSign, ChevronUp, ChevronDown, Command, Search, Menu, X, FileDownIcon } from "lucide-react";
import { saveAs } from "file-saver";
import ClipLoader from "react-spinners/ClipLoader";

const supabase = createClient();

const GestioneMagazzino = () => {
  interface Product {
    id: number;
    name: string;
    quantity: number;
    price: number;
    category: string;
    supplier: string;
    unit: string;
    expiration_date: string;
    sku: string;
    notes: string;
    date_added: string;
    min_threshold: number;
    location: string;
    status: string;
  }
  
  const { user, loading } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [userId, setUserId] = useState(""); // State for user ID
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [filters, setFilters] = useState({
    dateRange: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    },
    priceRange: { min: 0, max: 1000 },
    searchTerm: '',
    sortBy: 'date',
    sortOrder: 'desc',
    viewMode: 'table'
  });
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [periodSummary, setPeriodSummary] = useState({
    total: 0,
    count: 0,
    periodLabel: format(new Date(), "dd MMMM yyyy")
  });
  let subscription: RealtimeChannel;

  // Funzione per recuperare i prodotti dal database
  const fetchProducts = async () => {
    if (!user) {
      console.error("Utente non autenticato.");
      return;
    }
    setUserId(user.id);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Errore nel recupero dei prodotti:", error.message);
    } else {
      setProducts(data);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      fetchProducts();
    }
  }, [loading, user]);

  // Set up real-time subscription
  useEffect(() => {
    subscription = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => {
      // Clean up subscription on component unmount
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleCardClick = (id: number) => {
    setExpandedCard((prevId) => (prevId === id ? null : id));
  };

  const handleEdit = (id: number) => {
    setSelectedProductId(id);
    setEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = confirm("Sei sicuro di voler eliminare questo prodotto?");
    if (confirmDelete) {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) {
        console.error("Errore nella cancellazione del prodotto:", error.message);
      } else {
        fetchProducts();
      }
    }
  };

  const handleAddProduct = async (values: Partial<Product>) => {
    if (!user) {
      console.error("Utente non autenticato.");
      return;
    }

    const { error } = await supabase.from("products").insert({
      ...values,
      user_id: user.id,
      date_added: new Date().toISOString().split("T")[0],
    });

    if (error) {
      console.error("Errore nell'aggiunta del prodotto:", error.message);
    } else {
      fetchProducts();
      setModalOpen(false);
    }
  };

  // Helper function for period range
  const getPeriodRange = (date: Date, period: typeof selectedPeriod) => {
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

  const getPeriodLabel = (date: Date, period: typeof selectedPeriod): string => {
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

  // Export to CSV function
  const exportToCSV = (products: Product[]) => {
    const headers = "ID,Nome,Quantità,Prezzo,Categoria,Fornitore\n";
    const rows = products.map(product => 
      `${product.id},${product.name},${product.quantity},${product.price},${product.category},${product.supplier}`
    ).join("\n");
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "inventory_products.csv");
  };

  // Filter products function
  const filterProducts = (products: Product[]) => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                          product.supplier.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const matchesPrice = product.price >= filters.priceRange.min &&
                          product.price <= filters.priceRange.max;
      return matchesSearch && matchesPrice;
    }).sort((a, b) => {
      if (filters.sortBy === 'date') {
        return filters.sortOrder === 'desc'
          ? new Date(b.date_added).getTime() - new Date(a.date_added).getTime()
          : new Date(a.date_added).getTime() - new Date(b.date_added).getTime();
      } else if (filters.sortBy === 'price') {
        return filters.sortOrder === 'desc'
          ? b.price - a.price
          : a.price - b.price;
      }
      return 0;
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Gestione Magazzino</h1>
          <div className="flex gap-2">
            <Button className="bg-black hover:bg-gray-800 text-white" onClick={() => setModalOpen(true)}>
              Aggiungi Prodotto
            </Button>
            <button onClick={() => setShowFiltersSidebar(!showFiltersSidebar)} className="p-2 rounded-full bg-gray-100 md:hidden">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          {filterProducts(products).map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-lg shadow-md p-4 cursor-pointer ${
                expandedCard === product.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => handleCardClick(product.id)}
            >
              {/* Compact View */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{product.name}</h2>
                  <p className="text-sm text-gray-600">Quantità: {product.quantity}</p>
                  <p className="text-sm text-gray-600">Prezzo: €{product.price.toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-2 bg-black hover:bg-gray-800 text-white rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(product.id);
                    }}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    className="p-2 bg-black hover:bg-gray-800 text-white rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(product.id);
                    }}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Expanded View */}
              {expandedCard === product.id && (
                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <p><strong>Categoria:</strong> {product.category}</p>
                  <p><strong>Fornitore:</strong> {product.supplier}</p>
                  <p><strong>Unità:</strong> {product.unit}</p>
                  <p><strong>Scadenza:</strong> {product.expiration_date}</p>
                  <p><strong>SKU:</strong> {product.sku}</p>
                  <p><strong>Note:</strong> {product.notes}</p>
                  <p><strong>Data Aggiunta:</strong> {product.date_added}</p>
                  <p><strong>Soglia Minima:</strong> {product.min_threshold}</p>
                  <p><strong>Ubicazione:</strong> {product.location}</p>
                  <p><strong>Stato:</strong> {product.status}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Filters Sidebar */}
      <aside className={`
        ${showFiltersSidebar ? 'fixed inset-0 z-50 flex flex-col' : 'hidden'}
        md:relative md:flex md:flex-col md:w-1/4 lg:w-1/5
        bg-white shadow-lg border-l p-4 md:p-6 overflow-auto
      `}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Filtri e Menu</h2>
          <button className="md:hidden" onClick={() => setShowFiltersSidebar(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Period Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Periodo</h3>
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period as typeof selectedPeriod)}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    selectedPeriod === period ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {period === 'daily' ? 'G' : period === 'weekly' ? 'S' : period === 'monthly' ? 'M' : 'A'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Cerca prodotti..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="w-full p-2 border rounded-lg"
          />
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Range Prezzo</h3>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange.min}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                priceRange: { ...prev.priceRange, min: Number(e.target.value) }
              }))}
              className="w-1/2 p-2 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange.max}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                priceRange: { ...prev.priceRange, max: Number(e.target.value) }
              }))}
              className="w-1/2 p-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={() => exportToCSV(filterProducts(products))}
          className="w-full p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          <FileDownIcon className="h-4 w-4" />
          Esporta CSV
        </button>

        {/* Summary Section */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Statistiche Magazzino</h3>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Totale Prodotti</span>
                <p className="text-lg font-semibold text-purple-600">
                  {products.length}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Valore Totale</span>
                <p className="text-lg font-semibold text-gray-700">
                  €{products.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {isModalOpen && (
        <FormModal
          isDialogOpen={isModalOpen}
          setIsDialogOpen={setModalOpen}
        />
      )}

      {isEditModalOpen && selectedProductId !== null && (
        <EditFormModal
          isDialogOpen={isEditModalOpen}
          setIsDialogOpen={setEditModalOpen}
          productId={selectedProductId}
        />
      )}
    </div>
  );
};

export default GestioneMagazzino;
