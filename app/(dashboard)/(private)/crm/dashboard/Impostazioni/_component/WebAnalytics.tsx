'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  MessageSquare,
  Star,
  Eye,
  MousePointer,
  Smartphone,
  Monitor,
  Globe,
  BarChart3,
  RefreshCw,
  Download
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const supabase = createClient();

interface AnalyticsData {
  period: number;
  start_date: string;
  daily_stats: Record<string, {
    visits: number;
    bookings: number;
    messages: number;
    testimonials: number;
  }>;
  total_stats: {
    total_visits: number;
    total_bookings: number;
    total_messages: number;
    total_testimonials: number;
    approved_testimonials: number;
    pending_testimonials: number;
    confirmed_bookings: number;
    pending_bookings: number;
    conversion_rate: string;
  };
  traffic_sources: Record<string, number>;
  device_stats: Record<string, number>;
}

interface WebAnalyticsProps {
  salonId: string;
}

export default function WebAnalytics({ salonId }: WebAnalyticsProps) {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');

  useEffect(() => {
    fetchAnalytics();
  }, [salonId, selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/salon-web/analytics?salon_id=${salonId}&period=${selectedPeriod}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore nel caricamento delle statistiche');
      }

      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le statistiche del sito web.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('it-IT').format(num);
  };

  const formatPercentage = (value: string) => {
    return `${parseFloat(value).toFixed(1)}%`;
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '7': return 'Ultimi 7 giorni';
      case '30': return 'Ultimi 30 giorni';
      case '90': return 'Ultimi 90 giorni';
      default: return `Ultimi ${period} giorni`;
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun dato disponibile</h3>
            <p className="text-gray-600 mb-4">
              Le statistiche del sito web saranno disponibili dopo le prime visite.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Statistiche Sito Web</h2>
          <p className="text-gray-600">Monitora le performance della tua pagina web</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          >
            <option value="7">Ultimi 7 giorni</option>
            <option value="30">Ultimi 30 giorni</option>
            <option value="90">Ultimi 90 giorni</option>
          </select>
          <Button
            variant="outline"
            onClick={fetchAnalytics}
            className="px-3"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Visite Totali</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(analytics.total_stats.total_visits)}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="outline" className="text-xs">
                {getPeriodLabel(selectedPeriod)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Prenotazioni</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(analytics.total_stats.total_bookings)}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {analytics.total_stats.confirmed_bookings} confermate
              </Badge>
              <Badge variant="outline" className="text-xs">
                {analytics.total_stats.pending_bookings} in attesa
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messaggi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(analytics.total_stats.total_messages)}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="outline" className="text-xs">
                Contatti ricevuti
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasso Conversione</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(analytics.total_stats.conversion_rate)}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="outline" className="text-xs">
                Visite → Prenotazioni
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Testimonials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Testimonial
            </CardTitle>
            <CardDescription>
              Gestione delle recensioni dei clienti
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Totale testimonial</span>
                <span className="font-semibold">{formatNumber(analytics.total_stats.total_testimonials)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Approvati</span>
                <Badge className="bg-green-100 text-green-800">
                  {formatNumber(analytics.total_stats.approved_testimonials)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">In attesa</span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {formatNumber(analytics.total_stats.pending_testimonials)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-500" />
              Dispositivi
            </CardTitle>
            <CardDescription>
              Distribuzione per tipo di dispositivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.device_stats).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {device === 'mobile' ? (
                      <Smartphone className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Monitor className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="text-sm text-gray-600 capitalize">{device}</span>
                  </div>
                  <span className="font-semibold">{formatNumber(count)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-500" />
            Fonti di Traffico
          </CardTitle>
          <CardDescription>
            Da dove provengono i visitatori del tuo sito
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(analytics.traffic_sources).length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nessun dato sulle fonti di traffico disponibile</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(analytics.traffic_sources)
                .sort(([,a], [,b]) => b - a)
                .map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 capitalize">
                        {source === 'direct' ? 'Accesso diretto' : source}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatNumber(count)}</span>
                      <span className="text-xs text-gray-500">
                        ({((count / analytics.total_stats.total_visits) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-violet-500" />
            Attività Giornaliera
          </CardTitle>
          <CardDescription>
            Andamento delle visite negli ultimi {selectedPeriod} giorni
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.daily_stats)
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .slice(-7) // Mostra solo gli ultimi 7 giorni
              .map(([date, stats]) => (
                <div key={date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(date).toLocaleDateString('it-IT', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {stats.visits}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {stats.bookings}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {stats.messages}
                      </span>
                    </div>
                  </div>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-violet-500 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((stats.visits / Math.max(...Object.values(analytics.daily_stats).map(s => s.visits))) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 