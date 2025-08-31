'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Users, 
  Settings, 
  FileText, 
  Lock, 
  Building, 
  Globe, 
  CalendarCheck, 
  Mail, 
  Type, 
  CalendarPlus,
  ChevronLeft,
  X,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '../Impostazioni/usePermission';
import { createClient } from '@/utils/supabase/client';
import { useLocalization } from '@/hooks/useLocalization';

interface TeamMember {
  id: string;
  name: string;
  avatar_url?: string;
}

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onTabChange: (tab: string) => void;
  activeTab: string;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  isOpen,
  onClose,
  onTabChange,
  activeTab
}) => {
  const { t } = useLocalization();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [session, setSession] = useState<any>(null);
  const { hasPermission, loading: permissionsLoading, userRole } = usePermissions(session);

  useEffect(() => {
    const fetchSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    fetchSession();
  }, []);

  useEffect(() => {
    if (session) {
      fetchTeamMembers();
    }
  }, [session]);

  const fetchTeamMembers = async () => {
    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;

      if (userError || !user) {
        console.error("User error:", userError?.message || "User not authenticated");
        return;
      }

      // Get salon ID associated with the user
      const { data: salonData, error: salonError } = await supabase
        .from("salon")
        .select("id")
        .eq("user_id", user.id)
        .single();

      let currentSalonId = null;

      if (salonData) {
        currentSalonId = salonData.id;
      } else {
        // Check if user is a collaborator and has a salon_id in profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('salon_id')
          .eq('id', user.id)
          .single();
          
        if (!profileError && profileData?.salon_id) {
          currentSalonId = profileData.salon_id;
        }
      }

      if (!currentSalonId) {
        return;
      }

      // Fetch team members associated with this salon_id
      const { data, error } = await supabase
        .from("team")
        .select("id, name, avatar_url")
        .eq("salon_id", currentSalonId)
        .order("order_column", { ascending: true });

      if (error) {
        console.error("Team fetch error:", error);
        return;
      }

      if (data && Array.isArray(data)) {
        setTeamMembers(data);
      }
    } catch (err) {
      console.error("Unexpected error in fetchTeamMembers:", err);
    }
  };

  const settingsMenuItems = [
    {
      id: 'appuntamenti',
      label: 'Appuntamenti',
      icon: CalendarDays,
      color: 'violet',
      description: 'Gestione Appuntamenti e Calendario',
      permissions: ['canViewSystemSettings', 'isAdmin']
    },
    {
      id: 'membri',
      label: 'Team',
      icon: Users,
      color: 'blue',
      description: 'Gestione Team e Collaboratori',
      permissions: ['canViewSystemSettings', 'isAdmin']
    },
    {
      id: 'permessi',
      label: 'Permessi',
      icon: Lock,
      color: 'indigo',
      description: 'Gestione Permessi e Autorizzazioni',
      permissions: ['canViewSystemSettings', 'isAdmin']
    },
    {
      id: 'stati',
      label: 'Stati',
      icon: Settings,
      color: 'green',
      description: 'Gestione Stati e Configurazioni',
      permissions: ['canViewSystemSettings', 'isAdmin']
    },
    {
      id: 'tasse',
      label: 'Fiscale',
      icon: Building,
      color: 'amber',
      description: 'Gestione Fiscale e Tasse',
      permissions: ['canViewSystemSettings', 'isAdmin']
    },
    {
      id: 'sicurezza',
      label: 'Sicurezza',
      icon: FileText,
      color: 'red',
      description: 'Sicurezza e Profilo',
      permissions: ['canViewSystemSettings', 'isAdmin']
    },
    {
      id: 'gruppi',
      label: 'Gruppi',
      icon: Users,
      color: 'purple',
      description: 'Gestione Gruppi di Lavoro',
      permissions: ['canViewSystemSettings', 'isAdmin']
    },
    {
      id: 'paginaweb',
      label: 'Pagina Web',
      icon: Globe,
      color: 'emerald',
      description: 'Configurazione Pagina Web',
      permissions: ['canViewSystemSettings', 'isAdmin']
    },
    {
      id: 'prenotazioni-online',
      label: 'Prenotazioni',
      icon: CalendarCheck,
      color: 'teal',
      description: 'Gestione Prenotazioni Online',
      permissions: ['canViewSystemSettings', 'isAdmin']
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      color: 'blue',
      description: 'Configurazione Email',
      permissions: ['canViewSystemSettings', 'isAdmin']
    },
    {
      id: 'testi-unificati',
      label: 'Testi & Template',
      icon: Type,
      color: 'blue',
      description: 'Gestione Testi e Template',
      permissions: ['canViewSystemSettings', 'isAdmin']
    },
    {
      id: 'modal-appuntamento',
      label: 'Modal Appuntamento',
      icon: CalendarPlus,
      color: 'green',
      description: 'Personalizzazione Modal Appuntamento',
      permissions: ['canViewSystemSettings', 'isAdmin']
    },
    {
      id: 'supporto',
      label: 'Supporto',
      icon: HelpCircle,
      color: 'indigo',
      description: 'Ticket di Supporto Tecnico',
      permissions: ['canViewSystemSettings', 'isAdmin']
    }
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const baseClasses = 'flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-all duration-200 rounded-lg font-medium';
    
    if (isActive) {
      switch (color) {
        case 'violet': return `${baseClasses} bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50`;
        case 'blue': return `${baseClasses} bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50`;
        case 'indigo': return `${baseClasses} bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50`;
        case 'green': return `${baseClasses} bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700/50`;
        case 'amber': return `${baseClasses} bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50`;
        case 'red': return `${baseClasses} bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50`;
        case 'purple': return `${baseClasses} bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50`;
        case 'emerald': return `${baseClasses} bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50`;
        case 'teal': return `${baseClasses} bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700/50`;
        case 'indigo': return `${baseClasses} bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50`;
        default: return `${baseClasses} bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700/50`;
      }
    } else {
      return `${baseClasses} hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-700 dark:text-slate-300`;
    }
  };

  const getIconColor = (color: string, isActive: boolean) => {
    if (isActive) {
      switch (color) {
        case 'violet': return 'text-violet-600 dark:text-violet-400';
        case 'blue': return 'text-blue-600 dark:text-blue-400';
        case 'indigo': return 'text-indigo-600 dark:text-indigo-400';
        case 'green': return 'text-green-600 dark:text-green-400';
        case 'amber': return 'text-amber-600 dark:text-amber-400';
        case 'red': return 'text-red-600 dark:text-red-400';
        case 'purple': return 'text-purple-600 dark:text-purple-400';
        case 'emerald': return 'text-emerald-600 dark:text-emerald-400';
        case 'teal': return 'text-teal-600 dark:text-teal-400';
        case 'indigo': return 'text-indigo-600 dark:text-indigo-400';
        default: return 'text-gray-600 dark:text-gray-400';
      }
    } else {
      return 'text-gray-500 dark:text-slate-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="hidden md:flex w-80 min-w-80 max-w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex-col h-full shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-gray-50/50 dark:from-slate-800/30 to-gray-50/30 dark:to-slate-800/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-100 to-violet-200 dark:from-slate-700/60 dark:to-slate-600/60 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ring-1 ring-violet-100 dark:ring-slate-600/50">
              <Settings className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Impostazioni
            </h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground hover:text-primary hover:bg-accent p-2 rounded-md transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Configura il tuo sistema e gestisci le impostazioni
        </p>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {settingsMenuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          const hasAccess = item.permissions.some(permission => 
            hasPermission(permission) || (permission === 'isAdmin' && userRole === 'admin')
          );

          if (!hasAccess) return null;

          return (
            <div
              key={item.id}
              className={getColorClasses(item.color, isActive)}
              onClick={() => onTabChange(item.id)}
            >
              <IconComponent className={`h-4 w-4 ${getIconColor(item.color, isActive)}`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 truncate">
                  {item.description}
                </div>
              </div>
              {isActive && (
                <Badge variant="secondary" className="text-xs bg-current/10 text-current border-current/20">
                  Attivo
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/20 flex-shrink-0">
        <div className="text-xs text-gray-500 dark:text-slate-400 text-center">
          <p>Team Members: {teamMembers.length}</p>
          <p className="mt-1">Ruolo: {userRole || 'Utente'}</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsSidebar;
