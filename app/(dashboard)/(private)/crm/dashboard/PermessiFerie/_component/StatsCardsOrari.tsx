'use client';

import React from 'react';
import { 
  ClockIcon,
  BarChart3,
  CalendarDays,
  Users,
  Clock,
  Zap,
  Calendar,
  AlertCircle
} from "lucide-react";

// Shadcn Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Member, WorkHours } from './types';

interface StatsCardsOrariProps {
  workHours: WorkHours[];
  members: Member[];
  weeklySchedules?: any[];
  extraSchedules?: any[];
  shiftRequests?: any[];
  availabilityRequests?: any[];
}

export default function StatsCardsOrari({ 
  workHours, 
  members, 
  weeklySchedules = [], 
  extraSchedules = [], 
  shiftRequests = [], 
  availabilityRequests = [] 
}: StatsCardsOrariProps) {
  // Debug: log dei dati ricevuti
  console.log('🔍 StatsCardsOrari - Dati ricevuti:', {
    workHoursCount: workHours.length,
    workHours: workHours.map(wh => ({ id: wh.id, member_name: wh.member_name, total_hours: wh.total_hours, status: wh.status })),
    membersCount: members.length,
    members: members.map(m => ({ id: m.id, name: m.name, user_id: m.user_id })),
    weeklySchedulesCount: weeklySchedules.length,
    extraSchedulesCount: extraSchedules.length,
    shiftRequestsCount: shiftRequests.length,
    availabilityRequestsCount: availabilityRequests.length
  });

  // Calcoli per le ore lavorate (dati reali dal database)
  const totalHours = workHours
    .filter(wh => wh.status === 'completed')
    .reduce((acc, wh) => acc + wh.total_hours, 0);
  
  const completedWorkHours = workHours.filter(wh => wh.status === 'completed');
  const averageHours = completedWorkHours.length > 0 
    ? totalHours / completedWorkHours.length 
    : 0;
  
  const totalDays = completedWorkHours.length;
  
  // Calcoli per gli orari settimanali
  const activeWeeklySchedules = weeklySchedules.filter(ws => ws.is_active).length;
  const totalExtraSchedules = extraSchedules.length;
  const approvedExtraSchedules = extraSchedules.filter(es => es.is_approved).length;
  
  // Debug: log dei calcoli
  console.log('🔍 StatsCardsOrari - Calcoli:', {
    totalHours,
    averageHours,
    totalDays,
    activeWeeklySchedules,
    totalExtraSchedules,
    approvedExtraSchedules
  });
  
  // Calcoli per le richieste
  const pendingShiftRequests = shiftRequests.filter(sr => sr.status === 'pending').length;
  const pendingAvailabilityRequests = availabilityRequests.filter(ar => ar.status === 'pending').length;
  const totalPendingRequests = pendingShiftRequests + pendingAvailabilityRequests;
  
  // Calcoli per i membri
  const activeMembers = members.filter(m => m.is_active).length;
  const totalMembers = members.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Ore Totali */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ore Totali</CardTitle>
          <ClockIcon className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{totalHours.toFixed(1)}h</div>
          <p className="text-xs text-muted-foreground">
            {totalDays} giorni lavorati • {averageHours.toFixed(1)}h media
          </p>
        </CardContent>
      </Card>

      {/* Orari Settimanali */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Orari Settimanali</CardTitle>
          <Calendar className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{activeWeeklySchedules}</div>
          <p className="text-xs text-muted-foreground">
            Schedulati attivi • {totalExtraSchedules} extra
          </p>
        </CardContent>
      </Card>

      {/* Orari Straordinari */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Orari Straordinari</CardTitle>
          <Zap className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{approvedExtraSchedules}</div>
          <p className="text-xs text-muted-foreground">
            {totalExtraSchedules} richiesti • {totalExtraSchedules - approvedExtraSchedules} in attesa
          </p>
        </CardContent>
      </Card>

      {/* Richieste in Sospeso */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Richieste</CardTitle>
          <AlertCircle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{totalPendingRequests}</div>
          <p className="text-xs text-muted-foreground">
            {pendingShiftRequests} turni • {pendingAvailabilityRequests} disponibilità
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 