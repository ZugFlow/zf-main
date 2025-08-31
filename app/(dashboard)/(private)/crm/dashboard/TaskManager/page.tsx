'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getSalonId } from '@/utils/getSalonId';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { RichTextViewer } from '@/components/ui/rich-text-viewer';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Add, 
  Search, 
  Filter, 
  Calendar, 
  Time, 
  User, 
  Checkmark, 
  CircleDash, 
  TrashCan, 
  Edit, 
  OverflowMenuHorizontal,
  StarFilled,
  Tag,
  Archive,
  Renew
} from '@carbon/icons-react';
import { format, parseISO, addDays, isToday, isTomorrow, isYesterday } from 'date-fns';
import { it } from 'date-fns/locale';
import NavbarSecondaria from './navbar_secondaria_task';
import { APPOINTMENT_STATUSES, getStatusColor as getStatusColorFromStatus } from '@/components/status';
import { usePermissions } from '../Impostazioni/usePermission';
import { dispatchTaskEvent, listenForTaskEvents, TASK_EVENTS } from '../utils/taskEvents';

const supabase = createClient();

// Funzione per generare orari ogni 5 minuti
const generateTimeSlots = () => {
  const timeSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      timeSlots.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return timeSlots;
};

const timeSlots = generateTimeSlots();

interface Task {
  id: string;
  nome: string;
  descrizione?: string;
  status: string;
  data: string;
  orarioInizio: string;
  orarioFine?: string;
  color_card?: string[]; // Cambiato da string a string[] per compatibilità con orders
  note_richtext?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  salon_id: string;
  team_id?: string;
  parrucchiere?: string;
  stilista?: string;
  prezzo: number;
  note?: string;
  task: boolean;
  // Campi aggiuntivi per compatibilità con appuntamenti
  telefono?: string;
  email?: string;
  customer_uuid?: string;
  prefer_card_style?: string;
  alone?: string;
  booking_source?: string;
  is_pausa?: boolean;
}



interface TaskManagerComponentProps {
  isCreateModalOpen?: boolean;
  setIsCreateModalOpen?: (open: boolean) => void;
}

interface PageProps {
  params: Record<string, string>;
  searchParams: Record<string, string | string[] | undefined>;
}

