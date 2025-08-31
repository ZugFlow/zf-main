'use client';

import React from 'react';
import { 
  FileText, 
  CheckCircle, 
  ClockIcon, 
  Users 
} from "lucide-react";

// Shadcn Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Member, WorkHours } from './types';

interface Permission {
  id: string;
  type: string;
  status: string;
}

interface StatsCardsProps {
  permissions: Permission[];
  members: Member[];
  workHours: WorkHours[];
}

export default function StatsCards({ permissions, members, workHours }: StatsCardsProps) {
  const totalPermissions = permissions.length;
  const pendingPermissions = permissions.filter(p => p.status === 'pending').length;
  const approvedHolidays = permissions.filter(p => p.type === 'ferie' && p.status === 'approved').length;
  const totalWorkHours = workHours.reduce((acc, wh) => acc + wh.total_hours, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Totale Permessi</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPermissions}</div>
          <p className="text-xs text-muted-foreground">
            +{pendingPermissions} in attesa
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ferie Approvate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{approvedHolidays}</div>
          <p className="text-xs text-muted-foreground">
            Questo mese
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ore Lavorate</CardTitle>
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalWorkHours.toFixed(0)}h
          </div>
          <p className="text-xs text-muted-foreground">
            Questo mese
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{members.length}</div>
          <p className="text-xs text-muted-foreground">
            Attivi
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 