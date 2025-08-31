import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { APPOINTMENT_STATUSES } from "@/components/status";

// Definizione dei tipi
interface State {
  id: number;
  key: string;
  value: string;
  created_at: string;
}

const supabase = createClient();

const GestioneStati = () => {
  const [states, setStates] = useState<State[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editState, setEditState] = useState<State | null>(null);
  const [stateName, setStateName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStates();
  }, []);

  // Caricamento degli stati
  const fetchStates = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;

      const { data, error } = await supabase
        .from("settings")
        .select("id, key, value, created_at")
        .eq("user_id", userData.user.id)
        .eq("type", "appointment_status")
        .eq("enabled", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Errore nel recupero degli stati:", error.message);
      } else {
        setStates(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (state?: State) => {
    setEditState(state || null);
    setStateName(state?.key || "");
    setIsModalOpen(true);
  };

  // Gestione del submit del form
  const handleSaveState = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !stateName.trim()) return;
    
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;

      if (editState) {
        // Aggiornamento stato esistente
        const updateData = {
          key: stateName.trim(),
          value: stateName.trim(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from("settings")
          .update(updateData)
          .eq("id", editState.id)
          .eq("user_id", userData.user.id);

        if (error) throw error;

        setStates(prev =>
          prev.map(s => s.id === editState.id ? { ...s, key: stateName, value: stateName } : s)
        );
      } else {
        // Creazione nuovo stato
        const stateData = {
          user_id: userData.user.id,
          key: stateName.trim(),
          value: stateName.trim(),
          type: 'appointment_status',
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from("settings")
          .insert([stateData])
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            alert("Questo stato esiste già");
            return;
          }
          throw error;
        }

        if (data) {
          setStates(prev => [...prev, data]);
        }
      }
      
      setIsModalOpen(false);
      setEditState(null);
      setStateName("");
    } catch (error) {
      console.error("Errore nella gestione dello stato:", error);
    } finally {
      setLoading(false);
    }
  };

  // Gestione della cancellazione
  const handleDeleteState = async (id: number) => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;
      // Trova lo stato da eliminare
      const stateToDelete = states.find(s => s.id === id);
      // Se lo stato è uno di default, blocca l'eliminazione
      if (stateToDelete && APPOINTMENT_STATUSES.some(def => def.value === stateToDelete.key)) {
        alert("Non puoi eliminare uno stato di sistema predefinito.");
        setLoading(false);
        return;
      }
      // Elimina realmente lo stato da Supabase
      const { error } = await supabase
        .from("settings")
        .delete()
        .eq("id", id)
        .eq("user_id", userData.user.id);
      if (error) {
        throw error;
      } else {
        setStates(prev => prev.filter(state => state.id !== id));
      }
    } catch (error) {
      console.error("Errore nella cancellazione dello stato:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mt-6 flex flex-col md:flex-row gap-6 md:items-center md:justify-center">
      {/* Description Section */}
      <div className="hidden md:flex flex-col justify-center w-[300px] flex-shrink-0">
        {/* ...descrizione... */}
      </div>
      {/* Main Content Section */}
      <div className="w-full max-w-[600px] mx-auto">
        <Card className="border-0 shadow-sm w-full">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[16px] font-medium text-[#292d34] flex items-center gap-2">
                <Tag className="h-5 w-5 text-blue-600" />
                Stati del Sistema
              </CardTitle>
            </div>
            <Button onClick={() => handleOpenModal()} className="bg-blue-600 text-white text-sm px-3 py-2">
              Nuovo Stato
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-gray-400 text-sm">Caricamento stati...</div>
            ) : (
              <>
                {/* Stati custom utente */}
                <div className="text-xs text-gray-500 mb-2">Stati personalizzati</div>
                <div className="space-y-2 mb-6">
                  {states.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm py-8">
                      Nessuno stato personalizzato trovato.<br />
                      <span className="text-xs text-gray-500">Crea il tuo primo stato per gli appuntamenti.</span>
                    </div>
                  ) : (
                    states.map(state => (
                      <div key={state.id} className="flex flex-col gap-2 p-4 rounded-md border border-[#e6e8ef] bg-blue-50">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <Badge variant="secondary" className="text-blue-900 bg-blue-100 border-blue-300 px-3 py-1 text-sm font-medium">
                            {state.key}
                          </Badge>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-blue-600 text-white text-xs px-2 py-1"
                              onClick={() => handleOpenModal(state)}>
                              Modifica
                            </Button>
                            <Button size="sm" className="bg-gray-200 text-gray-700 text-xs px-2 py-1"
                              onClick={() => handleDeleteState(state.id)}>
                              Elimina
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Stati di default (non eliminabili) */}
                <div className="text-xs text-gray-500 mb-2">Stati di default</div>
                <div className="space-y-2">
                  {APPOINTMENT_STATUSES.map((state) => (
                    <div key={state.value} className="flex flex-col gap-2 p-4 rounded-md border border-[#e6e8ef] bg-blue-50">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <Badge variant="secondary" className={`text-blue-900 bg-blue-100 border-blue-300 px-3 py-1 text-sm font-medium`}>{state.label}</Badge>
                        <div className="flex gap-2">
                          <span className="text-xs text-gray-400">(Predefinito)</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      {/* MODALE STATO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="p-6 rounded-lg w-full max-w-md">
          <DialogHeader>
            <DialogTitle>{editState ? "Modifica Stato" : "Nuovo Stato"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSaveState}
            className="space-y-4"
          >
            <div>
              <Label>Nome Stato</Label>
              <Input
                value={stateName}
                onChange={e => setStateName(e.target.value)}
                placeholder="Inserisci lo stato"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setIsModalOpen(false)} className="bg-black text-white">
                Annulla
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 text-white"
                disabled={loading}
              >
                {loading ? "Salvataggio..." : "Salva"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestioneStati;