const TaskManagerComponent = (props: TaskManagerComponentProps = {}) => {
  const { isCreateModalOpen: externalIsCreateModalOpen, setIsCreateModalOpen: externalSetIsCreateModalOpen } = props;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [internalIsCreateModalOpen, setInternalIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUserTeamId, setCurrentUserTeamId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Cache duration: 30 seconds
  const CACHE_DURATION = 30 * 1000;

  // Use external modal state if provided, otherwise use internal state
  const isCreateModalOpen = externalIsCreateModalOpen !== undefined ? externalIsCreateModalOpen : internalIsCreateModalOpen;
  const setIsCreateModalOpen = externalSetIsCreateModalOpen || setInternalIsCreateModalOpen;

  // Get permissions
  const { hasPermission, loading: permissionsLoading, userRole } = usePermissions(session);

  // Navbar states
  const [dailyViewDate, setDailyViewDate] = useState(new Date());
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<(string | null)[]>([]);
  const [showDeletedAppointments, setShowDeletedAppointments] = useState(false);
  const [daysToShow, setDaysToShow] = useState(1);

  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    descrizione: '',
    status: 'In corso', // Stato di default per i task
    data: format(new Date(), 'yyyy-MM-dd'),
    orarioInizio: '09:00',
    orarioFine: '10:00',
    prezzo: 0,
    note_richtext: '', // Rich text content
    color_card: '#3b82f6', // Manteniamo come stringa nel form, convertiamo in array quando salviamo
    task: true,
    team_id: ''
  });

  // Memoized status options for better performance
  const statusOptions = useMemo(() => 
    APPOINTMENT_STATUSES.map(status => ({
      value: status.value,
      label: status.label,
      color: `bg-${status.color}-100 text-${status.color}-800`
    })), []
  );

  // Memoized date filter options
  const dateFilterOptions = useMemo(() => [
    { value: 'all', label: 'Tutti i giorni' },
    { value: 'today', label: 'Oggi' },
    { value: 'tomorrow', label: 'Domani' },
    { value: 'week', label: 'Questa settimana' },
    { value: 'overdue', label: 'Scaduti' }
  ], []);

  // Debounce search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initialize component
  useEffect(() => {
    initializeComponent();
  }, []);

  // Listen for task events to refresh list in real-time
  useEffect(() => {
    if (!salonId || !userId) return;
    const handleEvent = async () => {
      await fetchTasks(salonId, userId, true);
    };
    const unsubCreate = listenForTaskEvents(TASK_EVENTS.CREATED, handleEvent);
    const unsubUpdate = listenForTaskEvents(TASK_EVENTS.UPDATED, handleEvent);
    const unsubDelete = listenForTaskEvents(TASK_EVENTS.DELETED, handleEvent);
    // Optionally handle status changes
    const unsubStatus = listenForTaskEvents(TASK_EVENTS.STATUS_CHANGED, handleEvent);
    return () => {
      unsubCreate();
      unsubUpdate();
      unsubDelete();
      unsubStatus();
    };
  }, [salonId, userId]);


  const initializeComponent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }
      setUserId(user.id);

      // Get session for permissions
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      const salonIdResult = await getSalonId();
      if (!salonIdResult) {
        console.error('No salon ID found');
        return;
      }
      setSalonId(salonIdResult);

      // Get current user's team ID if they are a team member
      await getCurrentUserTeamId(user.id, salonIdResult);


      
      // Fetch tasks after userId is set
      if (user.id) {
        await fetchTasks(salonIdResult, user.id);
      }
    } catch (error) {
      console.error('Error initializing component:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get current user's team ID
  const getCurrentUserTeamId = async (userId: string, salonId: string) => {
    try {
      // Check if user is a team member
      const { data: teamData, error: teamError } = await supabase
        .from('team')
        .select('id')
        .eq('user_id', userId)
        .eq('salon_id', salonId)
        .single();

      if (!teamError && teamData) {
        setCurrentUserTeamId(teamData.id);
        console.log('Current user team ID:', teamData.id);
      }
    } catch (error) {
      console.error('Error getting current user team ID:', error);
    }
  };



  // Fetch tasks from database with caching
  const fetchTasks = async (salonId: string, currentUserId?: string, forceRefresh = false) => {
    try {
      // Use passed userId or state userId
      const targetUserId = currentUserId || userId;
      
      // Ensure userId is available
      if (!targetUserId) {
        console.log('UserId not available yet, skipping fetchTasks');
        return;
      }

      // Check cache validity (unless force refresh)
      const now = Date.now();
      if (!forceRefresh && (now - lastFetchTime) < CACHE_DURATION && tasks.length > 0) {
        console.log('Using cached tasks data');
        return;
      }

      // Proceed with fetch even during initial loading to ensure tasks appear immediately

      // OTTIMIZZAZIONE: Query specifica con solo i campi necessari e limiti di performance
      let query = supabase
        .from('orders')
        .select(`
          id,
          nome,
          descrizione,
          status,
          data,
          orarioInizio,
          orarioFine,
          color_card,
          note_richtext,
          created_at,
          updated_at,
          user_id,
          salon_id,
          team_id,
          parrucchiere,
          stilista,
          prezzo,
          note,
          task,
          telefono,
          email,
          customer_uuid,
          prefer_card_style,
          alone,
          booking_source,
          is_pausa
        `)
        .eq('salon_id', salonId)
        .eq('task', true) // Only fetch tasks
        .eq('user_id', targetUserId) // Only current user's tasks
        .order('created_at', { ascending: false }) // order by creation date desc
        .order('orarioInizio', { ascending: false })
        .limit(500); // Limite ragionevole per evitare carichi eccessivi

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      console.log(`Fetched ${data?.length || 0} tasks for user: ${targetUserId}`);
      setTasks(data || []);
      setFilteredTasks(data || []);
      setLastFetchTime(now); // Update cache timestamp
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };



  // Filter tasks based on search and filters
  useEffect(() => {
    let filtered = tasks;

    // Security filter: ensure only current user's tasks are shown
    if (userId) {
      filtered = filtered.filter(task => task.user_id === userId);
    }

    // Handle deleted tasks visibility
    if (showDeletedAppointments) {
      // When trash is active, show ONLY deleted tasks
      filtered = filtered.filter(task => task.status === 'Eliminato');
    } else {
      // When trash is not active, hide deleted tasks
      filtered = filtered.filter(task => task.status !== 'Eliminato');
    }

    // OTTIMIZZAZIONE: Applica filtri in ordine di efficienza
    // Status filter first (most selective)
    if (statusFilter !== 'all' && !showDeletedAppointments) {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Status filters from navbar
    if (selectedStatusFilters.length > 0 && !showDeletedAppointments) {
      filtered = filtered.filter(task => 
        selectedStatusFilters.includes(task.status)
      );
    }

    // Date filter (pre-computed date objects for better performance)
    if (dateFilter !== 'all') {
      const today = new Date();
      const todayStr = today.toDateString();
      
      filtered = filtered.filter(task => {
        const taskDate = parseISO(task.data);
        const taskDateStr = taskDate.toDateString();
        
        switch (dateFilter) {
          case 'today':
            return taskDateStr === todayStr;
          case 'tomorrow':
            const tomorrow = addDays(today, 1);
            return taskDateStr === tomorrow.toDateString();
          case 'week':
            const weekFromNow = addDays(today, 7);
            return taskDate >= today && taskDate <= weekFromNow;
          case 'overdue':
            return taskDate < today && task.status !== 'Completato';
          default:
            return true;
        }
      });
    }

    // Search filter last (most expensive operation)
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.nome.toLowerCase().includes(query) ||
        task.descrizione?.toLowerCase().includes(query) ||
        task.note_richtext?.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, debouncedSearchQuery, statusFilter, dateFilter, selectedStatusFilters, showDeletedAppointments, userId]);

  // Create new task
  const createTask = async () => {
    if (!salonId || !userId) return;

    try {
      // Always assign the task to the current user
      const taskTeamId = currentUserTeamId || null;

      const newTask = {
        nome: formData.nome,
        descrizione: formData.descrizione,
        status: formData.status,
        data: formData.data,
        orarioInizio: formData.orarioInizio,
        orarioFine: formData.orarioFine,
        prezzo: formData.prezzo,
        note_richtext: formData.note_richtext, // Rich text content
        team_id: taskTeamId,
        user_id: userId,
        salon_id: salonId,
        created_at: new Date().toISOString(),
        // Campi specifici per task
        task: true,
        is_pausa: false,
        // Campi obbligatori per compatibilità con orders
        telefono: '', // Stringa vuota invece di null per evitare vincoli NOT NULL
        email: '', // Stringa vuota invece di null
        customer_uuid: null, // null per campi UUID opzionali
        prefer_card_style: 'default', // Valore di default
        alone: '1', // Valore di default
        booking_source: 'manual', // Valore di default
        color_card: [formData.color_card] // Converti in array come richiesto dalla tabella
      };

      console.log('Creating task with data:', newTask);

      const { data, error } = await supabase
        .from('orders')
        .insert([newTask])
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return;
      }

      console.log('Task created successfully:', data);
      setTasks(prev => [data, ...prev]);
      resetForm();
      setIsCreateModalOpen(false);
      setLastFetchTime(Date.now()); // Update cache timestamp
      
      // Dispatch task created event
      dispatchTaskEvent(TASK_EVENTS.CREATED, { taskId: data.id });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // Update task
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      // Filtra solo i campi che esistono nella tabella orders
      const validUpdates = {
        nome: updates.nome,
        descrizione: updates.descrizione,
        status: updates.status,
        data: updates.data,
        orarioInizio: updates.orarioInizio,
        orarioFine: updates.orarioFine,
        prezzo: updates.prezzo,
        note_richtext: updates.note_richtext,
        team_id: updates.team_id,
        color_card: updates.color_card
      };

      // Rimuovi i campi undefined
      const cleanUpdates = Object.fromEntries(
        Object.entries(validUpdates).filter(([_, value]) => value !== undefined)
      );

      const { error } = await supabase
        .from('orders')
        .update(cleanUpdates)
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task:', error);
        return;
      }

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...cleanUpdates } : task
      ));
      setLastFetchTime(Date.now()); // Update cache timestamp
      
      // Dispatch task updated event
      dispatchTaskEvent(TASK_EVENTS.UPDATED, { taskId });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Delete task (soft delete - set status to 'Eliminato')
  const deleteTask = async (taskId: string) => {
    try {
      // Find the task to check permissions
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found');
        return;
      }

      // Check if user has permission to delete this task
      if (task.user_id !== userId) {
        console.warn('User cannot delete task that doesn\'t belong to them');
        return;
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: 'Eliminato' })
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        return;
      }

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: 'Eliminato' } : task
      ));
      
      // Dispatch task deleted event
      dispatchTaskEvent(TASK_EVENTS.DELETED, { taskId });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = async (task: Task) => {
    // Check if user has permission to toggle this task
    if (task.user_id !== userId) {
      console.warn('User cannot toggle completion of task that doesn\'t belong to them');
      return;
    }

    const newStatus = task.status === 'Completato' ? 'In corso' : 'Completato';
    await updateTask(task.id, { 
      status: newStatus
    });
    
    // Dispatch task status changed event
    dispatchTaskEvent(TASK_EVENTS.STATUS_CHANGED, { taskId: task.id });
  };

  // Restore deleted task
  const restoreTask = async (taskId: string) => {
    try {
      // Find the task to check permissions
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found');
        return;
      }

      // Check if user has permission to restore this task
      if (task.user_id !== userId) {
        console.warn('User cannot restore task that doesn\'t belong to them');
        return;
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: 'In corso' })
        .eq('id', taskId);

      if (error) {
        console.error('Error restoring task:', error);
        return;
      }

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: 'In corso' } : task
      ));
      
      // Dispatch task status changed event
      dispatchTaskEvent(TASK_EVENTS.STATUS_CHANGED, { taskId });
    } catch (error) {
      console.error('Error restoring task:', error);
    }
  };

  // Permanently delete task
  const permanentlyDeleteTask = async (taskId: string) => {
    try {
      // Find the task to check permissions
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found');
        return;
      }

      // Check if user has permission to permanently delete this task
      if (task.user_id !== userId) {
        console.warn('User cannot permanently delete task that doesn\'t belong to them');
        return;
      }

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error permanently deleting task:', error);
        return;
      }

      // Remove from local state
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      // Dispatch task deleted event
      dispatchTaskEvent(TASK_EVENTS.DELETED, { taskId });
    } catch (error) {
      console.error('Error permanently deleting task:', error);
    }
  };



  // Reset form
  const resetForm = () => {
    setFormData({
      nome: '',
      descrizione: '',
      status: 'In corso', // Stato di default per i task
      data: format(new Date(), 'yyyy-MM-dd'),
      orarioInizio: '09:00',
      orarioFine: '10:00',
      prezzo: 0,
      note_richtext: '', // Reset rich text content
      color_card: '#3b82f6',
      task: true,
      team_id: currentUserTeamId || '' // Automatically set to current user's team
    });
  };

  // Open edit modal
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    
    // Check if user has permission to edit this task
    if (task.user_id !== userId) {
      console.warn('User cannot edit task that doesn\'t belong to them');
      return;
    }

    setFormData({
      nome: task.nome,
      descrizione: task.descrizione || '',
      status: task.status,
      data: task.data,
      orarioInizio: task.orarioInizio,
      orarioFine: task.orarioFine || '',
      prezzo: task.prezzo,
      note_richtext: task.note_richtext || '', // Load rich text content
      color_card: task.color_card?.[0] || '#3b82f6', // Prendi il primo elemento dell'array
      task: task.task,
      team_id: currentUserTeamId || '' // Always use current user's team
    });
    setIsEditModalOpen(true);
  };

  // Save edited task
  const saveEditedTask = async () => {
    if (!editingTask) return;

    try {
      // Check if user has permission to update this task
      if (editingTask.user_id !== userId) {
        console.warn('User cannot update task that doesn\'t belong to them');
        return;
      }

      const updateData = {
        ...formData,
        team_id: formData.team_id,
        color_card: [formData.color_card], // Converti in array
        note_richtext: formData.note_richtext, // Include rich text content
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', editingTask.id);

      if (error) {
        console.error('Error updating task:', error);
        return;
      }

      setTasks(prev => prev.map(task => 
        task.id === editingTask.id ? { 
          ...task, 
          nome: updateData.nome,
          descrizione: updateData.descrizione,
          status: updateData.status,
          data: updateData.data,
          orarioInizio: updateData.orarioInizio,
          orarioFine: updateData.orarioFine,
          prezzo: updateData.prezzo,
          note_richtext: updateData.note_richtext,
          team_id: updateData.team_id,
          color_card: updateData.color_card,
          updated_at: updateData.updated_at
        } : task
      ));

      setIsEditModalOpen(false);
      setEditingTask(null);
      resetForm();
      
      // Dispatch task updated event
      dispatchTaskEvent(TASK_EVENTS.UPDATED, { taskId: editingTask.id });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Force refresh tasks
  const refreshTasks = useCallback(async () => {
    if (salonId && userId) {
      await fetchTasks(salonId, userId, true); // Force refresh
    }
  }, [salonId, userId]);

  // Memoized utility functions for better performance
  const getStatusColor = useCallback((status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  }, [statusOptions]);

  // Memoized date display function
  const getDateDisplay = useCallback((date: string) => {
    const taskDate = parseISO(date);
    if (isToday(taskDate)) return 'Oggi';
    if (isTomorrow(taskDate)) return 'Domani';
    if (isYesterday(taskDate)) return 'Ieri';
    return format(taskDate, 'dd MMM yyyy', { locale: it });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-4 h-4 rounded-full bg-violet-600 animate-bounce"></div>
        </div>
        <p className="mt-4 text-sm text-gray-500">Caricamento task...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden text-gray-900" style={{ margin: 0, padding: 0 }}>
      {/* Navbar */}
      <NavbarSecondaria
        dailyViewDate={dailyViewDate}
        setDailyViewDate={setDailyViewDate}
        appointments={tasks.map(task => ({
          id: task.id,
          nome: task.nome,
          orarioInizio: task.orarioInizio,
          orarioFine: task.orarioFine || '',
          data: task.data,
          team_id: task.team_id || '',
          status: task.status
        }))}
        selectedStatusFilters={selectedStatusFilters}
        setSelectedStatusFilters={setSelectedStatusFilters}
        showDeletedAppointments={showDeletedAppointments}
        setShowDeletedAppointments={setShowDeletedAppointments}
        daysToShow={daysToShow}
        setDaysToShow={setDaysToShow}
        // Props for create task functionality
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        // Props for user permissions
        userRole={userRole}
        hasPermission={hasPermission}
        currentUserTeamId={currentUserTeamId}
      />

      {/* Main Content - Scrollable Area */}
      <div className="flex-1 overflow-auto" style={{ margin: 0, padding: 0 }}>
        <div className="container mx-auto max-w-6xl p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {showDeletedAppointments ? 'Task Eliminati' : 'Task Manager'}
              </h1>
              <p className="text-gray-600 mt-1">
                {showDeletedAppointments 
                  ? 'Visualizza e gestisci i task eliminati' 
                  : 'I tuoi task personali'
                }
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca task..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Data" />
                </SelectTrigger>
                <SelectContent>
                  {dateFilterOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-gray-400 mb-4">
                    {showDeletedAppointments ? (
                      <TrashCan className="h-12 w-12" />
                    ) : (
                      <CircleDash className="h-12 w-12" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {showDeletedAppointments ? 'Nessun task eliminato' : 'Nessun task trovato'}
                  </h3>
                  <p className="text-gray-500 text-center">
                    {showDeletedAppointments 
                      ? 'Non ci sono task eliminati da visualizzare'
                      : searchQuery || statusFilter !== 'all' || dateFilter !== 'all' 
                        ? 'Prova a modificare i filtri di ricerca'
                        : 'Non hai ancora task personali'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className={`transition-all duration-200 hover:shadow-md ${
                    task.status === 'Eliminato' ? 'bg-gray-50 border-gray-200' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 mt-1">
                        <Checkbox
                          checked={task.status === 'Completato'}
                          onCheckedChange={() => toggleTaskCompletion(task)}
                          disabled={task.status === 'Eliminato'}
                          className={`data-[state=checked]:bg-blue-600 ${
                            task.status === 'Eliminato' ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium ${
                              task.status === 'Eliminato' 
                                ? 'text-gray-500 line-through' 
                                : task.status === 'Completato' 
                                  ? 'line-through text-gray-500' 
                                  : 'text-gray-900'
                            }`}>
                              {task.nome}
                            </h3>
                            {task.descrizione && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {task.descrizione}
                              </p>
                            )}
                            {task.note_richtext && (
                              <div className="mt-2">
                                <RichTextViewer 
                                  content={task.note_richtext} 
                                  className="text-sm text-gray-600 line-clamp-3"
                                />
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Calendar className="h-3 w-3" />
                                <span>{getDateDisplay(task.data)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Time className="h-3 w-3" />
                                <span>{task.orarioInizio}</span>
                                {task.orarioFine && (
                                  <>
                                    <span className="text-gray-400">-</span>
                                    <span>{task.orarioFine}</span>
                                  </>
                                )}
                              </div>
                              {task.team_id && (
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <User className="h-3 w-3" />
                                  <span>
                                    {currentUserTeamId === task.team_id ? 'Tu' : 'Membro non trovato'}
                                  </span>
                                </div>
                              )}
                              {task.prezzo > 0 && (
                                <div className="text-sm font-medium text-green-600">
                                  €{task.prezzo.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                            
                            <div className="flex items-center gap-1">
                              {task.status === 'Eliminato' ? (
                                // Actions for deleted tasks
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => restoreTask(task.id)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <Renew className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => permanentlyDeleteTask(task.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <TrashCan className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                // Actions for active tasks
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditModal(task)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteTask(task.id)}
                                  >
                                    <TrashCan className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Edit Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-4xl bg-white border-0 shadow-2xl rounded-xl max-h-[90vh] flex flex-col">
              <DialogHeader className="pb-6 border-b border-gray-100 flex-shrink-0">
                <DialogTitle className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Edit className="h-5 w-5 text-blue-600" />
                  </div>
                  Modifica Task
                </DialogTitle>
              </DialogHeader>
              <div className="py-6 px-8 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <StarFilled className="h-4 w-4 text-blue-600" />
                      Nome Task
                    </label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Inserisci il nome del task"
                      className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      Data
                    </label>
                    <Input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                      className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-purple-600" />
                    Descrizione
                  </label>
                  <Textarea
                    value={formData.descrizione}
                    onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                    placeholder="Descrizione del task"
                    rows={3}
                    className="border-gray-200 focus:border-black focus:ring-black focus:ring-2 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Time className="h-4 w-4 text-orange-600" />
                      Ora Inizio
                    </label>
                    <Select
                      value={formData.orarioInizio}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, orarioInizio: value }))}
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2">
                        <SelectValue placeholder="Seleziona ora" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(slot => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Time className="h-4 w-4 text-red-600" />
                      Ora Fine
                    </label>
                    <Select
                      value={formData.orarioFine}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, orarioFine: value }))}
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2">
                        <SelectValue placeholder="Seleziona ora" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(slot => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="text-green-600 font-bold">€</span>
                      Prezzo
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.prezzo}
                      onChange={(e) => setFormData(prev => ({ ...prev, prezzo: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Checkmark className="h-4 w-4 text-emerald-600" />
                      Stato
                    </label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-blue-600">✨</span>
                    Note Rich Text
                  </label>
                  <RichTextEditor
                    value={formData.note_richtext}
                    onChange={(value) => setFormData(prev => ({ ...prev, note_richtext: value }))}
                    placeholder="Inizia a scrivere con formattazione..."
                    className="border-gray-200 focus-within:border-black focus-within:ring-black focus-within:ring-2"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 flex-shrink-0">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Annulla
                </Button>
                <Button 
                  onClick={saveEditedTask} 
                  disabled={!formData.nome}
                  className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Salva Modifiche
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create Task Modal */}
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogContent className="max-w-4xl bg-white border-0 shadow-2xl rounded-xl max-h-[90vh] flex flex-col">
              <DialogHeader className="pb-6 border-b border-gray-100 flex-shrink-0">
                <DialogTitle className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Add className="h-5 w-5 text-emerald-600" />
                  </div>
                  Crea Nuovo Task
                </DialogTitle>
              </DialogHeader>
              <div className="py-6 px-8 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <StarFilled className="h-4 w-4 text-blue-600" />
                      Nome Task
                    </label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Inserisci il nome del task"
                      className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      Data
                    </label>
                    <Input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                      className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-purple-600" />
                    Descrizione
                  </label>
                  <Textarea
                    value={formData.descrizione}
                    onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                    placeholder="Descrizione del task"
                    rows={3}
                    className="border-gray-200 focus:border-black focus:ring-black focus:ring-2 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Time className="h-4 w-4 text-orange-600" />
                      Ora Inizio
                    </label>
                    <Select
                      value={formData.orarioInizio}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, orarioInizio: value }))}
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2">
                        <SelectValue placeholder="Seleziona ora" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(slot => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Time className="h-4 w-4 text-red-600" />
                      Ora Fine
                    </label>
                    <Select
                      value={formData.orarioFine}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, orarioFine: value }))}
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2">
                        <SelectValue placeholder="Seleziona ora" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(slot => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="text-green-600 font-bold">€</span>
                      Prezzo
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.prezzo}
                      onChange={(e) => setFormData(prev => ({ ...prev, prezzo: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Checkmark className="h-4 w-4 text-emerald-600" />
                      Stato
                    </label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="h-12 border-gray-200 focus:border-black focus:ring-black focus:ring-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-blue-600">✨</span>
                    Note Rich Text
                  </label>
                  <RichTextEditor
                    value={formData.note_richtext}
                    onChange={(value) => setFormData(prev => ({ ...prev, note_richtext: value }))}
                    placeholder="Inizia a scrivere con formattazione..."
                    className="border-gray-200 focus-within:border-black focus-within:ring-black focus-within:ring-2"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 flex-shrink-0">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Annulla
                </Button>
                <Button 
                  onClick={createTask} 
                  disabled={!formData.nome}
                  className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Crea Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

// Next.js page component wrapper
export default function TaskManagerPage({ params, searchParams }: PageProps) {
  return <TaskManagerComponent />;
}

