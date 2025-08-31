'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { 
  Calendar, 
  Edit, 
  Save, 
  X, 
  Plus, 
  Trash,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Building2,
  Users,
  RefreshCw
} from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { Member, HolidayBalance } from './types';

const supabase = createClient();

interface HolidayBalanceManagerProps {
  members: Member[];
  salonId: string;
  isManager: boolean;
  currentUser: any;
}

export default function HolidayBalanceManager({ 
  members, 
  salonId, 
  isManager, 
  currentUser 
}: HolidayBalanceManagerProps) {
  const { toast } = useToast();
  const [holidayBalances, setHolidayBalances] = useState<HolidayBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingBalance, setEditingBalance] = useState<HolidayBalance | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '',
    year: new Date().getFullYear(),
    total_days: 30,
    used_days: 0,
    notes: ''
  });

  // Genera anni disponibili (anno corrente + 2 anni precedenti e successivi)
  const availableYears = Array.from({ length: 5 }, (_, i) => 
    new Date().getFullYear() - 2 + i
  );

  // Fetch holiday balances
  const fetchHolidayBalances = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔍 Fetching holiday balances for salon_id:', salonId, 'year:', selectedYear);
      
      // Prima verifica se la tabella esiste
      const { data: tableCheck, error: tableError } = await supabase
        .from('holiday_balances')
        .select('id')
        .limit(1);

      if (tableError) {
        console.error('❌ Table check error:', tableError);
        toast({
          title: "Errore",
          description: "Tabella holiday_balances non trovata. Contatta l'amministratore.",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Table exists, fetching data...');
      
      // Verifica che ci siano membri nel team
      const { data: teamMembers, error: teamError } = await supabase
        .from('team')
        .select('id, name')
        .eq('salon_id', salonId)
        .eq('is_active', true);

      if (teamError) {
        console.error('❌ Error fetching team members:', teamError);
        toast({
          title: "Errore",
          description: "Impossibile caricare i membri del team",
          variant: "destructive"
        });
        return;
      }

      console.log('👥 Team members found:', teamMembers?.length || 0);
      
      const { data: balancesData, error: balancesError } = await supabase
        .from('holiday_balances')
        .select(`
          id,
          member_id,
          year,
          total_days,
          used_days,
          pending_days,
          notes,
          created_at,
          updated_at,
          team:member_id(name, avatar_url, role)
        `)
        .eq('salon_id', salonId)
        .eq('year', selectedYear);

      if (balancesError) {
        console.error('❌ Error fetching holiday balances:', balancesError);
        throw balancesError;
      }

      // Trasforma i dati per matchare l'interfaccia HolidayBalance
      const transformedBalances: HolidayBalance[] = (balancesData || []).map(balance => ({
        id: balance.id,
        member_id: balance.member_id,
        member_name: (balance.team as any)?.name || 'Membro sconosciuto',
        year: balance.year,
        total_days: balance.total_days,
        used_days: balance.used_days || 0,
        remaining_days: balance.total_days - (balance.used_days || 0),
        pending_days: balance.pending_days || 0,
        notes: balance.notes,
        created_at: balance.created_at,
        updated_at: balance.updated_at
      }));

      console.log('✅ Holiday balances fetched:', {
        count: transformedBalances.length,
        year: selectedYear,
        balances: transformedBalances
      });

      setHolidayBalances(transformedBalances);
    } catch (error) {
      console.error('❌ Error in fetchHolidayBalances:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i bilanci ferie",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch balances when year changes
  useEffect(() => {
    if (salonId) {
      console.log('🔄 Fetching balances for salon:', salonId);
      fetchHolidayBalances();
    } else {
      console.warn('⚠️ No valid salonId provided');
    }
  }, [salonId, selectedYear]);

  // Create new holiday balance
  const handleCreateBalance = async () => {
    try {
      if (!formData.member_id || formData.total_days <= 0) {
        toast({
          title: "Errore",
          description: "Compila tutti i campi obbligatori",
          variant: "destructive"
        });
        return;
      }

      if (!salonId) {
        console.error('❌ salonId null:', salonId);
        toast({
          title: "Errore",
          description: "ID del salone non valido. Ricarica la pagina e riprova.",
          variant: "destructive"
        });
        return;
      }

      // Verifica che il salonId sia un UUID valido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(salonId)) {
        console.error('❌ salonId non è un UUID valido:', salonId);
        toast({
          title: "Errore",
          description: "ID del salone non è in formato valido",
          variant: "destructive"
        });
        return;
      }

      console.log('➕ Creating holiday balance:', {
        formData,
        salonId,
        memberExists: members.find(m => m.id === formData.member_id)
      });

      // Verifica che il membro esista
      const member = members.find(m => m.id === formData.member_id);
      if (!member) {
        toast({
          title: "Errore",
          description: "Membro non trovato",
          variant: "destructive"
        });
        return;
      }

      // Nota: La verifica dei duplicati è ora gestita dal vincolo UNIQUE nel database
      console.log('✅ Validazioni completate, procedendo con l\'inserimento...');

      const insertData = {
        member_id: formData.member_id,
        salon_id: salonId,
        year: formData.year,
        total_days: formData.total_days,
        used_days: formData.used_days || 0,
        pending_days: 0,
        notes: formData.notes || null
      };

      console.log('📝 Insert data:', insertData);

      // Validazione finale dei dati
      if (insertData.used_days > insertData.total_days) {
        toast({
          title: "Errore",
          description: "I giorni utilizzati non possono essere maggiori dei giorni totali",
          variant: "destructive"
        });
        return;
      }

      const { data: newBalance, error: createError } = await supabase
        .from('holiday_balances')
        .insert([insertData])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating holiday balance:', createError);
        console.error('❌ Error details:', {
          code: createError.code,
          message: createError.message,
          details: createError.details,
          hint: createError.hint
        });

        // Gestione errori specifici
        let errorMessage = "Impossibile creare il bilancio ferie";
        
        if (createError.message?.includes('Il membro non appartiene al salone specificato')) {
          errorMessage = "Il dipendente selezionato non appartiene a questo salone";
        } else if (createError.message?.includes('salon_id non può essere null')) {
          errorMessage = "ID del salone non valido";
        } else if (createError.message?.includes('duplicate key value')) {
          errorMessage = `Esiste già un bilancio per questo dipendente per l'anno ${formData.year}`;
        } else if (createError.message) {
          errorMessage = createError.message;
        }

        toast({
          title: "Errore",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      // Reset form
      setFormData({
        member_id: '',
        year: new Date().getFullYear(),
        total_days: 30,
        used_days: 0,
        notes: ''
      });
      setIsCreateDialogOpen(false);

      // Refresh data
      fetchHolidayBalances();

      toast({
        title: "Successo",
        description: "Bilancio ferie creato con successo",
      });

    } catch (error) {
      console.error('❌ Error creating holiday balance:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare il bilancio ferie",
        variant: "destructive"
      });
    }
  };

  // Update holiday balance
  const handleUpdateBalance = async () => {
    try {
      if (!editingBalance || editingBalance.total_days <= 0) {
        toast({
          title: "Errore",
          description: "Dati non validi",
          variant: "destructive"
        });
        return;
      }

      console.log('✏️ Updating holiday balance:', editingBalance);

      const { error: updateError } = await supabase
        .from('holiday_balances')
        .update({
          total_days: editingBalance.total_days,
          used_days: editingBalance.used_days,
          notes: editingBalance.notes
        })
        .eq('id', editingBalance.id);

      if (updateError) {
        console.error('❌ Error updating holiday balance:', updateError);
        throw updateError;
      }

      setEditingBalance(null);
      setIsEditDialogOpen(false);

      // Refresh data
      fetchHolidayBalances();

      toast({
        title: "Successo",
        description: "Bilancio ferie aggiornato con successo",
      });

    } catch (error) {
      console.error('❌ Error updating holiday balance:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il bilancio ferie",
        variant: "destructive"
      });
    }
  };

  // Delete holiday balance
  const handleDeleteBalance = async (balanceId: string) => {
    try {
      console.log('🗑️ Deleting holiday balance:', balanceId);

      const { error: deleteError } = await supabase
        .from('holiday_balances')
        .delete()
        .eq('id', balanceId);

      if (deleteError) {
        console.error('❌ Error deleting holiday balance:', deleteError);
        throw deleteError;
      }

      // Refresh data
      fetchHolidayBalances();

      toast({
        title: "Successo",
        description: "Bilancio ferie eliminato con successo",
      });

    } catch (error) {
      console.error('❌ Error deleting holiday balance:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il bilancio ferie",
        variant: "destructive"
      });
    }
  };

  // Get member by ID
  const getMemberById = (memberId: string) => {
    return members.find(m => m.id === memberId);
  };

  // Get usage percentage
  const getUsagePercentage = (used: number, total: number) => {
    return total > 0 ? Math.round((used / total) * 100) : 0;
  };

  // Get usage color
  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'default';
    return 'secondary';
  };

  // Sync used days from approved permissions
  const handleSyncUsedDays = async (balanceId: string) => {
    try {
      const balance = holidayBalances.find(b => b.id === balanceId);
      if (!balance) return;

      console.log('🔄 Syncing used days for balance:', balanceId);

      // Fetch approved permissions for this member and year
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('permessiferie')
        .select('start_date, end_date')
        .eq('member_id', balance.member_id)
        .eq('type', 'ferie')
        .eq('status', 'approved')
        .gte('start_date', `${selectedYear}-01-01`)
        .lte('start_date', `${selectedYear}-12-31`);

      if (permissionsError) {
        console.error('❌ Error fetching permissions for sync:', permissionsError);
        throw permissionsError;
      }

      // Calculate total used days
      const usedDays = permissionsData?.reduce((acc, p) => {
        const start = new Date(p.start_date);
        const end = new Date(p.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return acc + diffDays;
      }, 0) || 0;

      // Update balance with calculated used days
      const { error: updateError } = await supabase
        .from('holiday_balances')
        .update({ used_days: usedDays })
        .eq('id', balanceId);

      if (updateError) {
        console.error('❌ Error updating used days:', updateError);
        throw updateError;
      }

      // Refresh data
      fetchHolidayBalances();

      toast({
        title: "Sincronizzazione completata",
        description: `Giorni utilizzati aggiornati: ${usedDays} giorni`,
      });

    } catch (error) {
      console.error('❌ Error syncing used days:', error);
      toast({
        title: "Errore",
        description: "Impossibile sincronizzare i giorni utilizzati",
        variant: "destructive"
      });
    }
  };

  if (!isManager) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Solo i manager possono gestire i bilanci ferie.
        </AlertDescription>
      </Alert>
    );
  }

  if (!salonId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Caricamento ID del salone... Riprova tra qualche secondo.
        </AlertDescription>
      </Alert>
    );
  }

  if (!members || members.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nessun dipendente trovato. Aggiungi dei dipendenti prima di configurare i bilanci ferie.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestione Bilanci Ferie</h2>
          <p className="text-muted-foreground">
            Configura i giorni di ferie disponibili per ogni dipendente
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline"
            onClick={() => {
              holidayBalances.forEach(balance => handleSyncUsedDays(balance.id!));
            }}
            title="Sincronizza tutti i bilanci"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sincronizza Tutti
          </Button>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Bilancio
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Dipendenti</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{holidayBalances.length}</div>
            <p className="text-xs text-muted-foreground">
              Con bilancio configurato per {selectedYear}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giorni Totali</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {holidayBalances.reduce((acc, b) => acc + b.total_days, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Giorni di ferie assegnati
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilizzo Medio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {holidayBalances.length > 0 
                ? Math.round(holidayBalances.reduce((acc, b) => acc + getUsagePercentage(b.used_days, b.total_days), 0) / holidayBalances.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Percentuale media di utilizzo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giorni Rimanenti</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {holidayBalances.reduce((acc, b) => acc + b.remaining_days, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Totale giorni ancora disponibili
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Holiday Balances Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bilanci Ferie {selectedYear}</CardTitle>
          <CardDescription>
            Gestisci i giorni di ferie disponibili per ogni dipendente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : holidayBalances.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nessun bilancio ferie configurato per l'anno {selectedYear}. 
                Crea un nuovo bilancio per iniziare.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dipendente</TableHead>
                    <TableHead className="text-center">Giorni Totali</TableHead>
                    <TableHead className="text-center">Utilizzati</TableHead>
                    <TableHead className="text-center">Rimanenti</TableHead>
                    <TableHead className="text-center">In Attesa</TableHead>
                    <TableHead className="text-center">Utilizzo</TableHead>
                    <TableHead className="text-center">Stato</TableHead>
                    <TableHead className="text-center">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidayBalances.map((balance) => {
                    const member = getMemberById(balance.member_id);
                    const usagePercentage = getUsagePercentage(balance.used_days, balance.total_days);
                    
                    return (
                      <TableRow key={balance.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member?.avatar_url} />
                              <AvatarFallback>{member?.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{balance.member_name}</div>
                              <div className="text-xs text-muted-foreground">{member?.role || 'Dipendente'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{balance.total_days}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Badge variant="secondary">{balance.used_days}</Badge>
                            {balance.notes && balance.notes.includes('modificato manualmente') && (
                              <AlertCircle className="h-3 w-3 text-orange-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={balance.remaining_days <= 5 ? "destructive" : "default"}>
                            {balance.remaining_days}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {balance.pending_days > 0 ? (
                            <Badge variant="outline">{balance.pending_days}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2">
                            <Progress value={usagePercentage} className="w-16" />
                            <span className="text-sm font-medium">{usagePercentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={
                              balance.remaining_days <= 0 ? "destructive" :
                              balance.remaining_days <= 5 ? "default" :
                              "secondary"
                            }
                          >
                            {balance.remaining_days <= 0 ? "Esaurito" :
                             balance.remaining_days <= 5 ? "Scarso" : "Disponibile"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingBalance(balance);
                                setIsEditDialogOpen(true);
                              }}
                              title="Modifica bilancio"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSyncUsedDays(balance.id!)}
                              title="Sincronizza giorni utilizzati"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteBalance(balance.id!)}
                              title="Elimina bilancio"
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Bilancio Ferie</DialogTitle>
            <DialogDescription>
              Configura il bilancio ferie per un dipendente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="member">Dipendente</Label>
              <Select value={formData.member_id} onValueChange={(value) => setFormData(prev => ({ ...prev, member_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona dipendente" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="year">Anno</Label>
              <Select value={formData.year.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, year: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total_days">Giorni Totali</Label>
                <Input
                  id="total_days"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.total_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_days: parseInt(e.target.value) || 0 }))}
                  placeholder="30"
                />
              </div>
              
              <div>
                <Label htmlFor="used_days">Giorni Utilizzati</Label>
                <Input
                  id="used_days"
                  type="number"
                  min="0"
                  max={formData.total_days}
                  value={formData.used_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, used_days: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm font-medium mb-2">Riepilogo</div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Totali:</span>
                  <div className="font-medium">{formData.total_days}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Utilizzati:</span>
                  <div className="font-medium">{formData.used_days}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Rimanenti:</span>
                  <div className="font-medium text-primary">{formData.total_days - formData.used_days}</div>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Note (opzionale)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Note aggiuntive..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreateBalance}>
              <Save className="h-4 w-4 mr-2" />
              Crea Bilancio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Bilancio Ferie</DialogTitle>
            <DialogDescription>
              Modifica il bilancio ferie per {editingBalance?.member_name}
            </DialogDescription>
          </DialogHeader>
          
          {editingBalance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_total_days">Giorni Totali</Label>
                  <Input
                    id="edit_total_days"
                    type="number"
                    min="1"
                    max="365"
                    value={editingBalance.total_days}
                    onChange={(e) => setEditingBalance(prev => prev ? { ...prev, total_days: parseInt(e.target.value) || 0 } : null)}
                    placeholder="30"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit_used_days">Giorni Utilizzati</Label>
                  <Input
                    id="edit_used_days"
                    type="number"
                    min="0"
                    max={editingBalance.total_days}
                    value={editingBalance.used_days}
                                      onChange={(e) => {
                    const newUsedDays = parseInt(e.target.value) || 0;
                    const currentNotes = editingBalance?.notes || '';
                    const manualNote = ' [Modificato manualmente]';
                    
                    setEditingBalance(prev => prev ? { 
                      ...prev, 
                      used_days: newUsedDays,
                      notes: currentNotes.includes('Modificato manualmente') 
                        ? currentNotes 
                        : currentNotes + manualNote
                    } : null);
                  }}
                  placeholder="0"
                />
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm font-medium mb-2">Riepilogo</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Totali:</span>
                    <div className="font-medium">{editingBalance.total_days}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Utilizzati:</span>
                    <div className="font-medium">{editingBalance.used_days}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rimanenti:</span>
                    <div className="font-medium text-primary">{editingBalance.total_days - editingBalance.used_days}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit_notes">Note (opzionale)</Label>
                <Textarea
                  id="edit_notes"
                  value={editingBalance.notes || ''}
                  onChange={(e) => setEditingBalance(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="Note aggiuntive, motivazioni per modifiche, ecc..."
                  rows={3}
                />
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Attenzione:</strong> I giorni utilizzati possono essere modificati manualmente dal manager. 
                  Assicurati che il valore sia corretto e aggiornato.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleUpdateBalance}>
              <Save className="h-4 w-4 mr-2" />
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 