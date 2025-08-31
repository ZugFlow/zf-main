'use client';

import React from 'react';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Users,
  Calendar,
  AlertCircle,
  XCircle
} from "lucide-react";

// Shadcn Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Member } from './types';

interface Permission {
  id: string;
  type: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface StatsCardsPermessiProps {
  permissions: Permission[];
  members: Member[];
}

export default function StatsCardsPermessi({ permissions, members }: StatsCardsPermessiProps) {
  // Debug: log dei dati ricevuti
  console.log('🔍 StatsCardsPermessi - Dati ricevuti:', {
    permissionsCount: permissions.length,
    permissions: permissions.map(p => ({ id: p.id, type: p.type, status: p.status })),
    membersCount: members.length,
    members: members.map(m => ({ id: m.id, name: m.name, user_id: m.user_id }))
  });

  // Calcoli per i permessi
  const totalPermissions = permissions.length;
  const pendingPermissions = permissions.filter(p => p.status === 'pending').length;
  const approvedPermissions = permissions.filter(p => p.status === 'approved').length;
  const rejectedPermissions = permissions.filter(p => p.status === 'rejected').length;
  
  // Calcoli per le ferie
  const totalHolidays = permissions.filter(p => p.type === 'ferie').length;
  const approvedHolidays = permissions.filter(p => p.type === 'ferie' && p.status === 'approved').length;
  const pendingHolidays = permissions.filter(p => p.type === 'ferie' && p.status === 'pending').length;
  
  // Calcoli per i permessi (non ferie)
  const totalOtherPermissions = permissions.filter(p => p.type !== 'ferie').length;
  const approvedOtherPermissions = permissions.filter(p => p.type !== 'ferie' && p.status === 'approved').length;
  
  // Calcolo giorni totali di ferie approvate
  const totalHolidayDays = permissions
    .filter(p => p.type === 'ferie' && p.status === 'approved')
    .reduce((acc, p) => {
      try {
        const start = new Date(p.start_date);
        const end = new Date(p.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return acc + diffDays;
      } catch {
        return acc;
      }
    }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Totale Permessi */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Totale Permessi</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPermissions}</div>
          <p className="text-xs text-muted-foreground">
            {pendingPermissions} in attesa • {approvedPermissions} approvati
          </p>
        </CardContent>
      </Card>

      {/* Ferie Approvate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ferie Approvate</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{approvedHolidays}</div>
          <p className="text-xs text-muted-foreground">
            {totalHolidayDays} giorni totali • {pendingHolidays} in attesa
          </p>
        </CardContent>
      </Card>

      {/* Altri Permessi */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Altri Permessi</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{totalOtherPermissions}</div>
          <p className="text-xs text-muted-foreground">
            {approvedOtherPermissions} approvati • {rejectedPermissions} rifiutati
          </p>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {members.length === 1 ? 'Membro' : 'Team Members'}
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{members.filter(m => m.is_active).length}</div>
          <p className="text-xs text-muted-foreground">
            {members.length} {members.length === 1 ? 'membro' : 'membri'} • {members.filter(m => m.is_active).length} attivi
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 