"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
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
  Tag
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useLocalization } from "@/hooks/useLocalization";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface SupportTicket {
  id: string;
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

const SupportTickets: React.FC = () => {
  const { t } = useLocalization();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responses, setResponses] = useState<TicketResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");

  // Form states
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "medium" as const,
    category: "general" as const
  });
  const [responseMessage, setResponseMessage] = useState("");

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_tickets_with_latest_response', {
        user_uuid: user.id
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_support_ticket_stats', {
        user_uuid: user.id
      });

      if (error) throw error;
      setStats(data?.[0] || null);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchResponses = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_ticket_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error("Error fetching responses:", error);
      toast.error("Errore nel caricamento delle risposte");
    }
  };

  const createTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utente non autenticato");

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: profile?.full_name || user.email?.split('@')[0] || 'Utente',
          subject: newTicket.subject,
          description: newTicket.description,
          priority: newTicket.priority,
          category: newTicket.category
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Ticket creato con successo!");
      setNewTicket({ subject: "", description: "", priority: "medium", category: "general" });
      fetchTickets();
      fetchStats();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Errore nella creazione del ticket");
    } finally {
      setIsCreating(false);
    }
  };

  const addResponse = async () => {
    if (!responseMessage.trim() || !selectedTicket) return;

    setIsResponding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utente non autenticato");

      const { error } = await supabase
        .from('support_ticket_responses')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: responseMessage,
          is_admin: false
        });

      if (error) throw error;

      // Aggiorna lo stato del ticket se necessario
      if (selectedTicket.status === 'waiting_for_user') {
        await supabase
          .from('support_tickets')
          .update({ status: 'open' })
          .eq('id', selectedTicket.id);
      }

      setResponseMessage("");
      fetchResponses(selectedTicket.id);
      fetchTickets();
      toast.success("Risposta inviata!");
    } catch (error) {
      console.error("Error adding response:", error);
      toast.error("Errore nell'invio della risposta");
    } finally {
      setIsResponding(false);
    }
  };

  const openTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    fetchResponses(ticket.id);
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority;
    const matchesCategory = filterCategory === "all" || ticket.category === filterCategory;
    
    // Filtra anche per tab attivo
    const matchesTab = activeTab === "all" || ticket.status === activeTab;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesTab;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4" />;
      case 'waiting_for_user': return <User className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

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
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header con statistiche */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 gap-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm">Tutti</TabsTrigger>
          <TabsTrigger value="open" className="text-xs sm:text-sm">Aperti</TabsTrigger>
          <TabsTrigger value="in_progress" className="text-xs sm:text-sm">In Lavorazione</TabsTrigger>
          <TabsTrigger value="waiting_for_user" className="text-xs sm:text-sm">In Attesa</TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs sm:text-sm">Risolti</TabsTrigger>
          <TabsTrigger value="closed" className="text-xs sm:text-sm">Chiusi</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Filtri e ricerca */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Cerca nei ticket..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-32">
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
                    <SelectTrigger className="w-full sm:w-32">
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
                    <SelectTrigger className="w-full sm:w-40">
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
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterStatus !== "all" || filterPriority !== "all" || filterCategory !== "all"
                      ? "Prova a modificare i filtri di ricerca"
                      : "Non hai ancora creato nessun ticket di supporto"}
                  </p>
                  {!searchTerm && filterStatus === "all" && filterPriority === "all" && filterCategory === "all" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Crea il tuo primo ticket
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Nuovo Ticket di Supporto</DialogTitle>
                          <DialogDescription>
                            Descrivi il tuo problema o la tua richiesta. Il nostro team ti risponderà il prima possibile.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Oggetto *</label>
                            <Input
                              value={newTicket.subject}
                              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                              placeholder="Breve descrizione del problema"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Priorità</label>
                              <Select value={newTicket.priority} onValueChange={(value: any) => setNewTicket({ ...newTicket, priority: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Bassa</SelectItem>
                                  <SelectItem value="medium">Media</SelectItem>
                                  <SelectItem value="high">Alta</SelectItem>
                                  <SelectItem value="urgent">Urgente</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium">Categoria</label>
                              <Select value={newTicket.category} onValueChange={(value: any) => setNewTicket({ ...newTicket, category: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
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
                          
                          <div>
                            <label className="text-sm font-medium">Descrizione *</label>
                            <Textarea
                              value={newTicket.description}
                              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                              placeholder="Descrivi in dettaglio il tuo problema o la tua richiesta..."
                              rows={6}
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setNewTicket({ subject: "", description: "", priority: "medium", category: "general" })}>
                              Annulla
                            </Button>
                            <Button onClick={createTicket} disabled={isCreating}>
                              {isCreating ? "Creazione..." : "Crea Ticket"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredTickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openTicket(ticket)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900 truncate">{ticket.subject}</h3>
                          <Badge className={`${priorityColors[ticket.priority]} text-xs`}>
                            {getPriorityLabel(ticket.priority)}
                          </Badge>
                          <Badge className={`${statusColors[ticket.status]} text-xs`}>
                            {getStatusLabel(ticket.status)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 break-words">
                          {ticket.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: it })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 flex-shrink-0" />
                            <span>{ticket.response_count} risposte</span>
                          </div>
                          {ticket.last_response_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">Ultima: {format(new Date(ticket.last_response_at), 'dd/MM/yyyy HH:mm', { locale: it })}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
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

      {/* Dialog per visualizzare ticket e risposte */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] overflow-hidden">
          {selectedTicket && (
            <>
              <DialogHeader className="pb-4">
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="w-5 h-5" />
                  <span className="truncate">{selectedTicket.subject}</span>
                </DialogTitle>
                <DialogDescription>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
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

              <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Dettagli del ticket */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Dettagli del Ticket</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Descrizione</label>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap break-words">{selectedTicket.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium text-gray-700">Creato il</label>
                          <p className="text-gray-600">{format(new Date(selectedTicket.created_at), 'dd/MM/yyyy HH:mm', { locale: it })}</p>
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">Ultimo aggiornamento</label>
                          <p className="text-gray-600">{format(new Date(selectedTicket.updated_at), 'dd/MM/yyyy HH:mm', { locale: it })}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risposte */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Conversazione</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 max-h-64">
                      <div className="space-y-4 pr-4">
                        {responses.map((response) => (
                          <div key={response.id} className={`flex ${response.is_admin ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[85%] p-3 rounded-lg ${
                              response.is_admin 
                                ? 'bg-blue-50 border border-blue-200' 
                                : 'bg-gray-50 border border-gray-200'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-medium ${
                                  response.is_admin ? 'text-blue-700' : 'text-gray-700'
                                }`}>
                                  {response.is_admin ? 'Supporto' : 'Tu'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(response.created_at), 'dd/MM/yyyy HH:mm', { locale: it })}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap break-words">{response.message}</p>
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
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Aggiungi Risposta</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Textarea
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          placeholder="Scrivi la tua risposta..."
                          rows={4}
                          className="resize-none"
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
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Pulsante per creare nuovo ticket */}
      <div className="sticky bottom-4 right-4 z-10 flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg">
              <Plus className="w-5 h-5 mr-2" />
              Nuovo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuovo Ticket di Supporto</DialogTitle>
              <DialogDescription>
                Descrivi il tuo problema o la tua richiesta. Il nostro team ti risponderà il prima possibile.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Oggetto *</label>
                <Input
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Breve descrizione del problema"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priorità</label>
                  <Select value={newTicket.priority} onValueChange={(value: any) => setNewTicket({ ...newTicket, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Bassa</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <Select value={newTicket.category} onValueChange={(value: any) => setNewTicket({ ...newTicket, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
              
              <div>
                <label className="text-sm font-medium">Descrizione *</label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Descrivi in dettaglio il tuo problema o la tua richiesta..."
                  rows={6}
                  className="resize-none"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNewTicket({ subject: "", description: "", priority: "medium", category: "general" })}>
                  Annulla
                </Button>
                <Button onClick={createTicket} disabled={isCreating}>
                  {isCreating ? "Creazione..." : "Crea Ticket"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SupportTickets;
