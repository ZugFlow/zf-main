import { createClient } from "@/utils/supabase/client";
import { format, addMinutes } from "date-fns";
import type { Appointment } from "@/types";
import type { User } from "@supabase/supabase-js";
import { useAuthContext } from './AuthContext';

const supabase = createClient();

// Costanti per le chiavi localStorage
export const STORAGE_KEYS = {
  SELECTED_GROUP_ID: 'zugflow_selected_group_id',
  SELECTED_TEAM_MEMBERS: 'zugflow_selected_team_members',
  HOUR_HEIGHT: 'calendarHourHeight', // Esistente, qui per referenza
};

// Salva le selezioni dell'utente nella cache locale
export function saveUserSelections(userId: string, selections: { 
  groupId?: string | null; 
  teamMemberIds?: string[];
}) {
  console.log("DEBUG: saveUserSelections called", { userId, selections });
  try {
    const userPrefix = `user_${userId}_`;
    
    // Salva il gruppo selezionato se fornito
    if (selections.groupId !== undefined) {
      console.log("DEBUG: Saving groupId", selections.groupId);
      localStorage.setItem(
        userPrefix + STORAGE_KEYS.SELECTED_GROUP_ID, 
        selections.groupId ? selections.groupId : ''
      );
    }
    
    // Salva i membri selezionati se forniti
    if (selections.teamMemberIds) {
      console.log("DEBUG: Saving teamMemberIds", selections.teamMemberIds);
      localStorage.setItem(
        userPrefix + STORAGE_KEYS.SELECTED_TEAM_MEMBERS, 
        JSON.stringify(selections.teamMemberIds)
      );
    }
    
    return true;
  } catch (error) {
    console.error("DEBUG: Error in saveUserSelections", error);
    return false;
  }
}

// Recupera le selezioni dell'utente dalla cache locale
export function getUserSelections(userId: string) {
  console.log("DEBUG: getUserSelections called", { userId });
  try {
    const userPrefix = `user_${userId}_`;
    const selectedGroupId = localStorage.getItem(userPrefix + STORAGE_KEYS.SELECTED_GROUP_ID);
    console.log("DEBUG: Retrieved selectedGroupId", selectedGroupId);

    let selectedTeamMemberIds: string[] = [];
    const storedTeamMembers = localStorage.getItem(userPrefix + STORAGE_KEYS.SELECTED_TEAM_MEMBERS);
    console.log("DEBUG: Retrieved storedTeamMembers", storedTeamMembers);

    if (storedTeamMembers) {
      selectedTeamMemberIds = JSON.parse(storedTeamMembers);
      console.log("DEBUG: Parsed selectedTeamMemberIds", selectedTeamMemberIds);
    }

    return {
      selectedGroupId: selectedGroupId === '' ? null : selectedGroupId,
      selectedTeamMemberIds
    };
  } catch (error) {
    console.error("DEBUG: Error in getUserSelections", error);
    return {
      selectedGroupId: null,
      selectedTeamMemberIds: []
    };
  }
}

// Rimuovi queste funzioni e variabili non più necessarie
// function setGlobalUser(user: any) { ... }
// let cachedUser: any = null;

// Modifica fetchOrdersWithServices per accettare userId come parametro
export async function fetchOrders({
  userId,
  includeServices = false,
  raw = false,
  filterByGroup = null,
}: {
  userId: string;
  includeServices?: boolean;
  raw?: boolean;
  filterByGroup?: string | null;
}) {
  console.log("DEBUG: fetchOrders called", { userId, includeServices, raw, filterByGroup });
  try {
    if (!userId) {
      console.error("DEBUG: No userId provided");
      return [];
    }

    let query = supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("orarioInizio", { ascending: true });

    if (filterByGroup) {
      console.log("DEBUG: Applying filterByGroup", filterByGroup);
      query = query.eq("group_id", filterByGroup);
    }

    const { data: orders, error: ordersError } = await query;
    console.log("DEBUG: Orders fetched", orders);

    if (ordersError) {
      console.error("DEBUG: Error fetching orders", ordersError);
      return [];
    }

    if (raw) {
      console.log("DEBUG: Returning raw orders");
      return orders;
    }

    if (includeServices) {
      console.log("DEBUG: Fetching services for orders");
      // Add logic to fetch services if needed
    }

    return orders || [];
  } catch (error) {
    console.error("DEBUG: Error in fetchOrders", error);
    return [];
  }
}

