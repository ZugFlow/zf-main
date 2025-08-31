'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";
import { useAuthContext } from "../query/AuthContext";
import { fetchArchivedAppointments, restoreArchivedAppointment } from "../query/query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Archive, 
  RotateCcw, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  Scissors,
  Filter,
  Trash2
} from 'lucide-react';
import { format, parse } from 'date-fns';
import { it } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";

const supabase = createClient();

interface ArchivedAppointment {
  id: string;
  nome: string;
  orarioInizio: string;
  orarioFine: string;
  data: string;
  team_id: string;
  servizio: string;
  status: string;
  archived_at: string;
  original_id: string;
  services?: Array<{ id: string; servizio: string; prezzo: number }>;
}

interface TeamMember {
  id: string;
  name: string;
}

export default function ArchivedAppointments() {
  const { userId } = useAuthContext();
  const { toast } = useToast();
  const [archivedAppointments, setArchivedAppointments] = useState<ArchivedAppointment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Fetch archived appointments and team members
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        
        // Fetch archived appointments
        const appointments = await fetchArchivedAppointments(userId);
        setArchivedAppointments(appointments);

        // Fetch team members
        const { data: teamData, error: teamError } = await supabase
          .from("team")
          .select("id, name")
          .eq("user_id", userId);

        if (teamError) throw teamError;
        setTeamMembers(teamData || []);

      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
        toast({
          title: "Errore",
          description: "Impossibile caricare gli appuntamenti archiviati",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, toast]);

  // Filter appointments based on search and filters
  const filteredAppointments = archivedAppointments.filter(appointment => {
    const matchesSearch = appointment.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.servizio.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || appointment.status === selectedStatus;
    
    const matchesDate = !selectedDate || appointment.data === selectedDate;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Handle restore appointment
  const handleRestore = async (appointment: ArchivedAppointment) => {
    try {
      await restoreArchivedAppointment(appointment);
      
      // Remove from local state
      setArchivedAppointments(prev => 
        prev.filter(apt => apt.original_id !== appointment.original_id)
      );

      toast({
        title: "Appuntamento ripristinato",
        description: `${appointment.nome} è stato ripristinato con successo`,
      });
    } catch (error) {
      console.error("Errore nel ripristino:", error);
      toast({
        title: "Errore",
        description: "Impossibile ripristinare l'appuntamento",
        variant: "destructive",
      });
    }
  };

  // Get team member name
  const getTeamMemberName = (teamId: string) => {
    const member = teamMembers.find(m => m.id === teamId);
    return member?.name || 'Membro non trovato';
  };

  // Calculate appointment duration
  const getDuration = (start: string, end: string) => {
    const startTime = parse(start, "HH:mm", new Date());
    const endTime = parse(end, "HH:mm", new Date());
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    return diffMins;
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'EEEE d MMMM yyyy', { locale: it });
    } catch {
      return dateStr;
    }
  };

  // Format archive date
  const formatArchiveDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: it });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento appuntamenti archiviati...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Archive className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appuntamenti Archiviati</h1>
            <p className="text-gray-600">
              {archivedAppointments.length} appuntamento{archivedAppointments.length !== 1 ? 'i' : ''} archiviat{archivedAppointments.length !== 1 ? 'i' : 'o'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca per nome o servizio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Tutti gli stati</option>
              <option value="Completato">Completato</option>
              <option value="Annullato">Annullato</option>
              <option value="Assente">Assente</option>
              <option value="Pagato in contanti">Pagato in contanti</option>
              <option value="paid_card">Pagato con carta</option>
              <option value="paid_online">Pagato online</option>
            </select>

            {/* Date filter */}
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2"
            />

            {/* Clear filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('all');
                setSelectedDate('');
              }}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Pulisci filtri
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointments list */}
      {filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Archive className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {archivedAppointments.length === 0 
                ? "Nessun appuntamento archiviato" 
                : "Nessun appuntamento trovato con i filtri selezionati"
              }
            </h3>
            <p className="text-gray-500 text-center">
              {archivedAppointments.length === 0 
                ? "Gli appuntamenti archiviati appariranno qui" 
                : "Prova a modificare i filtri di ricerca"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAppointments.map((appointment) => (
            <Card key={appointment.original_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Appointment details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {appointment.nome}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(appointment.data)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {appointment.orarioInizio} - {appointment.orarioFine} 
                            ({getDuration(appointment.orarioInizio, appointment.orarioFine)} min)
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Archiviato il {formatArchiveDate(appointment.archived_at)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Servizio:</span>
                        <span className="font-medium">{appointment.servizio}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Membro:</span>
                        <span className="font-medium">{getTeamMemberName(appointment.team_id)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Stato:</span>
                        <Badge 
                          variant={appointment.status === 'Completato' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Services */}
                    {appointment.services && appointment.services.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Servizi:</h4>
                        <div className="flex flex-wrap gap-2">
                          {appointment.services.map((service) => (
                            <Badge key={service.id} variant="outline" className="text-xs">
                              {service.servizio} - €{service.prezzo}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:flex-shrink-0">
                    <Button
                      onClick={() => handleRestore(appointment)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Ripristina
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 