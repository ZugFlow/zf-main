'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Play, Square, Clock, Calendar, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Shadcn Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface WorkHoursTrackerProps {
  memberId: string;
  memberName: string;
  salonId: string;
  avatarUrl?: string;
  onHoursRecorded: () => void;
}

const supabase = createClient();

export default function WorkHoursTracker({
  memberId,
  memberName,
  salonId,
  avatarUrl,
  onHoursRecorded
}: WorkHoursTrackerProps) {
  const { toast } = useToast();
  
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentHours, setCurrentHours] = useState(0);
  const [currentMinutes, setCurrentMinutes] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Timer per aggiornare il tempo corrente
  useEffect(() => {
    if (!isTracking || !startTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCurrentHours(hours);
      setCurrentMinutes(minutes);
      setCurrentSeconds(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const startTracking = () => {
    setIsTracking(true);
    setStartTime(new Date());
    setCurrentHours(0);
    setCurrentMinutes(0);
    setCurrentSeconds(0);
    
    toast({
      title: "Timbratura Inizio",
      description: `Inizio lavoro registrato per ${memberName}`,
    });
  };

  const stopTracking = async () => {
    if (!startTime) return;

    setIsLoading(true);
    const endTime = new Date();
    const totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    try {
      const { error } = await supabase
        .from('work_hours')
        .insert({
          member_id: memberId,
          salon_id: salonId,
          date: format(new Date(), 'yyyy-MM-dd'),
          start_time: format(startTime, 'HH:mm:ss'),
          end_time: format(endTime, 'HH:mm:ss'),
          total_hours: Math.round(totalHours * 100) / 100, // Arrotonda a 2 decimali
          status: 'completed',
          notes: `Timbratura automatica: ${format(startTime, 'HH:mm', { locale: it })} - ${format(endTime, 'HH:mm', { locale: it })}`
        });

      if (error) {
        console.error('Error recording work hours:', error);
        throw error;
      }

      setIsTracking(false);
      setStartTime(null);
      setCurrentHours(0);
      setCurrentMinutes(0);
      setCurrentSeconds(0);
      
      toast({
        title: "Timbratura Fine",
        description: `${totalHours.toFixed(2)} ore registrate per ${memberName}`,
      });

      // Notifica il componente padre
      onHoursRecorded();

    } catch (error) {
      console.error('Error recording work hours:', error);
      toast({
        title: "Errore",
        description: "Impossibile registrare le ore lavorate",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (hours: number, minutes: number, seconds: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          Timbratura Ore
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info membro */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{memberName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{memberName}</div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE dd MMMM yyyy', { locale: it })}
            </div>
          </div>
        </div>

        <Separator />

        {/* Timer corrente */}
        {isTracking && (
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-blue-600">
              {formatTime(currentHours, currentMinutes, currentSeconds)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Tempo di lavoro corrente
            </div>
          </div>
        )}

        {/* Pulsanti */}
        <div className="flex gap-2">
          {!isTracking ? (
            <Button 
              onClick={startTracking} 
              className="flex-1"
              disabled={isLoading}
            >
              <Play className="h-4 w-4 mr-2" />
              Inizia Lavoro
            </Button>
          ) : (
            <Button 
              onClick={stopTracking} 
              variant="destructive" 
              className="flex-1"
              disabled={isLoading}
            >
              <Square className="h-4 w-4 mr-2" />
              {isLoading ? 'Registrando...' : 'Termina Lavoro'}
            </Button>
          )}
        </div>

        {/* Stato */}
        <div className="text-center">
          <Badge variant={isTracking ? "default" : "secondary"}>
            <Clock className="h-3 w-3 mr-1" />
            {isTracking ? 'Lavoro in corso' : 'Non in servizio'}
          </Badge>
        </div>

        {/* Info aggiuntive */}
        {isTracking && startTime && (
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <div>Inizio: {format(startTime, 'HH:mm:ss', { locale: it })}</div>
            <div>Ore accumulate: {currentHours}h {currentMinutes}m</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 