// Update other functions similarly
export async function fetchTeamMembers(salonId: string | null, memberIds?: string[]) {
  console.log("DEBUG: fetchTeamMembers called", { salonId, memberIds });
  if (!salonId) {
    console.error("DEBUG: No salon ID provided");
    return [];
  }
  
  try {
    let query = supabase
      .from("team")
      .select("id, name, ColorMember, visible_users, order_column, avatar_url")
      .eq("salon_id", salonId)
      .eq("is_active", true) // Solo membri attivi
      .order("order_column", { ascending: true });

    if (memberIds && memberIds.length > 0) {
      console.log("DEBUG: Filtering by memberIds", memberIds);
      query = query.in("id", memberIds);
    }

    const { data, error } = await query;
    console.log("DEBUG: Team members fetched", data);

    if (error) {
      console.error("DEBUG: Error fetching team members", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("DEBUG: Unexpected error in fetchTeamMembers", error);
    return [];
  }
}

// Nuova funzione per caricare gli appuntamenti (appointments)
export async function fetchAppointmentsWithServices(userId: string) {
  return await fetchOrders({ userId, includeServices: true });
}

// Nuova funzione per caricare le pause (pauses)
export async function fetchPauses(userId: string) {
  try {
    const { data, error } = await supabase
      .from("pauses")
      .select("*")
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching pauses:", error);
      return [];
    }

    // Convert pauses to appointment format for rendering
    const pauseAppointments = data.map(pause => ({
      id: pause.id,
      nome: "Pausa",
      orarioInizio: pause.start_time,
      orarioFine: pause.end_time,
      data: pause.date,
      team_id: pause.team_member_id,
      servizio: "Pausa",
      type: "pause" as const,
    }));
    
    return pauseAppointments;
  } catch (error) {
    console.error("Error in fetchPauses:", error);
    return [];
  }
}

// Refactored fetchServicesForOrders to directly fetch data without caching
export async function fetchServicesForOrders(orderIds: string[]) {
  if (!orderIds.length) return {};

  try {
    const { data: allServices, error } = await supabase
      .from("order_services")
      .select("*")
      .in("order_id", orderIds);

    if (error) {
      console.error("Error fetching services:", error);
      return {};
    }

    const servicesMap: Record<string, any[]> = {};
    (allServices || []).forEach((service) => {
      if (!servicesMap[service.order_id]) {
        servicesMap[service.order_id] = [];
      }
      servicesMap[service.order_id].push(service);
    });

    return servicesMap;
  } catch (error) {
    console.error("Error in fetchServicesForOrders:", error);
    return {};
  }
}

// Add an appointment to the orders table
export async function addAppointment(newAppointment: Appointment, userId: string) {
  try {
    const appointmentWithUserId = {
      ...newAppointment,
      user_id: userId
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(appointmentWithUserId)
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
}

// Move an appointment to DeletedOrders table
export async function moveAppointmentToDeletedOrders(appointmentId: string) {
  try {
    // Recupera l'appuntamento corrente
    const { data: appointmentData, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (fetchError) throw fetchError;

    if (appointmentData) {
      // Rimuovere il campo id per permettere a Supabase di generare un nuovo id
      const { id, ...appointmentWithoutId } = appointmentData;

      // Inserisci l'appuntamento in Deleted_Orders
      const { error: insertError } = await supabase
        .from("Deleted_Orders")
        .insert(appointmentWithoutId);

      if (insertError) throw insertError;

      // Rimuovi l'appuntamento da orders
      const { error: deleteError } = await supabase
        .from("orders")
        .delete()
        .eq("id", appointmentId);

      if (deleteError) throw deleteError;

      return appointmentData; // Return the deleted appointment for possible undo
    }
    return null;
  } catch (error) {
    console.error("Errore durante lo spostamento dell'appuntamento:", error);
    throw error;
  }
}

// Update appointment time and team member
export async function updateAppointmentTimeAndTeam(
  appointmentId: string,
  newStart: string,
  newEnd: string,
  date: string,
  memberId: string
) {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        orarioInizio: newStart,
        orarioFine: newEnd,
        data: date,
        team_id: memberId,
      })
      .eq("id", appointmentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating appointment:", error);
    throw error;
  }
}

// Update appointment end time (for resizing)
export async function updateAppointmentEndTime(appointmentId: string, newEndTime: string) {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        orarioFine: newEndTime,
      })
      .eq("id", appointmentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating appointment end time:", error);
    throw error;
  }
}

