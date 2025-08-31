import React from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { APPOINTMENT_STATUSES } from "@/components/status";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

interface StatoCardMonthlyProps {
  orderId: string;
  status: string;
  onStatusUpdate?: (newStatus: string) => void;
  compact?: boolean;
  task?: boolean; // Add task prop to filter statuses
}

export const StatoCardMonthly: React.FC<StatoCardMonthlyProps> = ({ orderId, status, onStatusUpdate, compact, task = false }) => {
  const [currentStatus, setCurrentStatus] = React.useState(status);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  const handleStateSelect = async (stateValue: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: stateValue })
        .eq("id", orderId);
      if (!error) {
        setCurrentStatus(stateValue);
        if (onStatusUpdate) onStatusUpdate(stateValue);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter statuses based on task prop
  const availableStatuses = task 
    ? APPOINTMENT_STATUSES.filter(status => 
        status.value === 'Completato' || status.value === 'Eliminato'
      )
    : APPOINTMENT_STATUSES;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span
          className="text-xs font-semibold cursor-pointer px-1 py-0.5 text-gray-900 focus:outline-none"
          style={{ background: 'none', border: 'none', borderRadius: 0, boxShadow: 'none', color: '#18181b', minWidth: 0, textDecoration: 'none' }}
          tabIndex={0}
          aria-label="Cambia stato"
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? "..." : (APPOINTMENT_STATUSES.find(s => s.value === currentStatus)?.label || currentStatus || "Stato")}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-60 overflow-y-auto w-48 p-2">
        <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b">Seleziona uno stato</div>
        {availableStatuses.map((state) => (
          <DropdownMenuItem 
            key={state.value} 
            onClick={(e) => {
              e.stopPropagation();
              handleStateSelect(state.value);
            }} 
            className="flex items-center gap-2"
          >
            <span
              className="inline-block w-3 h-3 rounded-full border border-gray-200 mr-2"
              style={{ backgroundColor: state.color || '#8b5cf6' }}
            />
            <span>{state.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
