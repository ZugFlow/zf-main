'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface OnlineBookingToggleProps {
  serviceId: number;
  initialValue: boolean;
  onToggle?: (enabled: boolean) => void;
}

export default function OnlineBookingToggle({ 
  serviceId, 
  initialValue, 
  onToggle 
}: OnlineBookingToggleProps) {
  const [enabled, setEnabled] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('services')
        .update({ online_booking_enabled: checked })
        .eq('id', serviceId);

      if (error) {
        throw error;
      }

      setEnabled(checked);
      onToggle?.(checked);
      
      toast({
        title: checked ? 'Prenotazione online abilitata' : 'Prenotazione online disabilitata',
        description: `Il servizio è ora ${checked ? 'disponibile' : 'non disponibile'} per le prenotazioni online.`,
      });
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile aggiornare le impostazioni di prenotazione online.',
        variant: 'destructive',
      });
      // Ripristina il valore precedente
      setEnabled(!checked);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id={`online-booking-${serviceId}`}
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={loading}
      />
      <Label 
        htmlFor={`online-booking-${serviceId}`}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Prenotazione Online
      </Label>
      {loading && (
        <div className="ml-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
} 