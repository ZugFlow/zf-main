"use client";
import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";

import { BellIcon, PanelLeft } from "lucide-react";
import { fetchAppointmentsWithServices } from "../query/query";
import { useAuthContext } from "../query/AuthContext";
import { format, isToday, isAfter, parseISO } from "date-fns";

// Mostra solo appuntamenti futuri/imminenti (oggi e orario >= adesso)

export default function CenterNotification({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  const { userId } = useAuthContext();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !open) return;
    setLoading(true);
    fetchAppointmentsWithServices(userId)
      .then((data) => {
        // Filtra solo appuntamenti futuri/imminenti (oggi o dopo, orario >= adesso)
        const now = new Date();
        const filtered = (data || []).filter((a: any) => {
          if (!a.data || !a.orarioInizio) return false;
          const dateStr = typeof a.data === 'string' ? a.data : a.data?.toISOString?.() || '';
          const date = parseISO(dateStr);
          // Se oggi, mostra solo se orarioInizio >= adesso, se futuro mostra
          if (isToday(date)) {
            // orarioInizio formato "HH:mm"
            const [h, m] = (a.orarioInizio || '').split(":");
            if (h && m) {
              const appDate = new Date(date);
              appDate.setHours(Number(h), Number(m), 0, 0);
              return isAfter(appDate, now);
            }
            return false;
          }
          return isAfter(date, now);
        });
        setAppointments(filtered);
      })
      .finally(() => setLoading(false));
  }, [userId, open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="max-w-md w-full rounded-l-2xl shadow-2xl border border-gray-100 p-0 flex flex-col h-full">
        <SheetHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between w-full">
            <SheetTitle className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-violet-100 p-2">
                <BellIcon className="w-5 h-5 text-violet-500" />
              </span>
              Centro Notifiche
            </SheetTitle>
   
          </div>
          <SheetDescription className="text-xs text-gray-500">
            Prossimi appuntamenti imminenti
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-6 space-y-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center text-gray-400 py-10">Caricamento...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center text-gray-400 py-10">Nessun appuntamento imminente</div>
          ) : (
            appointments.map((a) => (
              <div
                key={a.id}
                className="bg-gray-50 rounded-xl p-4 shadow flex flex-col gap-1 border border-gray-100"
              >
                <div className="font-medium text-gray-900">{a.nome || a.title || "Appuntamento"}</div>
                <div className="text-sm text-gray-600">
                  {a.descrizione || a.description || a.note || ""}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {a.data && a.orarioInizio ? (
                    <>
                      {format(parseISO(typeof a.data === 'string' ? a.data : a.data?.toISOString?.() || ''), "dd/MM/yyyy")}<span className="mx-1">•</span>{a.orarioInizio}
                    </>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
        {/* Rimosso il tasto Chiudi dal fondo */}
        <div className="flex justify-start w-full pb-6 pt-2 mt-auto">
          <button
            className="focus:outline-none ml-2"
            onClick={() => setOpen(false)}
            aria-label="Chiudi notifiche"
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            <PanelLeft className="w-5 h-5 text-gray-500 hover:text-gray-700 transition" />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