// Update appointment status
export async function updateAppointmentStatus(appointmentId: string, newStatus: string, userId: string) {
  try {
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        user_id: userId 
      })
      .eq('id', appointmentId);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
}

// Check for deleted orders (for undo functionality)
export async function checkDeletedOrders() {
  try {
    const { data, error } = await supabase
      .from('Deleted_Orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    return {
      canUndo: data && data.length > 0,
      lastDeletedAppointment: data && data.length > 0 ? data[0] : null
    };
  } catch (error) {
    console.error('Error checking deleted orders:', error);
    throw error;
  }
}

// Restore a deleted appointment
export async function restoreDeletedAppointment(appointment: Appointment) {
  try {
    // Remove from Deleted_Orders
    await supabase
      .from('Deleted_Orders')
      .delete()
      .eq('data', appointment.data)
      .eq('orarioInizio', appointment.orarioInizio)
      .eq('orarioFine', appointment.orarioFine)
      .eq('nome', appointment.nome);

    // Add back to Orders
    await supabase
      .from('orders')
      .insert(appointment);
      
    return true;
  } catch (error) {
    console.error('Error restoring appointment:', error);
    throw error;
  }
}

// Archive an appointment (move to Archived_Orders table)
export async function archiveAppointment(appointmentId: string) {
  try {
    // Recupera l'appuntamento corrente
    const { data: appointmentData, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (fetchError) throw fetchError;

    if (appointmentData) {
      // Add archive timestamp
      const archivedAppointment = {
        ...appointmentData,
        archived_at: new Date().toISOString(),
        original_id: appointmentData.id
      };

      // Remove the id field to let Supabase generate a new one
      const { id, ...appointmentWithoutId } = archivedAppointment;

      // Insert into Archived_Orders
      const { error: insertError } = await supabase
        .from("Archived_Orders")
        .insert(appointmentWithoutId);

      if (insertError) throw insertError;

      // Remove from orders
      const { error: deleteError } = await supabase
        .from("orders")
        .delete()
        .eq("id", appointmentId);

      if (deleteError) throw deleteError;

      return appointmentData; // Return the archived appointment for possible restore
    }
    return null;
  } catch (error) {
    console.error("Errore durante l'archiviazione dell'appuntamento:", error);
    throw error;
  }
}

// Fetch archived appointments
export async function fetchArchivedAppointments(userId: string) {
  try {
    const { data, error } = await supabase
      .from("Archived_Orders")
      .select(`
        *,
        services:order_services(
          id,
          servizio,
          prezzo
        )
      `)
      .eq("user_id", userId)
      .order("archived_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Errore nel recupero degli appuntamenti archiviati:", error);
    throw error;
  }
}

// Restore an archived appointment
export async function restoreArchivedAppointment(appointment: any) {
  try {
    // Remove archive timestamp and original_id for restoration
    const { archived_at, original_id, ...appointmentForRestore } = appointment;

    // Add back to Orders
    const { error: insertError } = await supabase
      .from("orders")
      .insert(appointmentForRestore);

    if (insertError) throw insertError;

    // Remove from Archived_Orders
    const { error: deleteError } = await supabase
      .from("Archived_Orders")
      .delete()
      .eq("original_id", original_id);

    if (deleteError) throw deleteError;

    return true;
  } catch (error) {
    console.error("Errore nel ripristino dell'appuntamento:", error);
    throw error;
  }
}

// Fetch group members
export async function fetchGroupMembers(userId: string) {
  try {
    // Prima importiamo getSalonId
    const { getSalonId } = await import('@/utils/getSalonId');
    
    // Ottieni il salon_id per l'utente corrente
    const salonId = await getSalonId();
    
    if (!salonId) {
      console.error("No salon_id found for user:", userId);
      return [];
    }

    // Join con la tabella groups per filtrare per salon_id
    const { data, error } = await supabase
      .from("chat_group_members")
      .select("id, group_id, team_member_id, groups!inner(salon_id)")
      .eq("groups.salon_id", salonId);

    if (error) throw error;
    return data?.map(item => ({
      id: item.id,
      group_id: item.group_id,
      team_member_id: item.team_member_id
    })) || [];
  } catch (error) {
    console.error("Error fetching group members:", error);
    return [];
  }
}

// Batch fetch settings for multiple user_ids and keys
export async function fetchSettingsForUsers(userIds: string[], keys: string[]) {
  if (!userIds.length || !keys.length) return [];
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .in("user_id", userIds)
    .in("key", keys);
  if (error) {
    console.error("Error fetching settings:", error);
    return [];
  }
  return data || [];
}

// Helper: Aggiorna avatar_url per membri che non hanno url http
export async function updateMembersAvatarUrls(members: any[], supabaseInstance: any) {
  if (!members.some(m => m.avatar_url && !m.avatar_url.startsWith('http'))) {
    return members;
  }
  const updatedMembers = await Promise.all(
    members.map(async (member) => {
      if (member.avatar_url && !member.avatar_url.startsWith('http')) {
        const { data } = supabaseInstance.storage.from('zugflowhub').getPublicUrl(member.avatar_url);
        return { ...member, avatar_url: data.publicUrl };
      }
      return member;
    })
  );
  return updatedMembers;
}

// Update team member visibility
export async function updateTeamMemberVisibility(memberId: string, isVisible: boolean) {
  try {
    const { error } = await supabase
      .from("team")
      .update({ visible_users: isVisible })
      .eq("id", memberId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating team member visibility:", error);
    throw error;
  }
}

// Update team member order
export async function updateTeamMembersOrder(updates: { id: string; order_column: number }[]) {
  try {
    const { error } = await supabase
      .from("team")
      .upsert(
        updates.map(({ id, order_column }) => ({
          id,
          order_column
        }))
      );

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating team members order:", error);
    throw error;
  }
}

// Fetch calendar hours
export async function fetchCalendarHours(userId: string) {
  try {
    const { data, error } = await supabase
      .from("hoursettings")
      .select("start_hour, finish_hour")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Errore nel recupero degli orari del calendario:", error.message);
      return { start_hour: "00:00", finish_hour: "23:59" };
    }
    
    return {
      start_hour: data?.start_hour || "00:00",
      finish_hour: data?.finish_hour || "23:59"
    };
  } catch (error) {
    console.error("Error fetching calendar hours:", error);
    return { start_hour: "00:00", finish_hour: "23:59" };
  }
}

// Fetch users per page setting
export async function fetchUsersPerPage(userId: string) {
  try {
    const { data, error } = await supabase
      .from("users_per_page")
      .select("number")
      .eq("user_id", userId)
      .limit(1);

    if (error) {
      console.error("Error fetching users per page:", error);
      return 4; // Default value
    }

    return data && data.length > 0 ? Math.min(data[0].number || 4, 4) : 4;
  } catch (error) {
    console.error("Error fetching users per page:", error);
    return 4; // fallback
  }
}

// Fetch groups
export async function fetchGroups(userId: string) {
  try {
    // Prima importiamo getSalonId
    const { getSalonId } = await import('@/utils/getSalonId');
    
    // Ottieni il salon_id per l'utente corrente
    const salonId = await getSalonId();
    
    if (!salonId) {
      console.error("No salon_id found for user:", userId);
      return [];
    }

    const { data, error } = await supabase
      .from("groups")
      .select("id, name")
      .eq("salon_id", salonId)
      .order("created_at", { ascending: true });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching groups:", error);
    return [];
  }
}

// Fetch appointment status
export async function fetchAppointmentStatus(appointmentId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('status')
    .eq('id', appointmentId)
    .single();

  if (error) throw error;
  return data;
}

// Update appointment with all details
export async function updateAppointment(appointmentData: any) {
  const { error } = await supabase
    .from('orders')
    .update(appointmentData)
    .eq('id', appointmentData.id)
    .eq('user_id', appointmentData.user_id);

  if (error) throw error;
  return true;
}

// Fetch hour settings
export async function fetchHourSettings(userId: string) {
  const { data, error } = await supabase
    .from("hoursettings")
    .select("start_hour, finish_hour, formato")
    .eq("user_id", userId)
    .single();
    
  if (error) {
    console.error("Error fetching hour settings:", error);
    throw error;
  }
  
  return data;
}

// Function to get user's time format preference
export async function getUserTimeFormat() {
  try {
    // Get the authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
      console.error("User error:", userError?.message || "User not authenticated");
      return "24"; // Default to 24-hour format
    }

    // Fetch the user's time format preference
    const { data: settingsData, error: settingsError } = await supabase
      .from('hoursettings')
      .select('formato')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settingsData) {
      console.log("No time format preference found, using default 24-hour format");
      return "24"; // Default to 24-hour format
    }

    return settingsData.formato || "24";
  } catch (error) {
    console.error("Error fetching user time format:", error);
    return "24"; // Default to 24-hour format
  }
}

