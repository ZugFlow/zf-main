import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatisticaTeamProps {
  member: {
    id: string;
    name: string;
    ColorMember?: string;
    avatar_url?: string;
  };
  appointments: Array<{
    id: string;
    nome: string;
    orarioInizio: string;
    orarioFine: string;
    data: string;
    team_id: string;
    status?: string;
  }>;
  currentDate: Date;
}

const StatisticaTeam: React.FC<StatisticaTeamProps> = ({ member, appointments, currentDate }) => {
  // Filter appointments for this member on the current date
  const memberAppointments = appointments.filter(
    app => app.team_id === member.id && app.data === currentDate.toISOString().split('T')[0]
  );
  
  // Calculate total appointments
  const totalAppointments = memberAppointments.length;
  
  // Calculate completed appointments (status === 'pagato')
  const completedAppointments = memberAppointments.filter(app => app.status === 'pagato').length;
  
  // Calculate completion rate as a percentage
  const completionRate = totalAppointments > 0 
    ? Math.round((completedAppointments / totalAppointments) * 100) 
    : 0;
  
  // Calculate total working minutes
  let totalMinutes = 0;
  memberAppointments.forEach(app => {
    const startParts = app.orarioInizio.split(':').map(Number);
    const endParts = app.orarioFine.split(':').map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];
    totalMinutes += endMinutes - startMinutes;
  });
  
  // Format working hours
  const workingHours = Math.floor(totalMinutes / 60);
  const workingMinutes = totalMinutes % 60;
  const formattedWorkingHours = `${workingHours}h ${workingMinutes}m`;

  return (
    <div className="w-64">
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: member.ColorMember || '#e4b875' }}></div>
            {member.name}
          </CardTitle>
          <CardDescription>Statistiche giornaliere</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Appuntamenti</span>
              <span className="font-medium">{totalAppointments}</span>
            </div>
            <Progress value={completionRate} className="h-1.5" />
            <div className="text-xs text-muted-foreground text-right">
              {completedAppointments} completati ({completionRate}%)
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-slate-100 p-2 rounded-md">
              <div className="text-xs text-muted-foreground">Ore di lavoro</div>
              <div className="text-sm font-medium">{formattedWorkingHours}</div>
            </div>
            <div className="bg-slate-100 p-2 rounded-md">
              <div className="text-xs text-muted-foreground">Da completare</div>
              <div className="text-sm font-medium">{totalAppointments - completedAppointments}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticaTeam;
