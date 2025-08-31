import { format, addMinutes, parse } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { Appointment, Member } from '../types';

const supabase = createClient();

// UTILITY FUNCTIONS

// Save user selections to localStorage
export function saveUserSelections(userId: string, selections: {
  teamMemberIds?: string[];
  selectedGroupId?: string | null;
}) {
  try {
    const key = `user_${userId}_calendar_selections`;
    const current = localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)!) : {};
    
    const updated = {
      ...current,
      ...(selections.teamMemberIds !== undefined ? { teamMemberIds: selections.teamMemberIds } : {}),
      ...(selections.selectedGroupId !== undefined ? { selectedGroupId: selections.selectedGroupId } : {})
    };
    
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.error("Error saving user selections:", e);
  }
}

// Get user selections from localStorage
export function getUserSelections(userId: string): {
  teamMemberIds: string[];
  selectedGroupId: string | null;
} {
  try {
    const key = `user_${userId}_calendar_selections`;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error loading user selections:", e);
  }
  
  return { teamMemberIds: [], selectedGroupId: null };
}

// Process team members data with visibility
// Aggiunge cache per le queries supabase
export const queryWithCache = async <T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000 // default 5 minuti
): Promise<T> => {
  try {
    const cachedItem = localStorage.getItem(key);
    
    if (cachedItem) {
      const { data, timestamp } = JSON.parse(cachedItem);
      // Se la cache è ancora valida (non è scaduta)
      if (Date.now() - timestamp < ttlMs) {
        console.log(`Using cached data for ${key}`);
        return data as T;
      }
    }
    
    // Se non c'è cache o è scaduta, esegui la query
    console.log(`Fetching fresh data for ${key}`);
    const result = await queryFn();
    
    // Salva il risultato in cache con timestamp
    localStorage.setItem(key, JSON.stringify({
      data: result,
      timestamp: Date.now()
    }));
    
    return result;
  } catch (error) {
    console.error(`Error in queryWithCache for ${key}:`, error);
    throw error;
  }
};

export function processTeamMembers(data: any[], cachedVisibility: Record<string, boolean> | null) {
  return data.map(member => {
    const visibilityFromCache = cachedVisibility?.[member.id];
    const isVisible = visibilityFromCache !== undefined ? visibilityFromCache : member.visible_users;

    return {
      ...member,
      visible_users: isVisible,
      avatar_url: member.avatar_url 
        ? member.avatar_url.startsWith('http') 
          ? member.avatar_url 
          : supabase.storage.from('zugflowhub').getPublicUrl(member.avatar_url).data.publicUrl
        : null
    };
  });
}

// Snap time to 5 minute intervals
export function snapTo5Minutes(time: Date) {
  const minutes = time.getMinutes();
  const roundedMinutes = Math.round(minutes / 5) * 5;
  
  return new Date(
    time.getFullYear(),
    time.getMonth(),
    time.getDate(),
    time.getHours(),
    roundedMinutes,
    0,
    0
  );
}

// API Functions

// Update appointment time and team
export async function updateAppointmentTimeAndTeam(
  appointmentId: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string,
  teamMemberId: string
) {
  const { data, error } = await supabase
    .from('order_details')
    .update({
      data: newDate,
      orarioInizio: newStartTime, 
      orarioFine: newEndTime,
      team_id: teamMemberId
    })
    .eq('id', appointmentId);
  
  if (error) throw error;
  return data;
}

// Update end time for an appointment during resize
export async function updateAppointmentEndTime(
  appointmentId: string, 
  newEndTime: string
) {
  const { data, error } = await supabase
    .from('order_details')
    .update({ 
      orarioFine: newEndTime 
    })
    .eq('id', appointmentId);
  
  if (error) throw error;
  return data;
}

// Fetch appointments with services using caching
export async function fetchAppointmentsWithServices(userId: string) {
  if (!userId) {
    console.error("fetchAppointmentsWithServices: userId is required");
    return [];
  }
  
  return await queryWithCache<Appointment[]>(
    `appointments_${userId}`, 
    async () => {
      // Query logic - questa è solo una implementazione di esempio
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id, 
          data, 
          orarioInizio, 
          orarioFine, 
          team_id,
          nome,
          status,
          services (
            id, 
            order_id, 
            servizio, 
            prezzo
          )
        `)
        .eq('user_id', userId)
        .order('data', { ascending: true });
        
      if (error) {
        console.error("Error fetching appointments:", error);
        return [];
      }
      
      return orders as Appointment[];
    },
    5 * 60 * 1000 // 5 minuti di cache
  );
}

// Fetch pauses
export async function fetchPausesQuery(userId: string) {
  // Your implementation here
  return [];
}

// Fetch team members
export async function fetchTeamMembers(salonId: string) {
  const { data, error } = await supabase
    .from('team')
    .select('*')
    .eq('salon_id', salonId)
    .eq('is_active', true) // Solo membri attivi
    .order('order_column', { ascending: true });
  
  if (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
  
  return data || [];
}

// Update team members order
export async function updateTeamMembersOrder(members: { id: string; order_column: number }[]) {
  const updates = members.map(member => 
    supabase.from('team')
      .update({ order_column: member.order_column })
      .eq('id', member.id)
  );
  
  await Promise.all(updates);
}

// Fetch users per page setting
export async function fetchUsersPerPage(userId: string) {
  // Default to 4 users per page
  return 4;
}

// Fetch raw team data
export async function fetchRawTeamData(salonId: string) {
  return { data: [], error: null };
}

// Fetch raw pauses data
export async function fetchRawPausesData(userId: string) {
  return { data: [], error: null };
}

// Fetch order details with services
export async function fetchOrdersWithServices(userId: string) {
  return [];
}

// Fetch groups
export async function fetchGroups(userId: string) {
  return [];
}

// Fetch group members
export async function fetchGroupMembers(userId: string) {
  return [];
}