// Subscribe to real-time changes for orders and services
export function subscribeToOrderChanges(
  supabase: any,
  callbacks: {
    onInsert?: (appointment: any) => void;
    onDelete?: (id: string) => void;
    onUpdate?: (appointment: any) => void;
  }
) {
  const subscription = supabase
    .channel("realtime:orders_and_services")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      async (payload: any) => {
        if (payload.eventType === "INSERT") {
          const serviceMap = await fetchServicesForOrders([payload.new.id]);
          const newAppointment = {
            ...payload.new,
            services: serviceMap[payload.new.id] || [],
          };
          callbacks.onInsert?.(newAppointment);
        } else if (payload.eventType === "DELETE") {
          callbacks.onDelete?.(payload.old.id);
        } else if (payload.eventType === "UPDATE") {
          const serviceMap = await fetchServicesForOrders([payload.new.id]);
          const updatedAppointment = {
            ...payload.new,
            services: serviceMap[payload.new.id] || [],
          };
          callbacks.onUpdate?.(updatedAppointment);
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "order_services" },
      async (payload: any) => {
        const orderId = payload.new?.order_id || payload.old?.order_id;
        if (!orderId) return;

        const serviceMap = await fetchServicesForOrders([orderId]);
        const updatedAppointment = {
          id: orderId,
          services: serviceMap[orderId] || [],
        };
        callbacks.onUpdate?.(updatedAppointment);
      }
    )
    .subscribe();

  return {
    subscription,
    unsubscribe: () => {
      supabase.removeChannel(subscription);
    },
  };
}

