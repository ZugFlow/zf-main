import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export function ExistingCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("Utente non autenticato.");
        return;
      }

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Errore nel recupero dei clienti esistenti:", error.message);
      } else {
        setCustomers(data || []);
      }
    };

    fetchCustomers();
  }, []);

  return (
    <>
      <h2 className="text-xs font-semibold mt-4">Clienti Esistenti</h2>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        {customers.map((customer) => (
          <li key={customer.id} className="text-xs">
            <span className="font-medium">{customer.nome}</span> - 
            <span className="text-gray-500">{customer.telefono}</span> - 
            <span className="text-gray-500">{customer.email}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
