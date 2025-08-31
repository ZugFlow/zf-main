"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Star,
  Send,
  FileText,
  User,
  Calendar,
  Tag,
  Trash2,
  Edit,
  Shield,
  Mail
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface SupportTicket {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'closed';
  category: 'general' | 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'account' | 'integration';
  created_at: string;
  updated_at: string;
  last_response_at?: string;
  last_response_is_admin?: boolean;
  response_count: number;
  user_rating?: number;
  user_feedback?: string;
}

interface TicketResponse {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_id: string;
  user_name?: string;
}

interface TicketStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  urgent_tickets: number;
  high_priority_tickets: number;
}

const supabase = createClient();

const priorityColors = {
  low: "bg-gray-100 text-gray-700 border-gray-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  urgent: "bg-red-100 text-red-700 border-red-200"
};

const statusColors = {
  open: "bg-yellow-100 text-yellow-700 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  waiting_for_user: "bg-purple-100 text-purple-700 border-purple-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
  closed: "bg-gray-100 text-gray-700 border-gray-200"
};

const categoryIcons = {
  general: HelpCircle,
  technical: FileText,
  billing: Tag,
  feature_request: Star,
  bug_report: AlertCircle,
  account: User,
  integration: MessageSquare
};

export default function AdminSupportTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responses, setResponses] = useState<TicketResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<SupportTicket | null>(null);

  // Form states
  const [responseMessage, setResponseMessage] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [internalNotes, setInternalNotes] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchTickets();
      fetchStats();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        toast.error("Accesso negato. Solo gli amministratori possono accedere a questa pagina.");
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin access:", error);
      toast.error("Errore nella verifica dei permessi");
      router.push('/dashboard');
    }
  };

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase.rpc('get_tickets_with_latest_response', {
        user_uuid: null // null per ottenere tutti i ticket
      });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Errore nel caricamento dei ticket");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_support_ticket_stats', {
        user_uuid: null // null per ottenere statistiche globali
      });

      if (error) throw error;
      setStats(data?.[0] || null);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchResponses = async (ticketId: string) => {
    try {
      // Prima recupera le risposte
      const { data: responsesData, error: responsesError } = await supabase
        .from('support_ticket_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (responsesError) throw responsesError;

      // Poi recupera i nomi degli utenti
      const userIds = responsesData?.map(r => r.user_id).filter((id, index, arr) => arr.indexOf(id) === index) || [];
      
      let userNames: { [key: string]: string } = {};
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        if (profilesError) {
          console.warn("Error fetching user names:", profilesError);
        } else {
          userNames = profilesData?.reduce((acc, profile) => {
            acc[profile.id] = profile.full_name || 'Utente';
            return acc;
          }, {} as { [key: string]: string }) || {};
        }
      }

      // Combina i dati
      const responsesWithNames = responsesData?.map(response => ({
        ...response,
        user_name: userNames[response.user_id] || 'Utente'
      })) || [];
      
      setResponses(responsesWithNames);
    } catch (error) {
      console.error("Error fetching responses:", error);
      toast.error("Errore nel caricamento delle risposte");
    }
  };

  const addResponse = async () => {
    if (!responseMessage.trim() || !selectedTicket) return;

    setIsResponding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utente non autenticato");

      console.log("Adding response:", {
        ticket_id: selectedTicket.id,
        user_id: user.id,
        message: responseMessage,
        is_admin: true
      });

      const { data, error } = await supabase
        .from('support_ticket_responses')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: responseMessage,
          is_admin: true
        })
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Response added successfully:", data);

      // Aggiorna lo stato del ticket se necessario
      if (selectedTicket.status === 'waiting_for_user') {
        const { error: updateError } = await supabase
          .from('support_tickets')
          .update({ status: 'in_progress' })
          .eq('id', selectedTicket.id);

        if (updateError) {
          console.warn("Error updating ticket status:", updateError);
        }
      }

      setResponseMessage("");
      await fetchResponses(selectedTicket.id);
      await fetchTickets();
      toast.success("Risposta inviata!");
    } catch (error) {
      console.error("Error adding response:", error);
      toast.error("Errore nell'invio della risposta: " + (error as any)?.message || "Errore sconosciuto");
    } finally {
      setIsResponding(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status: status,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null,
          closed_at: status === 'closed' ? new Date().toISOString() : null
        })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success("Stato del ticket aggiornato!");
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: status as any } : null);
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast.error("Errore nell'aggiornamento dello stato");
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteTicket = async () => {
    if (!ticketToDelete) return;

    setIsUpdating(true);
    try {
      // Prima elimina le risposte
      const { error: responsesError } = await supabase
        .from('support_ticket_responses')
        .delete()
        .eq('ticket_id', ticketToDelete.id);

      if (responsesError) throw responsesError;

      // Poi elimina il ticket
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', ticketToDelete.id);

      if (ticketError) throw ticketError;

      toast.success("Ticket eliminato con successo!");
      setShowDeleteDialog(false);
      setTicketToDelete(null);
      fetchTickets();
      if (selectedTicket?.id === ticketToDelete.id) {
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error("Errore nell'eliminazione del ticket");
    } finally {
      setIsUpdating(false);
    }
  };

  const openTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    fetchResponses(ticket.id);
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority;
    const matchesCategory = filterCategory === "all" || ticket.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Bassa';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Aperto';
      case 'in_progress': return 'In Lavorazione';
      case 'waiting_for_user': return 'In Attesa Utente';
      case 'resolved': return 'Risolto';
      case 'closed': return 'Chiuso';
      default: return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general': return 'Generale';
      case 'technical': return 'Tecnico';
      case 'billing': return 'Fatturazione';
      case 'feature_request': return 'Richiesta Funzionalità';
      case 'bug_report': return 'Segnalazione Bug';
      case 'account': return 'Account';
      case 'integration': return 'Integrazione';
      default: return category;
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifica Permessi</h2>
          <p className="text-gray-600">Controllo accesso amministratore...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestione Ticket di Supporto</h1>
          <p className="text-gray-600 mt-2">Pannello amministratore per la gestione dei ticket di supporto</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-violet-600" />
          <span className="text-sm font-medium text-violet-600">Pannello Admin</span>
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Totale Ticket</p>
                <p className="text-2xl font-bold text-blue-900">{stats?.total_tickets || 0}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Aperti</p>
                <p className="text-2xl font-bold text-yellow-900">{stats?.open_tickets || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Urgenti</p>
                <p className="text-2xl font-bold text-orange-900">{stats?.urgent_tickets || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Risolti</p>
                <p className="text-2xl font-bold text-green-900">{stats?.resolved_tickets || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenuto principale */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Tutti</TabsTrigger>
          <TabsTrigger value="open">Aperti</TabsTrigger>
          <TabsTrigger value="in_progress">In Lavorazione</TabsTrigger>
          <TabsTrigger value="waiting">In Attesa</TabsTrigger>
          <TabsTrigger value="resolved">Risolti</TabsTrigger>
          <TabsTrigger value="closed">Chiusi</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Filtri e ricerca */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Cerca per oggetto, descrizione, nome utente o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli stati</SelectItem>
                      <SelectItem value="open">Aperti</SelectItem>
                      <SelectItem value="in_progress">In Lavorazione</SelectItem>
                      <SelectItem value="waiting_for_user">In Attesa</SelectItem>
                      <SelectItem value="resolved">Risolti</SelectItem>
                      <SelectItem value="closed">Chiusi</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priorità" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte le priorità</SelectItem>
                      <SelectItem value="low">Bassa</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte le categorie</SelectItem>
                      <SelectItem value="general">Generale</SelectItem>
                      <SelectItem value="technical">Tecnico</SelectItem>
                      <SelectItem value="billing">Fatturazione</SelectItem>
                      <SelectItem value="feature_request">Richiesta Funzionalità</SelectItem>
                      <SelectItem value="bug_report">Segnalazione Bug</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="integration">Integrazione</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista ticket */}
          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun ticket trovato</h3>
                  <p className="text-gray-500">
                    {searchTerm || filterStatus !== "all" || filterPriority !== "all" || filterCategory !== "all"
                      ? "Prova a modificare i filtri di ricerca"
                      : "Non ci sono ticket di supporto"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openTicket(ticket)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                          <Badge className={priorityColors[ticket.priority]}>
                            {getPriorityLabel(ticket.priority)}
                          </Badge>
                          <Badge className={statusColors[ticket.status]}>
                            {getStatusLabel(ticket.status)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {ticket.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {ticket.user_name} ({ticket.user_email})
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: it })}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {ticket.response_count} risposte
                          </div>
                          {ticket.last_response_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Ultima risposta: {format(new Date(ticket.last_response_at), 'dd/MM/yyyy HH:mm', { locale: it })}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {React.createElement(categoryIcons[ticket.category], { className: "w-5 h-5 text-gray-400" })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog per visualizzare e gestire ticket */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  {selectedTicket.subject}
                </DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={priorityColors[selectedTicket.priority]}>
                      {getPriorityLabel(selectedTicket.priority)}
                    </Badge>
                    <Badge className={statusColors[selectedTicket.status]}>
                      {getStatusLabel(selectedTicket.status)}
                    </Badge>
                    <Badge variant="outline">
                      {getCategoryLabel(selectedTicket.category)}
                    </Badge>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Colonna sinistra - Dettagli e azioni */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Dettagli del ticket */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dettagli del Ticket</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Utente</label>
                        <p className="text-sm text-gray-600">{selectedTicket.user_name}</p>
                        <p className="text-xs text-gray-500">{selectedTicket.user_email}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Descrizione</label>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{selectedTicket.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium text-gray-700">Creato il</label>
                          <p className="text-gray-600">{format(new Date(selectedTicket.created_at), 'dd/MM/yyyy HH:mm', { locale: it })}</p>
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">Ultimo aggiornamento</label>
                          <p className="text-gray-600">{format(new Date(selectedTicket.updated_at), 'dd/MM/yyyy HH:mm', { locale: it })}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Azioni amministrative */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Azioni Amministrative</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Cambio stato */}
                      <div>
                        <label className="text-sm font-medium">Cambia Stato</label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Aperto</SelectItem>
                            <SelectItem value="in_progress">In Lavorazione</SelectItem>
                            <SelectItem value="waiting_for_user">In Attesa Utente</SelectItem>
                            <SelectItem value="resolved">Risolto</SelectItem>
                            <SelectItem value="closed">Chiuso</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={() => updateTicketStatus(selectedTicket.id, newStatus)}
                          disabled={isUpdating || newStatus === selectedTicket.status}
                          className="w-full mt-2"
                        >
                          {isUpdating ? "Aggiornamento..." : "Aggiorna Stato"}
                        </Button>
                      </div>

                      {/* Note interne */}
                      <div>
                        <label className="text-sm font-medium">Note Interne</label>
                        <Textarea
                          value={internalNotes}
                          onChange={(e) => setInternalNotes(e.target.value)}
                          placeholder="Note interne per il team..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>

                      {/* Azioni pericolose */}
                      <div className="pt-4 border-t">
                        <div className="flex gap-2">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              setTicketToDelete(selectedTicket);
                              setShowDeleteDialog(true);
                            }}
                            className="flex-1"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Elimina
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Colonna destra - Conversazione */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Risposte */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Conversazione</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <div className="space-y-4">
                          {responses.map((response) => (
                            <div key={response.id} className={`flex ${response.is_admin ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] p-3 rounded-lg ${
                                response.is_admin 
                                  ? 'bg-violet-50 border border-violet-200' 
                                  : 'bg-gray-50 border border-gray-200'
                              }`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-xs font-medium ${
                                    response.is_admin ? 'text-violet-700' : 'text-gray-700'
                                  }`}>
                                    {response.is_admin ? 'Supporto' : response.user_name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {format(new Date(response.created_at), 'dd/MM/yyyy HH:mm', { locale: it })}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{response.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Aggiungi risposta */}
                  {selectedTicket.status !== 'closed' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Risposta del Supporto</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Textarea
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                            placeholder="Scrivi la risposta del supporto..."
                            rows={4}
                          />
                          <div className="flex justify-end">
                            <Button onClick={addResponse} disabled={isResponding || !responseMessage.trim()}>
                              <Send className="w-4 h-4 mr-2" />
                              {isResponding ? "Invio..." : "Invia Risposta"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog di conferma eliminazione */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questo ticket? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={deleteTicket} disabled={isUpdating}>
              {isUpdating ? "Eliminazione..." : "Elimina Ticket"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