// Fetch raw team data directly (used in loadInitialData)
export async function fetchRawTeamData(salonId: string) {
  const { data, error } = await supabase
    .from("team")
    .select("id, name, ColorMember, visible_users, order_column, avatar_url")
    .eq("salon_id", salonId)
    .eq("is_active", true) // Solo membri attivi
    .order('order_column', { ascending: true });
  
  if (error) { console.error("Error fetching team data:", error); }
  
  return { data, error };
}

// Fetch raw pauses data directly (used in loadInitialData)
export async function fetchRawPausesData(userId: string) {
  const { data, error } = await supabase
    .from("pauses")
    .select("*")
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Error fetching pauses:", error);
  }
  
  return { data, error };
}

// Fetch raw group members data (used in loadInitialData)
export async function fetchRawGroupMembersData(userId: string) {
  try {
    // Prima importiamo getSalonId
    const { getSalonId } = await import('@/utils/getSalonId');
    
    // Ottieni il salon_id per l'utente corrente
    const salonId = await getSalonId();
    
    if (!salonId) {
      console.error("No salon_id found for user:", userId);
      return { data: null, error: new Error("No salon_id found") };
    }

    // FIX: filtra tramite join con groups usando salon_id
    const { data, error } = await supabase
      .from("chat_group_members")
      .select("group_id, team_member_id, groups!inner(salon_id)")
      .eq("groups.salon_id", salonId);

    if (error) {
      console.error("Error fetching group members:", error);
    }

    return { data, error };
  } catch (err) {
    console.error("Unexpected error in fetchRawGroupMembersData:", err);
    return { data: null, error: err };
  }
}

