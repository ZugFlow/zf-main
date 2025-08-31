import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  Users, 
  Package, 
  Tag, 
  ShoppingCart, 
  ClipboardList,
  Euro, 
  AlertTriangle,
  Activity,
  Warehouse,
  Timer,
  Download,
  FileText,
  PieChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Building2,
  Shield,
  Target,
  Zap,
  Star,
  Award,
  Layers,
  Clock,
  Archive,
  ChevronRight,
  Dot,
  X // Added X icon import
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subDays, addDays, subWeeks, addWeeks, subMonths, addMonths, subYears, addYears } from "date-fns";

const supabase = createClient();

const WarehouseDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState(0);
  const [clients, setClients] = useState(0);
  const [services, setServices] = useState(0);
  const [warehouseItems, setWarehouseItems] = useState(0);
  const [coupons, setCoupons] = useState(0);
  const [orders, setOrders] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [productsBelowThreshold, setProductsBelowThreshold] = useState(0);
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [expiringProducts, setExpiringProducts] = useState(0);
  const [mostUsedProduct, setMostUsedProduct] = useState<string | null>(null);
  const [leastUsedProduct, setLeastUsedProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [upcomingExpirations, setUpcomingExpirations] = useState<any[]>([]);
  const [mostUsedProductData, setMostUsedProductData] = useState<{ name: string; quantity: number } | null>(null);
  const [leastUsedProductData, setLeastUsedProductData] = useState<{ name: string; quantity: number } | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [filters, setFilters] = useState({
    dateRange: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    },
    category: 'all',
    searchTerm: '',
    sortBy: 'date',
    sortOrder: 'desc',
    viewMode: 'grid'
  });
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("Utente non autenticato.");
        setLoading(false);
        return;
      }
      setUserId(user.id);

      try {
        // Get salon_id for shared data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('salon_id')
          .eq('id', user.id)
          .single();
        
        const salonId = profileData?.salon_id;
        if (!salonId) {
          console.error("No salon_id found for user:", user.id);
          return;
        }

        const [appointmentsData, clientsData, servicesData, warehouseData, couponsData, ordersData] = await Promise.all([
          supabase.from("appointments").select("*").eq("salon_id", salonId),
          supabase.from("customers").select("*").eq("salon_id", salonId), // Changed from clients to customers
          supabase.from("services").select("*").eq("salon_id", salonId),
          supabase.from("products").select("*").eq("salon_id", salonId),
          supabase.from("coupons").select("*").eq("salon_id", salonId),
          supabase.from("orders").select("*").eq("salon_id", salonId),
        ]);

        setAppointments(appointmentsData.data?.length || 0);
        setClients(clientsData.data?.length || 0);
        setServices(servicesData.data?.length || 0);
        setWarehouseItems(warehouseData.data?.length || 0);
        setCoupons(couponsData.data?.length || 0);
        setOrders(ordersData.data?.length || 0);

        const { data, error } = await supabase
          .from("products")
          .select("name, quantity, price, min_threshold, category, expiration_date")
          .eq("user_id", user.id);

        if (error) {
          console.error("Errore nel caricamento dei prodotti:", error.message);
        } else {
          const totalProd = data?.length || 0;
          const totalQty = data?.reduce((acc, item) => acc + item.quantity, 0) || 0;
          const totalVal = data?.reduce((acc, item) => acc + item.quantity * item.price, 0) || 0;
          const belowThreshold = data?.filter((item) => item.quantity < item.min_threshold) || [];

          const categoryCounts: Record<string, number> = {};
          data?.forEach((item) => {
            if (item.category) {
              categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
            }
          });

          const today = new Date();
          const expiring = data?.filter((item) => {
            if (item.expiration_date) {
              const expDate = new Date(item.expiration_date);
              return expDate > today && expDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            }
            return false;
          }) || [];

          // Find most and least used products with data
          const sortedByUsage = [...(data || [])].sort((a, b) => b.quantity - a.quantity);
          const mostUsedData = sortedByUsage[0] ? { name: sortedByUsage[0].name, quantity: sortedByUsage[0].quantity } : null;
          const leastUsedData = sortedByUsage[sortedByUsage.length - 1] ? { name: sortedByUsage[sortedByUsage.length - 1].name, quantity: sortedByUsage[sortedByUsage.length - 1].quantity } : null;
          const mostUsed = mostUsedData?.name || null;
          const leastUsed = leastUsedData?.name || null;

          setTotalProducts(totalProd);
          setTotalQuantity(totalQty);
          setTotalValue(totalVal);
          setProductsBelowThreshold(belowThreshold.length);
          setCategories(categoryCounts);
          setExpiringProducts(expiring.length);
          setMostUsedProduct(mostUsed);
          setLeastUsedProduct(leastUsed);
          setMostUsedProductData(mostUsedData);
          setLeastUsedProductData(leastUsedData);
          setLowStockProducts(belowThreshold.slice(0, 5));
          setUpcomingExpirations(expiring.slice(0, 5));
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error("Errore nel caricamento dei dati:", error.message);
        } else {
          console.error("Errore nel caricamento dei dati:", error);
        }
      }
      setLoading(false);
    };

    fetchSummary();
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
    setShowScrollIndicator(!isNearBottom && scrollHeight > clientHeight);
  };

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
          <div className="text-center">
            <p className="text-gray-900 font-semibold">ZugFlow</p>
            <p className="text-gray-500 text-sm">Caricamento...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Magazzino</h1>
            <div className="flex items-center gap-2">
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
          <Button onClick={() => setShowFiltersSidebar(true)}>
            <Download className="h-4 w-4 mr-2" />
            Filtri
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Prodotti Totali</p>
                  <p className="text-2xl font-semibold text-gray-900">{warehouseItems}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Valore Totale</p>
                  <p className="text-2xl font-semibold text-gray-900">€{totalValue.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Euro className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Clienti</p>
                  <p className="text-2xl font-semibold text-gray-900">{clients}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ordini</p>
                  <p className="text-2xl font-semibold text-gray-900">{orders}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories Distribution */}
          <Card className="border border-gray-200 shadow-sm lg:col-span-2 hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Distribuzione per Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(categories).map(([category, count], index) => {
                  const percentage = totalProducts > 0 ? (count / totalProducts * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{count} prodotti</span>
                          <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-900 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(categories).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nessuna categoria disponibile</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Prodotti Principali</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Più Richiesto</span>
                  </div>
                  <p className="font-semibold text-gray-900">{mostUsedProduct || "N/A"}</p>
                  {mostUsedProductData && (
                    <p className="text-xs text-gray-500 mt-1">{mostUsedProductData.quantity} unità</p>
                  )}
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingDown className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Meno Movimentato</span>
                  </div>
                  <p className="font-semibold text-gray-900">{leastUsedProduct || "N/A"}</p>
                  {leastUsedProductData && (
                    <p className="text-xs text-gray-500 mt-1">{leastUsedProductData.quantity} unità</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Servizi</p>
                  <p className="text-xl font-semibold text-gray-900">{services}</p>
                </div>
                <ClipboardList className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Coupon</p>
                  <p className="text-xl font-semibold text-gray-900">{coupons}</p>
                </div>
                <Tag className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Appuntamenti</p>
                  <p className="text-xl font-semibold text-gray-900">{appointments}</p>
                </div>
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Quantità Totale</p>
                  <p className="text-xl font-semibold text-gray-900">{totalQuantity}</p>
                </div>
                <Archive className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Extended Content for Better Scrolling Demo */}
        <section>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Attività Recenti</h3>
            <p className="text-gray-600">Cronologia delle operazioni</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-gray-900">Movimenti Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Aggiornamento stock prodotto {item}</p>
                        <p className="text-xs text-gray-500">2 ore fa</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-gray-900">Ordini Recenti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Ordine #{item}000</p>
                        <p className="text-xs text-gray-500">Cliente: Mario Rossi</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-12 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-500">ZugFlow - Gestionale Magazzino</p>
            <p className="text-xs text-gray-400 mt-1">Dati aggiornati in tempo reale</p>
          </div>
        </footer>
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

        {/* Search */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Cerca</h3>
          <Input
            type="text"
            placeholder="Cerca prodotti..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
          />
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Categoria</h3>
          <select
            className="w-full p-2 border rounded-lg"
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="all">Tutte le categorie</option>
            {Object.keys(categories).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Summary Section */}
        <div className="mt-auto">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Riepilogo Magazzino</h3>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Totale Prodotti</span>
                <p className="text-lg font-semibold text-purple-600">{totalProducts}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Valore Totale</span>
                <p className="text-sm font-medium text-gray-700">€{totalValue.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Scorte Basse</span>
                <p className="text-sm font-medium text-orange-600">{productsBelowThreshold}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">In Scadenza</span>
                <p className="text-sm font-medium text-red-600">{expiringProducts}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default WarehouseDashboard;
