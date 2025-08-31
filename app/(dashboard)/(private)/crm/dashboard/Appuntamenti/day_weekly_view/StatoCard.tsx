import React, { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { APPOINTMENT_STATUSES } from "@/components/status";

const supabase = createClient();

interface StatoCardProps {
  salonId: string;
  orderId: string;
  compact?: boolean; // Add compact mode prop
  onStatusUpdate?: () => void; // Add callback for status updates
  buttonColor?: string; // Forza il colore del tasto principale
  textOnly?: boolean; // Se true, mostra solo testo cliccabile
  size?: 'xs' | 'sm' | 'normal'; // Add size prop for responsive sizing
  task?: boolean; // Add task prop to filter statuses
  sevenDaysMode?: boolean; // Se true, mostra solo testo senza box grigio
}

const StatoCard: React.FC<StatoCardProps> = ({ salonId, orderId, compact = false, onStatusUpdate, buttonColor, textOnly = false, size = 'normal', task = false, sevenDaysMode = false }) => {
  const [states, setStates] = useState<{ id: string; key: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(''); // Add current status state
  const [colorCard, setColorCard] = useState<string>(''); // Add color_card state

  useEffect(() => {
    fetchStatuses();
    fetchCurrentStatus();
  }, [salonId, orderId, task]);

  const fetchCurrentStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("status, color_card")
        .eq("id", orderId)
        .single();

      if (error) {
        console.error("Error fetching current status:", error);
      } else {
        setCurrentStatus(data?.status || '');
        setColorCard(data?.color_card || '#4361ee'); // Default color if no color_card
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("status")
        .eq("salon_id", salonId)
        .neq("status", null);

      const { data: customStates, error: customError } = await supabase
        .from("settings")
        .select("key, value")
        .eq("type", "appointment_status")
        .eq("enabled", true);

      if (orderError) {
        console.error("Error fetching order statuses:", orderError);
      }

      if (customError) {
        console.error("Error fetching custom statuses:", customError);
      }

      // Filter statuses based on task prop
      let availableStatuses = APPOINTMENT_STATUSES;
      if (task) {
        // For tasks, only show "Completato" and "Eliminato"
        availableStatuses = APPOINTMENT_STATUSES.filter(status => 
          status.value === 'Completato' || status.value === 'Eliminato'
        );
      }

      setStates(availableStatuses.map((status) => ({ id: status.value, key: status.label })));
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStateSelect = async (state: { id: string; key: string }) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: state.key })
        .eq("id", orderId);

      if (error) {
        console.error("Error updating status:", error);
      } else {
        setCurrentStatus(state.key); // Update local state
        // Don't show alert in compact mode
        if (!compact) {
          alert(`Status updated to: ${state.key}`);
        }
        // Call the callback to trigger a refresh in the parent component
        if (onStatusUpdate) {
          onStatusUpdate();
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  // Get size-specific styles with modern design
  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return {
          button: "h-5 px-2 text-[10px] font-medium rounded-full min-w-[20px] flex items-center justify-center",
          text: "text-[9px] font-medium px-1 py-0 rounded-sm hover:bg-gray-100 transition-colors"
        };
      case 'sm':
        return {
          button: "h-6 px-2.5 text-[11px] font-medium rounded-full min-w-[24px] flex items-center justify-center",
          text: "text-[10px] font-medium px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors"
        };
      case 'normal':
      default:
        return {
          button: compact ? "h-7 px-3 text-xs font-medium rounded-md" : "text-sm font-medium px-3 py-1.5 rounded-md",
          text: "text-xs font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <div className={compact ? "flex items-center" : "flex items-center gap-4"}>
      {!compact && !sevenDaysMode && (
        <Badge variant="secondary" className="text-blue-900 bg-blue-100 border-blue-300 px-3 py-1 text-sm font-medium">
          Stato
        </Badge>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {textOnly || sevenDaysMode ? (
            <span
              className={`cursor-pointer text-gray-700 hover:text-gray-900 focus:outline-none transition-all duration-200 ${sizeStyles.text}`}
              style={{ 
                background: 'none', 
                border: 'none', 
                borderRadius: '4px', 
                boxShadow: 'none', 
                color: '#374151', 
                minWidth: 0, 
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                overflow: 'visible',
                textOverflow: 'clip'
              }}
              tabIndex={0}
              aria-label="Cambia stato"
              onClick={e => e.stopPropagation()}
              onTouchEnd={e => e.stopPropagation()}
            >
              {loading ? (
                <div className="flex items-center justify-center w-4">
                  <div className="w-2 h-2 border border-gray-400 border-t-gray-700 rounded-full animate-spin"></div>
                </div>
              ) : (currentStatus || (size === 'xs' ? "S" : "Stato"))}
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className={`border-0 bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-primary/30 hover:bg-white hover:text-gray-900 hover:scale-105 ${sizeStyles.button}`}
              style={{
                backgroundColor: buttonColor ? `${buttonColor}90` : 'rgba(255, 255, 255, 0.9)',
                color: '#374151',
                border: 'none',
                boxShadow: size === 'xs' ? '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)' : '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)',
              }}
              disabled={loading}
              onClick={e => e.stopPropagation()}
              onTouchEnd={e => e.stopPropagation()}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                size === 'xs' 
                  ? (currentStatus || "S").charAt(0).toUpperCase()
                  : size === 'sm'
                    ? (currentStatus || "Stato")
                    : compact 
                      ? (currentStatus || "Stato")
                      : "Seleziona Stato"
              )}
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-60 overflow-y-auto w-48 p-1 shadow-lg border-0 bg-white/95 backdrop-blur-sm" align="end">
          <div className="px-3 py-2 text-xs font-medium text-gray-600 border-b border-gray-100">Seleziona uno stato</div>
          {states.map((state, idx) => (
            <DropdownMenuItem
              key={state.id}
              onClick={e => {
                e.stopPropagation();
                handleStateSelect(state);
              }}
              onTouchEnd={e => e.stopPropagation()}
              className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {/* Colored dot like in NavbarSecondaria */}
              <span
                className="inline-block w-2.5 h-2.5 rounded-full border-0 shadow-sm"
                style={{
                  backgroundColor: APPOINTMENT_STATUSES.find(s => s.label === state.key)?.color || '#8b5cf6',
                }}
              />
              <span className="text-sm text-gray-700">{state.key}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default StatoCard;