// Fetch raw groups data (used in loadInitialData)
export async function fetchRawGroupsData(userId: string) {
  try {
    // Prima importiamo getSalonId
    const { getSalonId } = await import('@/utils/getSalonId');
    
    // Ottieni il salon_id per l'utente corrente
    const salonId = await getSalonId();
    
    if (!salonId) {
      console.error("No salon_id found for user:", userId);
      return { data: null, error: new Error("No salon_id found") };
    }

    const { data, error } = await supabase
      .from("groups")
      .select("id, name")
      .eq("salon_id", salonId)
      .order("created_at", { ascending: true });
    
    if (error) {
      console.error("Error fetching groups:", error);
    }
    
    return { data, error };
  } catch (err) {
    console.error("Unexpected error in fetchRawGroupsData:", err);
    return { data: null, error: err };
  }
}

// Subscribe to deleted orders changes
export function subscribeToDeletedOrdersChanges(callback: () => void) {
  return supabase
    .channel('deleted_orders_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'Deleted_Orders' },
      callback
    )
    .subscribe();
}

// NUOVE FUNZIONI PER GESTIRE LE SOTTOSCRIZIONI

// Funzione migliorata per sottoscriversi a cambiamenti negli appuntamenti con gestione stato
export function setupAppointmentsSubscription(
  setAppointments: React.Dispatch<React.SetStateAction<any[]>>,
  supabaseClient = supabase
) {
  try {
    let pendingUpdates: Record<string, { type: string; data: any }> = {};
    let updateTimer: NodeJS.Timeout | null = null;
    let isFetching = false; // Flag to track fetch state
    let retryCount = 0;
    const maxRetries = 3;

    // Function to batch updates to minimize re-renders
    const processBatchUpdates = () => {
      const updates = Object.values(pendingUpdates);
      
      if (updates.length === 0) return;

      // Process all updates in a single state update
      setAppointments((prevAppointments) => {
        let newAppointments = [...prevAppointments];
        
        // Process inserts
        const inserts = updates.filter(u => u.type === 'INSERT').map(u => u.data);
        if (inserts.length > 0) {
          // Remove any existing appointments with the same ID to avoid duplicates
          const insertIds = new Set(inserts.map(app => app.id));
          newAppointments = newAppointments.filter(app => !insertIds.has(app.id));
          newAppointments = [...newAppointments, ...inserts];
        }
        
        // Process updates
        const updateMap: Record<string, any> = {};
        updates.filter(u => u.type === 'UPDATE').forEach(u => {
          updateMap[u.data.id] = u.data;
        });
        
        if (Object.keys(updateMap).length > 0) {
          newAppointments = newAppointments.map(app => 
            updateMap[app.id] ? { ...app, ...updateMap[app.id] } : app
          );
        }
        
        // Process deletes
        const deleteIds = new Set(updates.filter(u => u.type === 'DELETE').map(u => u.data));
        if (deleteIds.size > 0) {
          newAppointments = newAppointments.filter(app => !deleteIds.has(app.id));
        }
        
        return newAppointments;
      });
      
      pendingUpdates = {};
    };

    // Queue an update and schedule processing
    const queueUpdate = (id: string, type: string, data: any) => {
      pendingUpdates[id] = { type, data };
      
      if (updateTimer) clearTimeout(updateTimer);
      updateTimer = setTimeout(processBatchUpdates, 100); // Reduced from 300ms to 100ms for faster updates
    };

    // Enhanced error handling for service fetching
    const fetchServicesWithRetry = async (orderId: string) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const serviceMap = await fetchServicesForOrders([orderId]);
          return serviceMap[orderId] || [];
        } catch (error) {
          console.error(`Error fetching services for order ${orderId}, attempt ${attempt}:`, error);
          if (attempt === maxRetries) {
            console.error(`Failed to fetch services for order ${orderId} after ${maxRetries} attempts`);
            return [];
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        }
      }
      return [];
    };

    const subscription = supabaseClient
      .channel("realtime:appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async (payload: any) => {
          if (isFetching) return; // Prevent updates during fetch

          try {
            if (payload.eventType === "INSERT") {
              console.log('Real-time INSERT event received for appointment:', payload.new.id);
              const services = await fetchServicesWithRetry(payload.new.id);
              const newAppointment = {
                ...payload.new,
                services: services,
              };
              queueUpdate(payload.new.id, 'INSERT', newAppointment);
            } else if (payload.eventType === "DELETE") {
              console.log('Real-time DELETE event received for appointment:', payload.old.id);
              queueUpdate(payload.old.id, 'DELETE', payload.old.id);
            } else if (payload.eventType === "UPDATE") {
              console.log('Real-time UPDATE event received for appointment:', payload.new.id);
              const services = await fetchServicesWithRetry(payload.new.id);
              const updatedAppointment = {
                ...payload.new,
                services: services,
              };
              queueUpdate(payload.new.id, 'UPDATE', updatedAppointment);
            }
          } catch (error) {
            console.error('Error processing real-time appointment event:', error);
            // Don't increment retry count for subscription errors, just log them
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_services" },
        async (payload: any) => {
          if (isFetching) return; // Prevent updates during fetch

          try {
            const orderId = payload.new?.order_id || payload.old?.order_id;
            if (!orderId) return;

            console.log('Real-time order_services event received for order:', orderId);
            const services = await fetchServicesWithRetry(orderId);
            queueUpdate(orderId, 'UPDATE', {
              id: orderId,
              services: services,
            });
          } catch (error) {
            console.error('Error processing real-time order_services event:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Appointments subscription status:', status);
        if (status === 'SUBSCRIBED') {
          retryCount = 0; // Reset retry count on successful subscription
        }
      });

    return {
      subscription,
      unsubscribe: () => {
        if (updateTimer) clearTimeout(updateTimer);
        supabaseClient.removeChannel(subscription);
      },
      setFetching: (fetching: boolean) => {
        isFetching = fetching;
      },
    };
  } catch (error) {
    console.error("Error setting up appointments subscription:", error);
    return null;
  }
}

