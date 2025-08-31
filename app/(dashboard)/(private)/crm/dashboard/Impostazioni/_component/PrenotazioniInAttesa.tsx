'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { 
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Phone,
  CalendarDays,
  Timer,
  Eye,
  EyeOff
} from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const supabase = createClient();

interface OnlineBooking {
  id: string;
  salon_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  requested_date: string;
  requested_time: string;
  service_id: string;
  service_name: string;
  service_duration: number;
  service_price: number;
  team_member_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  team_member_name?: string;
}

export default function PrenotazioniInAttesa() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<OnlineBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<OnlineBooking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [salonId, setSalonId] = useState<string | null>(null);

  // Carica i dati iniziali
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Ottieni salon_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utente non autenticato');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('salon_id')
        .eq('id', user.id)
        .single();

      if (!profileData?.salon_id) {
        throw new Error('Salon ID non trovato');
      }

      setSalonId(profileData.salon_id);

      // Carica prenotazioni
      await loadBookings(profileData.salon_id);

    } catch (error) {
      console.error('Errore nel caricamento dei dati:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le prenotazioni",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async (salonId: string) => {
    try {
      const { data: bookingsData, error } = await supabase
        .from('online_bookings')
        .select(`
          *,
          team:team_member_id(name)
        `)
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const bookingsWithTeamName = (bookingsData || []).map(booking => ({
        ...booking,
        team_member_name: booking.team?.name || null
      }));

      setBookings(bookingsWithTeamName);

    } catch (error) {
      console.error('Errore nel caricamento delle prenotazioni:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le prenotazioni",
        variant: "destructive"
      });
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject') => {
    if (!salonId) return;

    try {
      setProcessing(true);

      const response = await fetch(`/api/online-bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Successo",
          description: data.message,
        });
        
        // Ricarica le prenotazioni
        await loadBookings(salonId);
        setIsDialogOpen(false);
        setSelectedBooking(null);
      } else {
        toast({
          title: "Errore",
          description: data.error || "Errore durante l'operazione",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Errore nell\'operazione:', error);
      toast({
        title: "Errore",
        description: "Impossibile completare l'operazione",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">In Attesa</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approvata</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rifiutata</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancellata</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const allBookings = bookings;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Prenotazioni Online</h2>
          <p className="text-muted-foreground">
            Gestisci le prenotazioni online del tuo salone
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            {pendingBookings.length} in attesa
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            In Attesa ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Tutte ({allBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingBookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nessuna prenotazione in attesa</h3>
                <p className="text-muted-foreground text-center">
                  Tutte le prenotazioni sono state processate
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Prenotazioni in Attesa di Approvazione</CardTitle>
                <CardDescription>
                  Gestisci le prenotazioni che richiedono la tua approvazione
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data e Ora</TableHead>
                      <TableHead>Servizio</TableHead>
                      <TableHead>Membro</TableHead>
                      <TableHead>Prezzo</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking.customer_name}</div>
                            {booking.customer_email && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {booking.customer_email}
                              </div>
                            )}
                            {booking.customer_phone && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {booking.customer_phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(booking.requested_date)}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(booking.requested_time)} - {formatTime(booking.requested_time)} + {booking.service_duration}min
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking.service_name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {booking.service_duration} min
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.team_member_name || 'Non specificato'}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            €{booking.service_price.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog open={isDialogOpen && selectedBooking?.id === booking.id} onOpenChange={(open) => {
                              setIsDialogOpen(open);
                              if (!open) setSelectedBooking(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedBooking(booking)}
                                >
                                  <Eye className="h-4 w-4" />
                                  Dettagli
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Dettagli Prenotazione</DialogTitle>
                                  <DialogDescription>
                                    Verifica i dettagli della prenotazione prima di approvarla o rifiutarla
                                  </DialogDescription>
                                </DialogHeader>
                                
                                {selectedBooking && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-medium mb-2">Informazioni Cliente</h4>
                                        <div className="space-y-1 text-sm">
                                          <p><strong>Nome:</strong> {selectedBooking.customer_name}</p>
                                          {selectedBooking.customer_email && (
                                            <p><strong>Email:</strong> {selectedBooking.customer_email}</p>
                                          )}
                                          {selectedBooking.customer_phone && (
                                            <p><strong>Telefono:</strong> {selectedBooking.customer_phone}</p>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-medium mb-2">Dettagli Prenotazione</h4>
                                        <div className="space-y-1 text-sm">
                                          <p><strong>Data:</strong> {formatDate(selectedBooking.requested_date)}</p>
                                          <p><strong>Orario:</strong> {formatTime(selectedBooking.requested_time)}</p>
                                          <p><strong>Servizio:</strong> {selectedBooking.service_name}</p>
                                          <p><strong>Durata:</strong> {selectedBooking.service_duration} min</p>
                                          <p><strong>Prezzo:</strong> €{selectedBooking.service_price.toFixed(2)}</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {selectedBooking.notes && (
                                      <div>
                                        <h4 className="font-medium mb-2">Note</h4>
                                        <p className="text-sm bg-gray-50 p-3 rounded-lg">
                                          {selectedBooking.notes}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsDialogOpen(false);
                                      setSelectedBooking(null);
                                    }}
                                  >
                                    Annulla
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleBookingAction(selectedBooking!.id, 'reject')}
                                    disabled={processing}
                                  >
                                    {processing ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Rifiutando...
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Rifiuta
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    onClick={() => handleBookingAction(selectedBooking!.id, 'approve')}
                                    disabled={processing}
                                  >
                                    {processing ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Approvando...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approva
                                      </>
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tutte le Prenotazioni</CardTitle>
              <CardDescription>
                Storico completo delle prenotazioni online
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data e Ora</TableHead>
                    <TableHead>Servizio</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Prezzo</TableHead>
                    <TableHead>Data Creazione</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.customer_name}</div>
                          {booking.customer_email && (
                            <div className="text-sm text-muted-foreground">
                              {booking.customer_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatDate(booking.requested_date)}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatTime(booking.requested_time)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.service_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {booking.service_duration} min
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(booking.status)}
                      </TableCell>
                      <TableCell>
                        €{booking.service_price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {new Date(booking.created_at).toLocaleDateString('it-IT')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 