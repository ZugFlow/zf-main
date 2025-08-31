"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { ExistingCustomers } from "./ExistingAppointments";
import { CreateClientModal } from "./CreateClientModal";

const supabase = createClient();

export function CreateOrder({
  isDialogOpen,
  setIsDialogOpen,
}: {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}) {
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      const { data, error } = await supabase.from("team").select("id, name").eq("is_active", true);
      if (error) {
        console.error("Errore nel caricamento dei membri del team:", error.message);
      } else {
        setTeamMembers(data || []);
      }
    };

    fetchTeamMembers();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data, error } = await supabase.from("orders").select("*");
      if (error) {
        console.error("Errore nel caricamento degli appuntamenti:", error.message);
      } else {
        setAppointments(data || []);
      }
    };

    fetchAppointments();
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase.from("customers").select("*");
      if (error) {
        console.error("Errore nel recupero dei clienti esistenti:", error.message);
      } else {
        setCustomers(data || []);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="p-6 rounded-lg w-full max-w-5xl flex flex-col md:flex-row overflow-auto" style={{ overflowY: "auto", maxHeight: "90vh" }}>
        <div className="w-full md:w-1/2 p-4 rounded-lg hidden md:flex flex-col" style={{ backgroundColor: "#BBB2CC", borderRadius: "16px" }}>
          <img src="/appointment.png" alt="cliente" className="w-full h-auto mb-4 rounded-lg" />
          <ExistingCustomers />
        </div>

        <div className="w-full md:w-1/2 p-4 rounded-lg bg-gray-50" style={{ borderRadius: "16px" }}>
          <button
            className="text-sm text-indigo-600 hover:underline"
            onClick={() => setIsCreateClientModalOpen(true)}
          >
            Crea un nuovo cliente
          </button>
        </div>
      </DialogContent>
      <CreateClientModal
        isOpen={isCreateClientModalOpen}
        onClose={() => setIsCreateClientModalOpen(false)}
      />
    </Dialog>
  );
}