// Funzione per sottoscriversi ai cambiamenti negli appuntamenti eliminati
export function setupDeletedAppointmentsSubscription(
  checkDeletedOrders: () => void,
  supabaseClient = supabase
) {
  try {
    const subscription = supabaseClient
      .channel('deleted_orders_subscription')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Deleted_Orders' },
        () => {
          checkDeletedOrders();
        }
      )
      .subscribe();

    return {
      subscription,
      unsubscribe: () => {
        supabaseClient.removeChannel(subscription);
      },
    };
  } catch (error) {
    console.error("Error setting up deleted appointments subscription:", error);
    return null;
  }
}

// Funzione helper per rimuovere una sottoscrizione in sicurezza
export function safelyRemoveChannel(subscription: any, supabaseClient = supabase) {
  if (!subscription) return;
  
  try {
    supabaseClient.removeChannel(subscription);
  } catch (err) {
    console.error("Error removing channel:", err);
  }
}

// Helper function to fetch all data needed for CreateOrder component
export async function fetchCreateOrderData(salonId: string) {
  try {
    // Fetch team members
    const { data: teamMembers, error: teamError } = await supabase
      .from("team")
      .select("id, name")
      .eq("salon_id", salonId)
      .order("order_column", { ascending: true });
    if (teamError) throw teamError;

    // Fetch clients
    const { data: clients, error: clientsError } = await supabase
      .from("customers")
      .select("*")
      .eq("salon_id", salonId);
    if (clientsError) throw clientsError;

    // Fetch services
    console.log('DEBUG: Fetching services for salon_id:', salonId);
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("*")
      .eq("salon_id", salonId);
    console.log('DEBUG: Services fetch result:', { services, servicesError });
    if (servicesError) throw servicesError;

    // Fetch appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from("orders")
      .select("*")
      .eq("salon_id", salonId);
    if (appointmentsError) throw appointmentsError;

    // Fetch statuses (if you have a statuses table, otherwise leave empty)
    let statuses: any[] = [];
    try {
      const { data: statusesData } = await supabase
        .from("statuses")
        .select("*");
      statuses = statusesData || [];
    } catch {}

    return {
      teamMembers: teamMembers || [],
      appointments: appointments || [],
      services: services || [],
      clients: clients || [],
      statuses: statuses
    };
  } catch (error) {
    console.error("Errore in fetchCreateOrderData:", error);
    return {
      teamMembers: [],
      appointments: [],
      services: [],
      clients: [],
      statuses: []
    };
  }
}

// Add a custom hook to handle user ID checks
export function useQueryWithAuth() {
  const { userId, isLoading } = useAuthContext();

  const safeQuery = async (queryFn: (userId: string) => Promise<any>) => {
    if (isLoading) return null;
    if (!userId) {
      console.error("User not authenticated");
      return null;
    }
    return await queryFn(userId);
  };

  return { safeQuery, userId };
}

// Elimina un appuntamento e i servizi collegati (ON DELETE CASCADE)
export async function deleteAppointment(appointmentId: string) {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', appointmentId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Errore durante l\'eliminazione dell\'appuntamento:', error);
    throw error;
  }
}

// Function to load initial data using an aggregated RPC and limited concurrent fetches
export async function loadInitialData(userId: string) {
  try {
    if (!userId) {
      console.error("loadInitialData: No userId provided!");
      return {};
    }

    // Use Supabase RPC for aggregated data fetch
    const { data: aggregatedData, error: rpcError } = await supabase
      .rpc("fetch_aggregated_data", { user_id: userId });

    if (rpcError) {
      console.error("Error fetching aggregated data via RPC:", rpcError);
      return {};
    }

    // If additional fetches are needed, limit concurrency with Promise.all
    const [pauses, teamMembers] = await Promise.all([
      fetchPauses(userId),
      fetchTeamMembers(aggregatedData.salonId),
    ]);

    return {
      orders: aggregatedData.orders || [],
      services: aggregatedData.services || [],
      groups: aggregatedData.groups || [],
      pauses,
      teamMembers,
    };
  } catch (error) {
    console.error("Error in loadInitialData:", error);
    return {};
  }
}

// Add a global cache for user data
let cachedUserData: any = null;
let isFetchingUserData = false;

// Function to fetch user data with caching
export async function getUserDataWithCache(): Promise<User | null> {
  if (cachedUserData) {
    return cachedUserData;
  }

  if (isFetchingUserData) {
    console.warn("getUserDataWithCache: Fetch already in progress");
    return null;
  }

  isFetchingUserData = true;

  try {
    // Fix recursive call - directly use supabase.auth.getUser() instead
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      console.error("Error fetching user data:", error?.message);
      return null;
    }

    cachedUserData = data.user;
    return data.user;
  } catch (error) {
    console.error("Error in getUserDataWithCache:", error);
    return null;
  } finally {
    isFetchingUserData = false;
  }
}

// Function to clear cached user data (e.g., on logout)
export function clearUserDataCache() {
  cachedUserData = null;
}

// Function to fetch public URL from Supabase storage
export async function fetchPublicUrlFromStorage(bucket: string, path: string): Promise<string | null> {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (error) {
    console.error("Unexpected error in fetchPublicUrlFromStorage:", error);
    return null;
  }
}

// Add a function to save the selected time format to the hoursettings table, associating it with the team member.
export async function saveTimeFormat(format: string) {
  try {
    // Get the authenticated user (same pattern as GestioneMembri)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
      console.error("User error:", userError?.message || "User not authenticated");
      return { success: false, error: "User not authenticated" };
    }

    console.log("Saving time format for user:", user.id);

    // Fetch salon_id of the current user (same pattern as GestioneMembri)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('salon_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData?.salon_id) {
      console.error("Error fetching salon_id:", profileError?.message);
      return { success: false, error: "Unable to fetch salon_id from profile." };
    }

    const salonId = profileData.salon_id;
    console.log("Found salon_id:", salonId);

    // Upsert the time format into the hoursettings table (including salon_id to link with team)
    const { data: upsertData, error: updateError } = await supabase
      .from('hoursettings')
      .upsert({
        user_id: user.id,
        salon_id: salonId, // Link to team member's salon
        formato: format,
        start_hour: "00:00", // Default value for start_hour
        finish_hour: "23:59" // Default value for finish_hour
      }, { onConflict: 'user_id' })
      .select();

    if (updateError) {
      console.error("Error saving time format:", updateError.message);
      return { success: false, error: updateError.message };
    }

    console.log("Time format saved successfully:", upsertData);
    return { success: true };
  } catch (error) {
    console.error("Unexpected error saving time format:", error);
    return { success: false, error: "Unexpected error occurred." };
  }
}


