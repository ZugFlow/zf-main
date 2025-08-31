import React, { useState, useEffect, createContext, useContext } from 'react'

export type Language = 'it' | 'en'

interface LocalizationContextType {
  currentLanguage: Language
  setLanguage: (lang: Language) => void
  t: (key: string, defaultValue?: string) => string
  formatDate: (date: Date | string) => string
  formatNumber: (number: number) => string
  formatCurrency: (amount: number) => string
  formatTime: (date: Date | string) => string
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined)

export function useLocalization() {
  const context = useContext(LocalizationContext)
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider')
  }
  return context
}

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('it')

  const t = (key: string, defaultValue: string = '') => {
    const texts = {
      // Navigazione
      'nav.dashboard': currentLanguage === 'en' ? 'Dashboard' : 'Dashboard',
      'nav.appointments': currentLanguage === 'en' ? 'Appointments' : 'Appuntamenti',
      'nav.clients': currentLanguage === 'en' ? 'Clients' : 'Clienti',
      'nav.services': currentLanguage === 'en' ? 'Services' : 'Servizi',
      'nav.finances': currentLanguage === 'en' ? 'Finances' : 'Finanze',
      'nav.settings': currentLanguage === 'en' ? 'Settings' : 'Impostazioni',
      'nav.online_bookings': currentLanguage === 'en' ? 'Online Bookings' : 'Prenotazioni Online',
      'nav.task_manager': currentLanguage === 'en' ? 'Task Manager' : 'Gestione Task',
      'nav.holidays': currentLanguage === 'en' ? 'Holidays & Permissions' : 'Permessi e Ferie',
      'nav.profile': currentLanguage === 'en' ? 'User Profile' : 'Profilo Utente',

      // Azioni comuni
      'action.save': currentLanguage === 'en' ? 'Save' : 'Salva',
      'action.cancel': currentLanguage === 'en' ? 'Cancel' : 'Annulla',
      'action.edit': currentLanguage === 'en' ? 'Edit' : 'Modifica',
      'action.delete': currentLanguage === 'en' ? 'Delete' : 'Elimina',
      'action.confirm': currentLanguage === 'en' ? 'Confirm' : 'Conferma',
      'action.close': currentLanguage === 'en' ? 'Close' : 'Chiudi',
      'action.back': currentLanguage === 'en' ? 'Back' : 'Indietro',
      'action.next': currentLanguage === 'en' ? 'Next' : 'Avanti',
      'action.search': currentLanguage === 'en' ? 'Search' : 'Cerca',
      'action.filter': currentLanguage === 'en' ? 'Filter' : 'Filtra',
      'action.refresh': currentLanguage === 'en' ? 'Refresh' : 'Aggiorna',
      'action.saving': currentLanguage === 'en' ? 'Saving...' : 'Salvando...',
      'action.deleting': currentLanguage === 'en' ? 'Deleting...' : 'Eliminando...',
      'action.delete_confirm': currentLanguage === 'en' ? 'Yes, Delete' : 'Si, Elimina',

      // Stati
      'status.active': currentLanguage === 'en' ? 'Active' : 'Attivo',
      'status.inactive': currentLanguage === 'en' ? 'Inactive' : 'Inattivo',
      'status.pending': currentLanguage === 'en' ? 'Pending' : 'In attesa',
      'status.confirmed': currentLanguage === 'en' ? 'Confirmed' : 'Confermato',
      'status.cancelled': currentLanguage === 'en' ? 'Cancelled' : 'Annullato',
      'status.completed': currentLanguage === 'en' ? 'Completed' : 'Completato',
      'status.error': currentLanguage === 'en' ? 'Error' : 'Errore',
      'status.success': currentLanguage === 'en' ? 'Success' : 'Successo',
      'status.loading': currentLanguage === 'en' ? 'Loading...' : 'Caricamento...',

      // Messaggi
      'message.loading': currentLanguage === 'en' ? 'Loading...' : 'Caricamento...',
      'message.no_data': currentLanguage === 'en' ? 'No data available' : 'Nessun dato disponibile',
      'message.error_loading': currentLanguage === 'en' ? 'Error loading data' : 'Errore nel caricamento dei dati',
      'message.save_success': currentLanguage === 'en' ? 'Saved successfully' : 'Salvato con successo',
      'message.save_error': currentLanguage === 'en' ? 'Error saving' : 'Errore nel salvataggio',
      'message.delete_success': currentLanguage === 'en' ? 'Deleted successfully' : 'Eliminato con successo',
      'message.delete_error': currentLanguage === 'en' ? 'Error deleting' : 'Errore nell\'eliminazione',
      'message.confirm_delete': currentLanguage === 'en' ? 'Are you sure you want to delete this item?' : 'Sei sicuro di voler eliminare questo elemento?',
      'message.unsaved_changes': currentLanguage === 'en' ? 'You have unsaved changes. Do you want to continue?' : 'Hai modifiche non salvate. Vuoi continuare?',

      // Form
      'form.required': currentLanguage === 'en' ? 'Required field' : 'Campo obbligatorio',
      'form.invalid_email': currentLanguage === 'en' ? 'Invalid email' : 'Email non valida',
      'form.invalid_phone': currentLanguage === 'en' ? 'Invalid phone number' : 'Telefono non valido',
      'form.invalid_date': currentLanguage === 'en' ? 'Invalid date' : 'Data non valida',
      'form.invalid_time': currentLanguage === 'en' ? 'Invalid time' : 'Orario non valido',
      'form.min_length': currentLanguage === 'en' ? 'Minimum {min} characters' : 'Minimo {min} caratteri',
      'form.max_length': currentLanguage === 'en' ? 'Maximum {max} characters' : 'Massimo {max} caratteri',

      // Date e tempo
      'date.today': currentLanguage === 'en' ? 'Today' : 'Oggi',
      'date.yesterday': currentLanguage === 'en' ? 'Yesterday' : 'Ieri',
      'date.tomorrow': currentLanguage === 'en' ? 'Tomorrow' : 'Domani',
      'date.this_week': currentLanguage === 'en' ? 'This week' : 'Questa settimana',
      'date.last_week': currentLanguage === 'en' ? 'Last week' : 'Scorsa settimana',
      'date.this_month': currentLanguage === 'en' ? 'This month' : 'Questo mese',
      'date.last_month': currentLanguage === 'en' ? 'Last month' : 'Scorso mese',
      'date.this_year': currentLanguage === 'en' ? 'This year' : 'Quest\'anno',
      'date.last_year': currentLanguage === 'en' ? 'Last year' : 'Scorso anno',

      // Giorni della settimana
      'day.monday': currentLanguage === 'en' ? 'Monday' : 'Lunedì',
      'day.tuesday': currentLanguage === 'en' ? 'Tuesday' : 'Martedì',
      'day.wednesday': currentLanguage === 'en' ? 'Wednesday' : 'Mercoledì',
      'day.thursday': currentLanguage === 'en' ? 'Thursday' : 'Giovedì',
      'day.friday': currentLanguage === 'en' ? 'Friday' : 'Venerdì',
      'day.saturday': currentLanguage === 'en' ? 'Saturday' : 'Sabato',
      'day.sunday': currentLanguage === 'en' ? 'Sunday' : 'Domenica',

      // Mesi
      'month.january': currentLanguage === 'en' ? 'January' : 'Gennaio',
      'month.february': currentLanguage === 'en' ? 'February' : 'Febbraio',
      'month.march': currentLanguage === 'en' ? 'March' : 'Marzo',
      'month.april': currentLanguage === 'en' ? 'April' : 'Aprile',
      'month.may': currentLanguage === 'en' ? 'May' : 'Maggio',
      'month.june': currentLanguage === 'en' ? 'June' : 'Giugno',
      'month.july': currentLanguage === 'en' ? 'July' : 'Luglio',
      'month.august': currentLanguage === 'en' ? 'August' : 'Agosto',
      'month.september': currentLanguage === 'en' ? 'September' : 'Settembre',
      'month.october': currentLanguage === 'en' ? 'October' : 'Ottobre',
      'month.november': currentLanguage === 'en' ? 'November' : 'Novembre',
      'month.december': currentLanguage === 'en' ? 'December' : 'Dicembre',

      // Profilo
      'profile.description': currentLanguage === 'en' ? 'Manage your profile information and account security' : 'Gestisci le informazioni del tuo profilo e la sicurezza dell\'account',

      // Clienti
      'clients.search_placeholder': currentLanguage === 'en' ? 'Search clients...' : 'Cerca clienti...',
      'clients.loading': currentLanguage === 'en' ? 'Loading clients...' : 'Caricamento clienti...',
      'clients.select_client_message': currentLanguage === 'en' ? 'Select a client to view details' : 'Seleziona un cliente per visualizzare i dettagli',
      
      // Tab clienti
      'clients.tabs.statistics': currentLanguage === 'en' ? 'Statistics' : 'Statistiche',
      'clients.tabs.appointments': currentLanguage === 'en' ? 'Appointments' : 'Appuntamenti',
      'clients.tabs.info': currentLanguage === 'en' ? 'Info' : 'Info',
      'clients.tabs.analysis': currentLanguage === 'en' ? 'Analysis' : 'Analisi',
      'clients.tabs.billing': currentLanguage === 'en' ? 'Billing' : 'Fatturazione',
      'clients.tabs.address': currentLanguage === 'en' ? 'Address' : 'Indirizzo',
      'clients.tabs.payment': currentLanguage === 'en' ? 'Payment' : 'Pagamento',
      
      // Statistiche clienti
      'clients.statistics.title': currentLanguage === 'en' ? 'Client Statistics' : 'Statistiche Cliente',
      'clients.statistics.month': currentLanguage === 'en' ? 'Month' : 'Mese',
      'clients.statistics.year': currentLanguage === 'en' ? 'Year' : 'Anno',
      'clients.statistics.total_expenses': currentLanguage === 'en' ? 'Total Expenses' : 'Spese totali',
      'clients.statistics.yearly_expenses': currentLanguage === 'en' ? 'Expenses' : 'Spese',
      'clients.statistics.yearly_appointments': currentLanguage === 'en' ? 'Appointments' : 'Appuntamenti',
      'clients.statistics.monthly_expenses': currentLanguage === 'en' ? 'Expenses' : 'Spese',
      'clients.statistics.monthly_appointments': currentLanguage === 'en' ? 'Monthly Appointments' : 'Appuntamenti mese selezionato',
      
      // Appuntamenti clienti
      'clients.appointments.history': currentLanguage === 'en' ? 'Appointment History' : 'Cronologia Appuntamenti',
      'clients.appointments.services': currentLanguage === 'en' ? 'Services' : 'Servizi',
      'clients.appointments.status': currentLanguage === 'en' ? 'Status' : 'Stato',
      'clients.appointments.not_specified': currentLanguage === 'en' ? 'Not specified' : 'Non specificato',
      'clients.appointments.no_appointments': currentLanguage === 'en' ? 'No appointments available.' : 'Nessun appuntamento disponibile.',
      
      // Info clienti
      'clients.info.notes': currentLanguage === 'en' ? 'Notes' : 'Note',
      'clients.info.no_notes': currentLanguage === 'en' ? 'No notes' : 'Nessuna nota',
      'clients.info.description': currentLanguage === 'en' ? 'Description' : 'Descrizione',
      'clients.info.no_description': currentLanguage === 'en' ? 'No description' : 'Nessuna descrizione',
      'clients.info.assigned_coupon': currentLanguage === 'en' ? 'Assigned Coupon' : 'Coupon Abbinato',
      'clients.info.no_coupon': currentLanguage === 'en' ? 'No coupon assigned' : 'Nessun coupon abbinato',
      'clients.info.client_tags': currentLanguage === 'en' ? 'Client Tags' : 'Tag Cliente',
      'clients.info.manage_tags': currentLanguage === 'en' ? 'Manage Tags' : 'Gestisci Tag',
      'clients.info.no_tags': currentLanguage === 'en' ? 'No tags' : 'Nessun tag',
      
      // Errori clienti
      'clients.error.salon_not_found': currentLanguage === 'en' ? 'Unable to determine salon. Please try again later.' : 'Impossibile determinare il salone. Riprova più tardi.',
      'clients.error.add_failed': currentLanguage === 'en' ? 'Unable to add client. Please try again later.' : 'Non è stato possibile aggiungere il cliente. Riprova più tardi.',
      'clients.error.delete_failed': currentLanguage === 'en' ? 'Unable to delete client. Please try again later.' : 'Non è stato possibile eliminare il cliente. Riprova più tardi.',
      
      // Successi clienti
      'clients.success.added': currentLanguage === 'en' ? 'Client Added' : 'Cliente aggiunto',
      'clients.success.added_description': currentLanguage === 'en' ? 'Client has been added successfully.' : 'Il cliente è stato aggiunto con successo.',
      'clients.success.deleted': currentLanguage === 'en' ? 'Client Deleted' : 'Cliente eliminato',
      'clients.success.deleted_description': currentLanguage === 'en' ? 'Client has been deleted successfully.' : 'Il cliente è stato eliminato con successo.',
      
      // Tag clienti
      'clients.tags.limit_reached': currentLanguage === 'en' ? 'Tag Limit Reached' : 'Limite tag raggiunto',
      'clients.tags.max_limit': currentLanguage === 'en' ? 'You can select maximum 5 tags per client' : 'Puoi selezionare massimo 5 tag per cliente',
      'clients.tags.update_error': currentLanguage === 'en' ? 'Unable to update tags: ' : 'Impossibile aggiornare i tag: ',
      'clients.tags.updated_success': currentLanguage === 'en' ? 'Tags updated successfully' : 'Tag aggiornati con successo',
      'clients.tags.general_error': currentLanguage === 'en' ? 'General error updating tags' : 'Errore generale nell\'aggiornamento dei tag',
      
      // Dialog clienti
      'clients.dialog.new_client_title': currentLanguage === 'en' ? 'New Client' : 'Nuovo Cliente',
      'clients.dialog.new_client_description': currentLanguage === 'en' ? 'Fill out the form to add a new client.' : 'Compila il modulo per aggiungere un nuovo cliente.',
      'clients.dialog.recommended_action': currentLanguage === 'en' ? 'Recommended action for client' : 'Azione consigliata per il cliente',
      'clients.dialog.action_description': currentLanguage === 'en' ? 'Action Description' : 'Descrizione Azione',
      'clients.dialog.operational_tips': currentLanguage === 'en' ? 'Operational Tips' : 'Consigli Operativi',
      'clients.dialog.goals_metrics': currentLanguage === 'en' ? 'Goals and Metrics' : 'Obiettivi e Metriche',
      'clients.dialog.objective': currentLanguage === 'en' ? 'Objective' : 'Obiettivo',
      'clients.dialog.kpi_to_monitor': currentLanguage === 'en' ? 'KPI to monitor' : 'KPI da monitorare',
      
      // Obiettivi dialog
      'clients.dialog.objective_whatsapp': currentLanguage === 'en' ? 'Restore relationship and get a booking' : 'Ripristinare la relazione e ottenere una prenotazione',
      'clients.dialog.objective_book': currentLanguage === 'en' ? 'Create a new booking within 7 days' : 'Creare una nuova prenotazione entro 7 giorni',
      'clients.dialog.objective_package': currentLanguage === 'en' ? 'Sell a package within 30 days' : 'Vendere un pacchetto entro 30 giorni',
      'clients.dialog.objective_vip': currentLanguage === 'en' ? 'Increase frequency and average value' : 'Aumentare la frequenza e il valore medio',
      'clients.dialog.objective_reminder': currentLanguage === 'en' ? 'Reduce no-shows by 50%' : 'Ridurre i no-show del 50%',
      'clients.dialog.objective_exclusive': currentLanguage === 'en' ? 'Increase satisfaction and loyalty' : 'Aumentare la soddisfazione e fidelizzazione',
      'clients.dialog.objective_retention': currentLanguage === 'en' ? 'Avoid client loss' : 'Evitare la perdita del cliente',
      'clients.dialog.objective_default': currentLanguage === 'en' ? 'Improve client relationship' : 'Migliorare la relazione cliente',
      
      // KPI dialog
      'clients.dialog.kpi_whatsapp': currentLanguage === 'en' ? 'Response rate and conversion' : 'Tasso di risposta e conversione',
      'clients.dialog.kpi_book': currentLanguage === 'en' ? 'Created and completed bookings' : 'Prenotazioni create e completate',
      'clients.dialog.kpi_package': currentLanguage === 'en' ? 'Packages sold and revenue' : 'Pacchetti venduti e fatturato',
      'clients.dialog.kpi_vip': currentLanguage === 'en' ? 'Visit frequency and average value' : 'Frequenza visite e valore medio',
      'clients.dialog.kpi_reminder': currentLanguage === 'en' ? 'Appointment attendance rate' : 'Tasso di presenza agli appuntamenti',
      'clients.dialog.kpi_exclusive': currentLanguage === 'en' ? 'Satisfaction and service renewal' : 'Soddisfazione e rinnovo servizi',
      'clients.dialog.kpi_retention': currentLanguage === 'en' ? 'Client return within 30 days' : 'Ritorno del cliente entro 30 giorni',
      'clients.dialog.kpi_default': currentLanguage === 'en' ? 'General satisfaction' : 'Soddisfazione generale',

      // Servizi
      'services.loading': currentLanguage === 'en' ? 'Loading...' : 'Caricamento...',
      'services.management.title': currentLanguage === 'en' ? 'Service Management' : 'Gestione Servizi',
      'services.select_service_message': currentLanguage === 'en' ? 'Select a service to view details' : 'Seleziona un servizio per visualizzare i dettagli',
      
      // Filtri servizi
      'services.filters.all_categories': currentLanguage === 'en' ? 'All categories' : 'Tutte le categorie',
      'services.filters.filter_by_category': currentLanguage === 'en' ? 'Filter by category' : 'Filtra per categoria',
      'services.filters.select_category_description': currentLanguage === 'en' ? 'Select a category to filter services' : 'Seleziona una categoria per filtrare i servizi',
      
      // Ricerca servizi
      'services.search.placeholder': currentLanguage === 'en' ? 'Search services...' : 'Cerca servizi...',
      
      // Azioni servizi
      'services.actions.new_service': currentLanguage === 'en' ? 'New Service' : 'Nuovo Servizio',
      'services.actions.new_category': currentLanguage === 'en' ? 'New Category' : 'Nuova Categoria',
      'services.actions.settings': currentLanguage === 'en' ? 'Settings' : 'Impostazioni',
      'services.actions.edit_service': currentLanguage === 'en' ? 'Edit service' : 'Modifica servizio',
      'services.actions.delete_service': currentLanguage === 'en' ? 'Delete service' : 'Elimina servizio',
      'services.actions.saving': currentLanguage === 'en' ? 'Saving...' : 'Salvataggio...',
      'services.actions.creating': currentLanguage === 'en' ? 'Creating...' : 'Creazione...',
      'services.actions.create': currentLanguage === 'en' ? 'Create' : 'Crea',
      'services.actions.edit_category': currentLanguage === 'en' ? 'Edit category' : 'Modifica categoria',
      'services.actions.delete_category': currentLanguage === 'en' ? 'Delete category' : 'Elimina categoria',
      
      // Categorie servizi
      'services.category.services_count': currentLanguage === 'en' ? 'services' : 'servizi',
      'services.category.no_category': currentLanguage === 'en' ? 'No category' : 'Senza categoria',
      'services.category.no_categories_available': currentLanguage === 'en' ? 'No categories available' : 'Nessuna categoria disponibile',
      'services.category.change_category': currentLanguage === 'en' ? 'Change category' : 'Cambia categoria',
      'services.category.select_or_create': currentLanguage === 'en' ? 'Select an existing category or create a new one' : 'Seleziona una categoria esistente o creane una nuova',
      'services.category.new_category': currentLanguage === 'en' ? 'New category' : 'Nuova categoria',
      'services.category.cannot_edit_with_services': currentLanguage === 'en' ? 'Cannot edit: {count} service(s) associated' : 'Impossibile modificare: {count} servizio associato',
      'services.category.cannot_delete_with_services': currentLanguage === 'en' ? 'Cannot delete: {count} service(s) associated' : 'Impossibile eliminare: {count} servizio associato',
      
      // Dettagli servizi
      'services.details.service_details': currentLanguage === 'en' ? 'Service Details' : 'Dettagli Servizio',
      'services.details.no_description': currentLanguage === 'en' ? 'No description available' : 'Nessuna descrizione disponibile',
      'services.details.main_info': currentLanguage === 'en' ? 'Main Information' : 'Informazioni Principali',
      'services.details.duration': currentLanguage === 'en' ? 'Duration' : 'Durata',
      'services.details.price': currentLanguage === 'en' ? 'Price' : 'Prezzo',
      'services.details.category': currentLanguage === 'en' ? 'Category' : 'Categoria',
      'services.details.status': currentLanguage === 'en' ? 'Status' : 'Stato',
      'services.details.date_added': currentLanguage === 'en' ? 'Date Added' : 'Data Aggiunta',
      'services.details.promotion': currentLanguage === 'en' ? 'Promotion' : 'Promozione',
      'services.details.active': currentLanguage === 'en' ? 'Active' : 'Attiva',
      'services.details.minutes': currentLanguage === 'en' ? 'm' : 'm',
      
      // Modali servizi
      'services.modals.new_category_title': currentLanguage === 'en' ? 'New Category' : 'Nuova Categoria',
      'services.modals.category_name_placeholder': currentLanguage === 'en' ? 'Category name' : 'Nome categoria',
      'services.modals.category_management_title': currentLanguage === 'en' ? 'Category Management' : 'Gestione Categorie',
      'services.modals.create_new_category': currentLanguage === 'en' ? 'Create New Category' : 'Crea Nuova Categoria',
      'services.modals.category_examples_placeholder': currentLanguage === 'en' ? 'Ex. Cut, Color, Styling...' : 'Es. Taglio, Colore, Styling...',
      'services.modals.existing_categories': currentLanguage === 'en' ? 'Existing Categories' : 'Categorie Esistenti',
      'services.modals.no_categories_created': currentLanguage === 'en' ? 'No categories created' : 'Nessuna categoria creata',
      'services.modals.create_first_category': currentLanguage === 'en' ? 'Create your first category to organize services' : 'Crea la tua prima categoria per organizzare i servizi',
      'services.modals.category_warning': currentLanguage === 'en' ? 'Categories with associated services cannot be modified or deleted. Remove services from the category first.' : 'Le categorie con servizi associati non possono essere modificate o eliminate. Rimuovi prima i servizi dalla categoria.',
      
      // Validazione servizi
      'services.validation.min_2_chars': currentLanguage === 'en' ? 'Minimum 2 characters' : 'Minimo 2 caratteri',
      'services.validation.max_30_chars': currentLanguage === 'en' ? 'Maximum 30 characters' : 'Massimo 30 caratteri',
      'services.validation.name_required': currentLanguage === 'en' ? 'Name is required' : 'Il nome è obbligatorio',

      // Permessi e Ferie
      'permessi.loading': currentLanguage === 'en' ? 'Loading...' : 'Caricamento...',
      'permessi.error_salon_not_found': currentLanguage === 'en' ? 'Error: Salon not found' : 'Errore: Salone non trovato',
      'permessi.cannot_identify_salon': currentLanguage === 'en' ? 'Cannot identify the salon. Please try again later.' : 'Impossibile identificare il salone. Riprova più tardi.',
      'permessi.error_loading_members': currentLanguage === 'en' ? 'Error loading members' : 'Errore nel caricamento membri',
      'permessi.cannot_load_team_members': currentLanguage === 'en' ? 'Cannot load team members. Please try again later.' : 'Impossibile caricare i membri del team. Riprova più tardi.',
      'permessi.error_loading_permissions': currentLanguage === 'en' ? 'Error loading permissions' : 'Errore nel caricamento permessi',
      'permessi.cannot_load_permissions': currentLanguage === 'en' ? 'Cannot load permissions. Please try again later.' : 'Impossibile caricare i permessi. Riprova più tardi.',
      'permessi.unknown_member': currentLanguage === 'en' ? 'Unknown member' : 'Membro sconosciuto',
      'permessi.attention': currentLanguage === 'en' ? 'Attention' : 'Attenzione',
      'permessi.cannot_load_work_hours': currentLanguage === 'en' ? 'Cannot load work hours. Please try again later.' : 'Impossibile caricare le ore lavorate. Riprova più tardi.',
      'permessi.error_loading_data': currentLanguage === 'en' ? 'Error loading data' : 'Errore nel caricamento dati',
      'permessi.cannot_load_data': currentLanguage === 'en' ? 'Cannot load data. Please try again later.' : 'Impossibile caricare i dati. Riprova più tardi.',
      
      // Realtime updates
      'permessi.new_permission_created': currentLanguage === 'en' ? 'New permission created' : 'Nuovo permesso creato',
      'permessi.permission_updated': currentLanguage === 'en' ? 'Permission updated' : 'Permesso aggiornato',
      'permessi.permission_deleted': currentLanguage === 'en' ? 'Permission deleted' : 'Permesso eliminato',
      'permessi.realtime_update': currentLanguage === 'en' ? 'Real-time update' : 'Aggiornamento in tempo reale',
      'permessi.new_member_added': currentLanguage === 'en' ? 'New member added' : 'Nuovo membro aggiunto',
      'permessi.member_updated': currentLanguage === 'en' ? 'Member updated' : 'Membro aggiornato',
      'permessi.member_removed': currentLanguage === 'en' ? 'Member removed' : 'Membro rimosso',
      'permessi.team_update': currentLanguage === 'en' ? 'Team update' : 'Aggiornamento team',
      
      // User authentication
      'permessi.user_not_authenticated': currentLanguage === 'en' ? 'User not authenticated' : 'Utente non autenticato',
      'permessi.permission_not_found': currentLanguage === 'en' ? 'Permission not found' : 'Permesso non trovato',
      
      // Permission creation
      'permessi.error_creating_permission': currentLanguage === 'en' ? 'Error creating permission' : 'Errore nella creazione permesso',
      'permessi.create_only_for_yourself': currentLanguage === 'en' ? 'You can only create permissions for yourself' : 'Puoi creare permessi solo per te stesso',
      'permessi.fill_required_fields': currentLanguage === 'en' ? 'Fill all required fields' : 'Compila tutti i campi obbligatori',
      'permessi.member_not_found': currentLanguage === 'en' ? 'Member not found' : 'Membro non trovato',
      'permessi.cannot_create_permission': currentLanguage === 'en' ? 'Cannot create permission. Please try again later.' : 'Impossibile creare il permesso. Riprova più tardi.',
      'permessi.success': currentLanguage === 'en' ? 'Success' : 'Successo',
      'permessi.permission_created_success': currentLanguage === 'en' ? 'Permission created successfully' : 'Permesso creato con successo',
      
      // Permission updates
      'permessi.error_updating_permission': currentLanguage === 'en' ? 'Error updating permission' : 'Errore nell\'aggiornamento permesso',
      'permessi.only_managers_approve': currentLanguage === 'en' ? 'Only managers can approve/reject permissions' : 'Solo i manager possono approvare/rifiutare permessi',
      'permessi.cannot_approve_own': currentLanguage === 'en' ? 'You cannot approve/reject your own permissions' : 'Non puoi approvare/rifiutare i tuoi permessi',
      'permessi.cannot_update_permission': currentLanguage === 'en' ? 'Cannot update permission. Please try again later.' : 'Impossibile aggiornare il permesso. Riprova più tardi.',
      'permessi.permission_approved_success': currentLanguage === 'en' ? 'Permission approved successfully' : 'Permesso approvato con successo',
      'permessi.permission_rejected_success': currentLanguage === 'en' ? 'Permission rejected successfully' : 'Permesso rifiutato con successo',
      
      // Permission deletion
      'permessi.error_deleting_permission': currentLanguage === 'en' ? 'Error deleting permission' : 'Errore nell\'eliminazione permesso',
      'permessi.cannot_delete_others': currentLanguage === 'en' ? 'You cannot delete other users\' permissions' : 'Non puoi eliminare i permessi di altri utenti',
      'permessi.cannot_delete_approved': currentLanguage === 'en' ? 'You cannot delete already approved/rejected permissions' : 'Non puoi eliminare permessi già approvati/rifiutati',
      'permessi.permission_deleted_success': currentLanguage === 'en' ? 'Permission deleted successfully' : 'Permesso eliminato con successo',
      'permessi.cannot_delete_permission': currentLanguage === 'en' ? 'Cannot delete permission. Please try again later.' : 'Impossibile eliminare il permesso. Riprova più tardi.',
      
      // Permission archiving
      'permessi.error_archiving_permission': currentLanguage === 'en' ? 'Error archiving permission' : 'Errore nell\'archiviazione permesso',
      'permessi.cannot_archive_pending': currentLanguage === 'en' ? 'You cannot archive pending permissions' : 'Non puoi archiviare permessi in attesa',
      'permessi.permission_archived_success': currentLanguage === 'en' ? 'Permission archived successfully' : 'Permesso archiviato con successo',
      'permessi.cannot_archive_permission': currentLanguage === 'en' ? 'Cannot archive permission. Please try again later.' : 'Impossibile archiviare il permesso. Riprova più tardi.',
      
      // Permission restoration
      'permessi.error_restoring_permission': currentLanguage === 'en' ? 'Error restoring permission' : 'Errore nel ripristino permesso',
      'permessi.permission_restored_success': currentLanguage === 'en' ? 'Permission restored successfully' : 'Permesso ripristinato con successo',
      'permessi.cannot_restore_permission': currentLanguage === 'en' ? 'Cannot restore permission. Please try again later.' : 'Impossibile ripristinare il permesso. Riprova più tardi.',
      
      // Permission editing
      'permessi.cannot_edit_others': currentLanguage === 'en' ? 'You cannot edit other users\' permissions' : 'Non puoi modificare i permessi di altri utenti',
      'permessi.cannot_edit_approved': currentLanguage === 'en' ? 'You cannot edit already approved/rejected permissions' : 'Non puoi modificare permessi già approvati/rifiutati',
      'permessi.cannot_edit_own_status': currentLanguage === 'en' ? 'You cannot edit the status of your own permissions' : 'Non puoi modificare lo stato dei tuoi permessi',
      'permessi.permission_updated_success': currentLanguage === 'en' ? 'Permission updated successfully' : 'Permesso aggiornato con successo',
      
      // UI notifications
      'permessi.export': currentLanguage === 'en' ? 'Export' : 'Esportazione',
      'permessi.export_in_development': currentLanguage === 'en' ? 'Export functionality in development' : 'Funzionalità di esportazione in sviluppo',
      'permessi.test_realtime': currentLanguage === 'en' ? 'Test realtime connection' : 'Test connessione realtime',
      'permessi.check_console_logs': currentLanguage === 'en' ? 'Check console logs' : 'Controlla i log della console',
      'permessi.desktop_mode': currentLanguage === 'en' ? 'Desktop mode' : 'Modalità desktop',
      'permessi.mobile_mode': currentLanguage === 'en' ? 'Mobile mode' : 'Modalità mobile',
      'permessi.switched_to_desktop': currentLanguage === 'en' ? 'Switched to desktop mode' : 'Passato alla modalità desktop',
      'permessi.switched_to_mobile': currentLanguage === 'en' ? 'Switched to mobile mode' : 'Passato alla modalità mobile',

      // Componenti Permessi e Ferie
      'permessi.title': currentLanguage === 'en' ? 'Permissions & Holidays' : 'Permessi & Ferie',
      'permessi.permissions_count': currentLanguage === 'en' ? 'permissions' : 'permessi',
      'permessi.show_archived': currentLanguage === 'en' ? 'Show archived' : 'Mostra archiviati',
      'permessi.show_active': currentLanguage === 'en' ? 'Show active' : 'Mostra attivi',
      'permessi.archived_description': currentLanguage === 'en' ? 'Viewing archived permissions. Archived permissions are approved or rejected permissions that have been moved to the archive to keep the active list cleaner.' : 'Visualizzazione dei permessi archiviati. I permessi archiviati sono quelli approvati o rifiutati che sono stati spostati nell\'archivio per mantenere la lista attiva più pulita.',
      
      // Filtri
      'permessi.filters.title': currentLanguage === 'en' ? 'Filters' : 'Filtri',
      'permessi.filters.reset': currentLanguage === 'en' ? 'Reset' : 'Reimposta',
      'permessi.filters.employee': currentLanguage === 'en' ? 'Employee' : 'Dipendente',
      'permessi.filters.all_employees': currentLanguage === 'en' ? 'All employees' : 'Tutti i dipendenti',
      'permessi.filters.select_employee': currentLanguage === 'en' ? 'Select employee' : 'Seleziona dipendente',
      'permessi.filters.status': currentLanguage === 'en' ? 'Status' : 'Stato',
      'permessi.filters.all_statuses': currentLanguage === 'en' ? 'All statuses' : 'Tutti gli stati',
      'permessi.filters.type': currentLanguage === 'en' ? 'Type' : 'Tipo',
      'permessi.filters.all_types': currentLanguage === 'en' ? 'All types' : 'Tutti i tipi',
      'permessi.filters.search': currentLanguage === 'en' ? 'Search' : 'Cerca',
      'permessi.filters.search_placeholder': currentLanguage === 'en' ? 'Search by name or reason...' : 'Cerca per nome o motivo...',
      
      // Tab
      'permessi.tabs.permissions_list': currentLanguage === 'en' ? 'Permissions List' : 'Lista Permessi',
      'permessi.tabs.calendar': currentLanguage === 'en' ? 'Calendar' : 'Calendario',
      'permessi.tabs.holiday_balances': currentLanguage === 'en' ? 'Holiday Balances' : 'Bilanci Ferie',
      
      // Lista
      'permessi.list.title': currentLanguage === 'en' ? 'Permissions List' : 'Lista Permessi',
      'permessi.list.manager_description': currentLanguage === 'en' ? 'Manage all permission and holiday requests from the team' : 'Gestisci tutte le richieste di permesso e ferie del team',
      'permessi.list.personal_description': currentLanguage === 'en' ? 'Your personal permissions' : 'I tuoi permessi personali',
      'permessi.view.manager': currentLanguage === 'en' ? 'Manager View' : 'Vista Manager',
      'permessi.view.personal': currentLanguage === 'en' ? 'Personal View' : 'Vista Personale',
      
      // Tabella
      'permessi.table.employee': currentLanguage === 'en' ? 'Employee' : 'Dipendente',
      'permessi.table.type': currentLanguage === 'en' ? 'Type' : 'Tipo',
      'permessi.table.period': currentLanguage === 'en' ? 'Period' : 'Periodo',
      'permessi.table.reason': currentLanguage === 'en' ? 'Reason' : 'Motivo',
      'permessi.table.status': currentLanguage === 'en' ? 'Status' : 'Stato',
      'permessi.table.actions': currentLanguage === 'en' ? 'Actions' : 'Azioni',
      'permessi.yours': currentLanguage === 'en' ? 'Yours' : 'Tuo',
      
      // Tipi
      'permessi.type.holiday': currentLanguage === 'en' ? 'Holiday' : 'Ferie',
      'permessi.type.permission': currentLanguage === 'en' ? 'Permission' : 'Permesso',
      'permessi.type.sick_leave': currentLanguage === 'en' ? 'Sick Leave' : 'Malattia',
      'permessi.type.other': currentLanguage === 'en' ? 'Other' : 'Altro',
      
      // Stati
      'permessi.status.pending': currentLanguage === 'en' ? 'Pending' : 'In attesa',
      'permessi.status.approved': currentLanguage === 'en' ? 'Approved' : 'Approvato',
      'permessi.status.rejected': currentLanguage === 'en' ? 'Rejected' : 'Rifiutato',
      
      // Periodo
      'permessi.period.from': currentLanguage === 'en' ? 'From' : 'Dal',
      'permessi.period.to': currentLanguage === 'en' ? 'To' : 'Al',
      
      // Azioni
      'permessi.actions.approve': currentLanguage === 'en' ? 'Approve' : 'Approva',
      'permessi.actions.reject': currentLanguage === 'en' ? 'Reject' : 'Rifiuta',
      
      // Messaggi vuoti
      'permessi.empty.archived': currentLanguage === 'en' ? 'No archived permissions found' : 'Nessun permesso archiviato trovato',
      'permessi.empty.archived_description': currentLanguage === 'en' ? 'Archived permissions are approved or rejected permissions that have been moved to the archive.' : 'I permessi archiviati sono quelli approvati o rifiutati che sono stati spostati nell\'archivio.',
      'permessi.empty.no_permissions': currentLanguage === 'en' ? 'No permissions found' : 'Nessun permesso trovato',
      
      // Calendario
      'permessi.calendar.title': currentLanguage === 'en' ? 'Permissions Calendar' : 'Calendario Permessi',
      
      // Bilanci
      'permessi.balances.title': currentLanguage === 'en' ? 'Holiday Balances' : 'Bilanci Ferie',
      'permessi.balances.description': currentLanguage === 'en' ? 'Overview of holiday days for each team member' : 'Panoramica dei giorni di ferie per ogni membro del team',
      'permessi.balances.days_used': currentLanguage === 'en' ? 'days used' : 'giorni utilizzati',
      'permessi.balances.remaining_days': currentLanguage === 'en' ? 'Remaining days' : 'Giorni rimanenti',
      'permessi.balances.days': currentLanguage === 'en' ? 'days' : 'giorni',
      'permessi.balances.pending': currentLanguage === 'en' ? 'pending' : 'in attesa',
      
      // Date
      'permessi.date_not_available': currentLanguage === 'en' ? 'Date not available' : 'Data non disponibile',
      'permessi.invalid_date': currentLanguage === 'en' ? 'Invalid date' : 'Data non valida',

      // Ore Lavorative
      'ore.title': currentLanguage === 'en' ? 'Working Hours Management' : 'Gestione Orari di Lavoro',
      'ore.actions.new_schedule': currentLanguage === 'en' ? 'New Schedule' : 'Nuovo Orario',
      'ore.actions.requests': currentLanguage === 'en' ? 'Requests' : 'Richieste',
      'ore.actions.shift_change': currentLanguage === 'en' ? 'Shift Change' : 'Cambio Turno',
      'ore.actions.extra_availability': currentLanguage === 'en' ? 'Extra Availability' : 'Disponibilità Extra',
      'ore.actions.duplicate_week': currentLanguage === 'en' ? 'Duplicate Week' : 'Duplica Settimana',
      'ore.actions.extra_schedule': currentLanguage === 'en' ? 'Extra Schedule' : 'Orario Straordinario',
      'ore.actions.approve': currentLanguage === 'en' ? 'Approve' : 'Approva',
      'ore.actions.reject': currentLanguage === 'en' ? 'Reject' : 'Rifiuta',
      'ore.actions.save': currentLanguage === 'en' ? 'Save' : 'Salva',
      'ore.actions.clear': currentLanguage === 'en' ? 'Clear' : 'Pulisci',
      'ore.actions.cancel': currentLanguage === 'en' ? 'Cancel' : 'Annulla',
      'ore.actions.save_schedule': currentLanguage === 'en' ? 'Save Schedule' : 'Salva Orario',
      'ore.actions.copy_from': currentLanguage === 'en' ? 'Copy from' : 'Copia da',
      'ore.actions.selected': currentLanguage === 'en' ? 'Selected' : 'Selezionato',
      'ore.actions.select': currentLanguage === 'en' ? 'Select' : 'Seleziona',
      
      // Tabs
      'ore.tabs.weekly': currentLanguage === 'en' ? 'Weekly' : 'Settimanale',
      'ore.tabs.monthly': currentLanguage === 'en' ? 'Monthly' : 'Mensile',
      
      // Monthly
      'ore.monthly.select_employee': currentLanguage === 'en' ? 'Select an employee to modify monthly schedules.' : 'Seleziona un dipendente per modificare gli orari mensili.',
      
      // Table
      'ore.table.day': currentLanguage === 'en' ? 'Day' : 'Giorno',
      'ore.table.start': currentLanguage === 'en' ? 'Start' : 'Inizio',
      'ore.table.end': currentLanguage === 'en' ? 'End' : 'Fine',
      'ore.table.break_start': currentLanguage === 'en' ? 'Break Start' : 'Pausa Inizio',
      'ore.table.break_end': currentLanguage === 'en' ? 'Break End' : 'Pausa Fine',
      'ore.table.actions': currentLanguage === 'en' ? 'Actions' : 'Azioni',
      'ore.table.employee': currentLanguage === 'en' ? 'Employee' : 'Dipendente',
      
      // Weekly
      'ore.weekly.title': currentLanguage === 'en' ? 'Weekly Schedules' : 'Orari Settimanali',
      
      // Filters
      'ore.filters.all_employees': currentLanguage === 'en' ? 'All employees' : 'Tutti i dipendenti',
      
      // Schedule
      'ore.schedule.break': currentLanguage === 'en' ? 'Break' : 'Pausa',
      'ore.schedule.extra': currentLanguage === 'en' ? 'Extra Time' : 'Orario Extra',
      'ore.schedule.overtime': currentLanguage === 'en' ? 'Overtime' : 'Straordinario',
      'ore.schedule.holiday': currentLanguage === 'en' ? 'Holiday' : 'Festivo',
      'ore.schedule.closing': currentLanguage === 'en' ? 'Closing' : 'Chiusura',
      'ore.schedule.not_working': currentLanguage === 'en' ? 'Not working' : 'Non lavora',
      'ore.schedule.works': currentLanguage === 'en' ? 'Works' : 'Lavora',
      'ore.schedule.start': currentLanguage === 'en' ? 'Start' : 'Inizio',
      'ore.schedule.end': currentLanguage === 'en' ? 'End' : 'Fine',
      'ore.schedule.break_start': currentLanguage === 'en' ? 'Break Start' : 'Pausa Inizio',
      'ore.schedule.break_end': currentLanguage === 'en' ? 'Break End' : 'Pausa Fine',
      'ore.schedule.notes': currentLanguage === 'en' ? 'Notes' : 'Note',
      'ore.schedule.notes_placeholder': currentLanguage === 'en' ? 'Optional notes...' : 'Note opzionali...',
      
      // Approved Permissions
      'ore.approved_permissions.title': currentLanguage === 'en' ? 'Approved Permissions' : 'Permessi Approvati',
      'ore.approved_permissions.description': currentLanguage === 'en' ? 'Approved permissions that affect working hours' : 'Permessi approvati che influenzano gli orari di lavoro',
      
      // Permission
      'ore.permission.days': currentLanguage === 'en' ? 'days' : 'giorni',
      'ore.permission.time': currentLanguage === 'en' ? 'Time' : 'Orario',
      'ore.permission.all_day': currentLanguage === 'en' ? 'All day' : 'Tutto il giorno',
      'ore.permission.type.holiday': currentLanguage === 'en' ? 'Holiday' : 'Ferie',
      'ore.permission.type.permission': currentLanguage === 'en' ? 'Permission' : 'Permesso',
      'ore.permission.type.sick_leave': currentLanguage === 'en' ? 'Sick Leave' : 'Malattia',
      'ore.permission.type.other': currentLanguage === 'en' ? 'Other' : 'Altro',
      
      // Notifications
      'ore.notifications.title': currentLanguage === 'en' ? 'Schedule Notifications' : 'Notifiche Orari',
      'ore.notifications.empty': currentLanguage === 'en' ? 'No notifications' : 'Nessuna notifica',
      
      // Pending Requests
      'ore.pending_requests.title': currentLanguage === 'en' ? 'Pending Requests' : 'Richieste in Sospeso',
      'ore.pending_requests.shift_changes': currentLanguage === 'en' ? 'Shift Changes' : 'Cambi Turno',
      'ore.pending_requests.availability': currentLanguage === 'en' ? 'Availability' : 'Disponibilità',
      
      // Availability
      'ore.availability.available': currentLanguage === 'en' ? 'Available' : 'Disponibile',
      'ore.availability.unavailable': currentLanguage === 'en' ? 'Unavailable' : 'Non disponibile',
      
      // Dialogs
      'ore.dialogs.weekly_schedule.title': currentLanguage === 'en' ? 'Set Weekly Schedule' : 'Imposta Orario Settimanale',
      'ore.dialogs.weekly_schedule.description': currentLanguage === 'en' ? 'Configure the weekly work schedule for the selected employee' : 'Configura l\'orario di lavoro settimanale per il dipendente selezionato',
      'ore.dialogs.extra_schedule.title': currentLanguage === 'en' ? 'Extra Schedule' : 'Orario Straordinario',
      'ore.dialogs.extra_schedule.description': currentLanguage === 'en' ? 'Create a special schedule for a specific day' : 'Crea un orario speciale per un giorno specifico',
      
      // Form
      'ore.form.employee': currentLanguage === 'en' ? 'Employee' : 'Dipendente',
      'ore.form.select_employee': currentLanguage === 'en' ? 'Select employee' : 'Seleziona dipendente',
      'ore.form.week_start': currentLanguage === 'en' ? 'Week Start' : 'Inizio Settimana',
      'ore.form.date': currentLanguage === 'en' ? 'Date' : 'Data',
      'ore.form.quick_times': currentLanguage === 'en' ? 'Quick Times' : 'Orari Rapidi',
      
      // Quick Actions
      'ore.quick_actions.title': currentLanguage === 'en' ? 'Quick Actions' : 'Azioni Rapide',
      'ore.quick_actions.enable_weekdays': currentLanguage === 'en' ? 'Enable Weekdays' : 'Abilita Feriali',
      'ore.quick_actions.enable_all': currentLanguage === 'en' ? 'Enable All' : 'Abilita Tutti',
      'ore.quick_actions.disable_all': currentLanguage === 'en' ? 'Disable All' : 'Disabilita Tutti',
      'ore.quick_actions.show': currentLanguage === 'en' ? 'Show' : 'Mostra',
      'ore.quick_actions.hide': currentLanguage === 'en' ? 'Hide' : 'Nascondi',
      'ore.quick_actions.bulk_options': currentLanguage === 'en' ? 'Bulk Options' : 'Opzioni Bulk',
      
      // Bulk Operations
      'ore.bulk_operations.title': currentLanguage === 'en' ? 'Bulk Operations' : 'Operazioni di Massa',
      
      // Daily Schedule
      'ore.daily_schedule.title': currentLanguage === 'en' ? 'Daily Schedules' : 'Orari per Giorno',
      
      // Days
      'ore.days.lun': currentLanguage === 'en' ? 'Mon' : 'Lun',
      'ore.days.mar': currentLanguage === 'en' ? 'Tue' : 'Mar',
      'ore.days.mer': currentLanguage === 'en' ? 'Wed' : 'Mer',
      'ore.days.gio': currentLanguage === 'en' ? 'Thu' : 'Gio',
      'ore.days.ven': currentLanguage === 'en' ? 'Fri' : 'Ven',
      'ore.days.sab': currentLanguage === 'en' ? 'Sat' : 'Sab',
      'ore.days.dom': currentLanguage === 'en' ? 'Sun' : 'Dom',
      'ore.days.lunedì': currentLanguage === 'en' ? 'Monday' : 'Lunedì',
      'ore.days.martedì': currentLanguage === 'en' ? 'Tuesday' : 'Martedì',
      'ore.days.mercoledì': currentLanguage === 'en' ? 'Wednesday' : 'Mercoledì',
      'ore.days.giovedì': currentLanguage === 'en' ? 'Thursday' : 'Giovedì',
      'ore.days.venerdì': currentLanguage === 'en' ? 'Friday' : 'Venerdì',
      'ore.days.sabato': currentLanguage === 'en' ? 'Saturday' : 'Sabato',
      'ore.days.domenica': currentLanguage === 'en' ? 'Sunday' : 'Domenica',

      // Prenotazioni Online
      'prenotazioni.title': currentLanguage === 'en' ? 'Online Bookings' : 'Prenotazioni Online',
      'prenotazioni.description': currentLanguage === 'en' ? 'Manage bookings received from the website' : 'Gestisci le prenotazioni ricevute dal sito web',
      'prenotazioni.count': currentLanguage === 'en' ? 'bookings' : 'prenotazioni',
      
      // Status
      'prenotazioni.status.realtime_active': currentLanguage === 'en' ? 'Real-time updates active' : 'Aggiornamento in tempo reale attivo',
      'prenotazioni.status.connecting': currentLanguage === 'en' ? 'Connecting...' : 'Connessione in corso...',
      'prenotazioni.status.connection_error': currentLanguage === 'en' ? 'Connection error' : 'Errore di connessione',
      'prenotazioni.status.timeout': currentLanguage === 'en' ? 'Connection timeout' : 'Timeout di connessione',
      'prenotazioni.status.unknown': currentLanguage === 'en' ? 'Unknown status' : 'Stato sconosciuto',
      'prenotazioni.status.pending': currentLanguage === 'en' ? 'Pending' : 'In attesa',
      'prenotazioni.status.confirmed': currentLanguage === 'en' ? 'Confirmed' : 'Confermato',
      'prenotazioni.status.cancelled': currentLanguage === 'en' ? 'Cancelled' : 'Annullato',
      'prenotazioni.status.completed': currentLanguage === 'en' ? 'Completed' : 'Completato',
      'prenotazioni.status.converted': currentLanguage === 'en' ? 'Converted' : 'Convertito',
      
      // Actions
      'prenotazioni.actions.retry': currentLanguage === 'en' ? 'Retry' : 'Riprova',
      'prenotazioni.actions.test_connection': currentLanguage === 'en' ? 'Test connection' : 'Test connessione',
      'prenotazioni.actions.toggle_debug': currentLanguage === 'en' ? 'Toggle debug mode' : 'Toggle debug mode',
      'prenotazioni.actions.enable_email_notifications': currentLanguage === 'en' ? 'Enable email notifications' : 'Abilita notifiche email',
      'prenotazioni.actions.disable_email_notifications': currentLanguage === 'en' ? 'Disable email notifications' : 'Disabilita notifiche email',
      'prenotazioni.actions.test_email_connection': currentLanguage === 'en' ? 'Test email connection' : 'Test connessione email',
      'prenotazioni.actions.test_subscription': currentLanguage === 'en' ? 'Test subscription' : 'Test subscription',
      
      // Info
      'prenotazioni.last_update': currentLanguage === 'en' ? 'Last update' : 'Ultimo aggiornamento',
      'prenotazioni.retry_attempts': currentLanguage === 'en' ? 'Attempts' : 'Tentativi',
      'prenotazioni.quality': currentLanguage === 'en' ? 'Quality' : 'Qualità',
      'prenotazioni.quality.excellent': currentLanguage === 'en' ? 'Excellent' : 'Eccellente',
      'prenotazioni.quality.good': currentLanguage === 'en' ? 'Good' : 'Buona',
      'prenotazioni.quality.poor': currentLanguage === 'en' ? 'Poor' : 'Scarsa',
      'prenotazioni.quality.unknown': currentLanguage === 'en' ? 'Unknown' : 'Sconosciuta',
      
      // Filters
      'prenotazioni.filters.all_statuses': currentLanguage === 'en' ? 'All statuses' : 'Tutti gli status',
      'prenotazioni.filters.all_dates': currentLanguage === 'en' ? 'All dates' : 'Tutte le date',
      'prenotazioni.filters.today': currentLanguage === 'en' ? 'Today' : 'Oggi',
      'prenotazioni.filters.last_week': currentLanguage === 'en' ? 'Last week' : 'Ultima settimana',
      'prenotazioni.filters.last_month': currentLanguage === 'en' ? 'Last month' : 'Ultimo mese',
      'prenotazioni.filters.archived': currentLanguage === 'en' ? 'Archived' : 'Archiviate',
      'prenotazioni.filters.active': currentLanguage === 'en' ? 'Active' : 'Attive',
      
      // Debug
      'prenotazioni.debug.title': currentLanguage === 'en' ? 'Debug Real-time' : 'Debug Real-time',
      'prenotazioni.debug.status': currentLanguage === 'en' ? 'Status' : 'Status',
      'prenotazioni.debug.attempts': currentLanguage === 'en' ? 'Attempts' : 'Tentativi',
      'prenotazioni.debug.last_heartbeat': currentLanguage === 'en' ? 'Last heartbeat' : 'Ultimo heartbeat',
      'prenotazioni.debug.connection_quality': currentLanguage === 'en' ? 'Connection quality' : 'Qualità connessione',
      'prenotazioni.debug.email_notifications': currentLanguage === 'en' ? 'Email notifications' : 'Notifiche email',
      'prenotazioni.debug.enabled': currentLanguage === 'en' ? 'Enabled' : 'Abilitate',
      'prenotazioni.debug.disabled': currentLanguage === 'en' ? 'Disabled' : 'Disabilitate',
      'prenotazioni.debug.logs': currentLanguage === 'en' ? 'Logs' : 'Log',
      'prenotazioni.debug.no_logs': currentLanguage === 'en' ? 'No logs available' : 'Nessun log disponibile',
      
      // Stats
      'prenotazioni.stats.total': currentLanguage === 'en' ? 'Total' : 'Totali',
      'prenotazioni.stats.archived': currentLanguage === 'en' ? 'Archived' : 'Archiviate',
      'prenotazioni.stats.pending': currentLanguage === 'en' ? 'Pending' : 'In attesa',
      'prenotazioni.stats.confirmed': currentLanguage === 'en' ? 'Confirmed' : 'Confermati',
      'prenotazioni.stats.converted': currentLanguage === 'en' ? 'Converted' : 'Convertiti',
      
      // List
      'prenotazioni.list.active': currentLanguage === 'en' ? 'Active Bookings' : 'Prenotazioni Attive',
      'prenotazioni.list.archived': currentLanguage === 'en' ? 'Archived Bookings' : 'Prenotazioni Archiviate',
      
      // Empty states
      'prenotazioni.empty.no_bookings': currentLanguage === 'en' ? 'No bookings found' : 'Nessuna prenotazione trovata',
      
      // Loading
      'prenotazioni.loading.mobile': currentLanguage === 'en' ? 'Loading online bookings...' : 'Caricamento prenotazioni online...',
      'prenotazioni.loading.desktop': currentLanguage === 'en' ? 'Loading online bookings...' : 'Caricamento prenotazioni online...',
      
      // Access denied
      'prenotazioni.access_denied.title': currentLanguage === 'en' ? 'Access Denied' : 'Accesso Negato',
      'prenotazioni.access_denied.message': currentLanguage === 'en' ? 'You do not have permission to view online bookings.' : 'Non hai i permessi per visualizzare le prenotazioni online.',
      'prenotazioni.access_denied.required_permission': currentLanguage === 'en' ? 'Required Permission' : 'Permesso Richiesto',
      'profile.tabs.info': currentLanguage === 'en' ? 'Information' : 'Informazioni',
      'profile.tabs.security': currentLanguage === 'en' ? 'Security' : 'Sicurezza',
      'profile.tabs.preferences': currentLanguage === 'en' ? 'Preferences' : 'Preferenze',
      'profile.tabs.notifications': currentLanguage === 'en' ? 'Notifications' : 'Notifiche',
      'profile.personal_info': currentLanguage === 'en' ? 'Personal Information' : 'Informazioni Personali',
      'profile.personal_info_desc': currentLanguage === 'en' ? 'Edit your personal information and profile photo' : 'Modifica le tue informazioni personali e la foto del profilo',
      'profile.account_security': currentLanguage === 'en' ? 'Account Security' : 'Sicurezza Account',
      'profile.account_security_desc': currentLanguage === 'en' ? 'Manage your password and account security settings' : 'Gestisci la password e le impostazioni di sicurezza del tuo account',
      'profile.app_preferences': currentLanguage === 'en' ? 'Application Preferences' : 'Preferenze Applicazione',
      'profile.app_preferences_desc': currentLanguage === 'en' ? 'Customize the interface and behavior of the application' : 'Personalizza l\'interfaccia e il comportamento dell\'applicazione',
      'profile.notifications': currentLanguage === 'en' ? 'Notification Settings' : 'Impostazioni Notifiche',
      'profile.notifications_desc': currentLanguage === 'en' ? 'Configure how and when to receive application notifications' : 'Configura come e quando ricevere le notifiche dell\'applicazione',
      'profile.language': currentLanguage === 'en' ? 'Language' : 'Lingua',
      'profile.language_desc': currentLanguage === 'en' ? 'Choose the interface language' : 'Scegli la lingua dell\'interfaccia',
      'profile.time_format': currentLanguage === 'en' ? 'Time Format' : 'Formato Orario',
      'profile.time_24h': currentLanguage === 'en' ? '24 Hours (00-24)' : '24 Ore (00-24)',
      'profile.time_12h': currentLanguage === 'en' ? '12 Hours (AM/PM)' : '12 Ore (AM/PM)',
      'profile.time_format_error': currentLanguage === 'en' ? 'Error saving time format.' : 'Errore durante il salvataggio del formato orario.',
      'profile.time_format_success': currentLanguage === 'en' ? 'Time format saved successfully!' : 'Formato orario salvato con successo!',
      'profile.email_notifications': currentLanguage === 'en' ? 'Email Notifications' : 'Notifiche Email',
      'profile.push_notifications': currentLanguage === 'en' ? 'Push Notifications' : 'Notifiche Push',
      'profile.new_appointments': currentLanguage === 'en' ? 'New appointments' : 'Nuovi appuntamenti',
      'profile.appointment_reminders': currentLanguage === 'en' ? 'Appointment reminders' : 'Promemoria appuntamenti',
      'profile.newsletter_updates': currentLanguage === 'en' ? 'Newsletter and updates' : 'Newsletter e aggiornamenti',
      'profile.realtime_activity': currentLanguage === 'en' ? 'Real-time activity' : 'Attività in tempo reale',
      'profile.daily_reminders': currentLanguage === 'en' ? 'Daily reminders' : 'Promemoria quotidiani',
      'profile.notification_frequency': currentLanguage === 'en' ? 'Notification Frequency' : 'Frequenza Notifiche',
      'profile.frequency_immediate': currentLanguage === 'en' ? 'Immediate' : 'Immediata',
      'profile.frequency_hourly': currentLanguage === 'en' ? 'Hourly' : 'Ogni ora',
      'profile.frequency_daily': currentLanguage === 'en' ? 'Daily' : 'Giornaliera',
      'profile.frequency_weekly': currentLanguage === 'en' ? 'Weekly' : 'Settimanale',
      
      // Delete Account Section
      'profile.delete_account': currentLanguage === 'en' ? 'Delete Account' : 'Elimina Account',
      'profile.delete_account_desc': currentLanguage === 'en' ? 'Permanently delete your account and all associated data. This action cannot be undone.' : 'Elimina permanentemente il tuo account e tutti i dati associati. Questa azione non può essere annullata.',
      'profile.delete_warning_title': currentLanguage === 'en' ? 'Warning: Irreversible Action' : 'Attenzione: Azione irreversibile',
      'profile.delete_warning_1': currentLanguage === 'en' ? 'All your personal data will be deleted' : 'Tutti i tuoi dati personali verranno eliminati',
      'profile.delete_warning_2': currentLanguage === 'en' ? 'All appointments and bookings will be removed' : 'Tutti gli appuntamenti e prenotazioni verranno rimossi',
      'profile.delete_warning_3': currentLanguage === 'en' ? 'Salon settings will be deleted' : 'Le impostazioni del salon verranno cancellate',
      'profile.delete_warning_4': currentLanguage === 'en' ? 'Services and invoices will be deleted' : 'I servizi e le fatture verranno eliminati',
      'profile.delete_warning_5': currentLanguage === 'en' ? 'This operation cannot be undone' : 'Questa operazione non può essere annullata',
      'profile.delete_account_button': currentLanguage === 'en' ? 'Permanently Delete My Account' : 'Elimina Definitivamente il Mio Account',
      'profile.confirm_delete_title': currentLanguage === 'en' ? 'Confirm Account Deletion' : 'Conferma Eliminazione Account',
      'profile.confirm_delete_desc': currentLanguage === 'en' ? 'Are you sure you want to permanently delete your account? All data will be lost and cannot be recovered.' : 'Sei sicuro di voler eliminare definitivamente il tuo account? Tutti i dati verranno persi e non potranno essere recuperati.',
      'profile.delete_success': currentLanguage === 'en' ? 'Account successfully deleted. You will be redirected to the login page.' : 'Account eliminato con successo. Verrai reindirizzato alla pagina di login.',
      'profile.delete_error': currentLanguage === 'en' ? 'Error deleting account. Please try again later.' : 'Errore durante l\'eliminazione dell\'account. Riprova più tardi.',

      // Calendario
      'calendar.time': currentLanguage === 'en' ? 'Time' : 'Ora',
      'calendar.show_deleted': currentLanguage === 'en' ? 'Show deleted appointments' : 'Visualizza anche gli appuntamenti con stato "Eliminato"',
      'calendar.deleted': currentLanguage === 'en' ? 'Deleted' : 'Eliminato',
      'calendar.confirmed': currentLanguage === 'en' ? 'Confirmed' : 'Confermato',
      'calendar.pending': currentLanguage === 'en' ? 'Pending' : 'In attesa',
      'calendar.completed': currentLanguage === 'en' ? 'Completed' : 'Completato',
      'calendar.paid': currentLanguage === 'en' ? 'Paid' : 'Pagato',
      'calendar.no_appointments': currentLanguage === 'en' ? 'No appointments' : 'Nessun appuntamento',
      'calendar.no_appointments_filter': currentLanguage === 'en' ? 'No appointments match the applied filters for this date' : 'Nessun appuntamento corrisponde ai filtri applicati per questa data',
      'calendar.back_to_today': currentLanguage === 'en' ? 'Back to today' : 'Torna ad oggi',
      'calendar.appointment': currentLanguage === 'en' ? 'appointment' : 'appuntamento',
      'calendar.appointments': currentLanguage === 'en' ? 'appointments' : 'appuntamenti',

      // Form di creazione appuntamento
      'form.client': currentLanguage === 'en' ? 'Client' : 'Cliente',
      'form.services': currentLanguage === 'en' ? 'Services' : 'Servizi',
      'form.date_time': currentLanguage === 'en' ? 'Date and Time' : 'Data e Orario',
      'form.staff_notes': currentLanguage === 'en' ? 'Staff and Notes' : 'Staff e Note',
      'form.date': currentLanguage === 'en' ? 'Date' : 'Data',
      'form.start_time': currentLanguage === 'en' ? 'Start time' : 'Orario di inizio',
      'form.end_time': currentLanguage === 'en' ? 'End time' : 'Orario di fine',
      'form.select_time': currentLanguage === 'en' ? 'Select time' : 'Seleziona orario',
      'form.select_staff': currentLanguage === 'en' ? 'Select staff' : 'Seleziona staff',
      'form.staff': currentLanguage === 'en' ? 'Staff' : 'Staff',
      'form.notes': currentLanguage === 'en' ? 'Notes' : 'Note',
      'form.notes_placeholder': currentLanguage === 'en' ? 'Add notes for this appointment...' : 'Aggiungi note per questo appuntamento...',
      'form.notify_client': currentLanguage === 'en' ? 'Send notification to client' : 'Invia notifica al cliente',
      'form.notify_client_desc': currentLanguage === 'en' ? 'Send a reminder to the client' : 'Invia un promemoria al cliente',
      'form.color_card': currentLanguage === 'en' ? 'Card color (max 2)' : 'Colore card (max 2)',
      'form.where_apply_color': currentLanguage === 'en' ? 'Where to apply the color' : 'Dove applicare il colore',
      'form.entire_card': currentLanguage === 'en' ? 'Entire card' : 'Tutta la card',
      'form.top_only': currentLanguage === 'en' ? 'Top only' : 'Solo sopra',
      'form.bottom_only': currentLanguage === 'en' ? 'Bottom only' : 'Solo sotto',
      'form.left_only': currentLanguage === 'en' ? 'Left only' : 'Solo a sinistra',
      'form.right_only': currentLanguage === 'en' ? 'Right only' : 'Solo a destra',
      'form.luminance_glow': currentLanguage === 'en' ? 'Luminance glow' : 'Alone luminoso',
      'form.low': currentLanguage === 'en' ? 'Low' : 'Basso',
      'form.medium': currentLanguage === 'en' ? 'Medium' : 'Medio',
      'form.high': currentLanguage === 'en' ? 'High' : 'Forte',
      'form.preview': currentLanguage === 'en' ? 'Preview' : 'Anteprima',
      'form.single_color': currentLanguage === 'en' ? 'Single color' : 'Colore unico',
      'form.gradient': currentLanguage === 'en' ? 'Gradient' : 'Gradiente',
      'form.white': currentLanguage === 'en' ? 'White' : 'Bianco',
      'form.apply_coupon': currentLanguage === 'en' ? 'Apply discount coupon' : 'Applica coupon sconto',
      'form.cancel': currentLanguage === 'en' ? 'Cancel' : 'Annulla',
      'form.create_appointment': currentLanguage === 'en' ? 'Create Appointment' : 'Crea Appuntamento',
      'form.saving': currentLanguage === 'en' ? 'Saving...' : 'Salvando...',
      'form.time_warning': currentLanguage === 'en' ? 'End time must be greater than or equal to start time.' : 'L\'orario di fine deve essere maggiore o uguale all\'orario di inizio.',
      'form.select_start_time_first': currentLanguage === 'en' ? 'Select start time first' : 'Seleziona prima l\'orario di inizio',
      'form.appointment_created_success': currentLanguage === 'en' ? 'Appointment created successfully!' : 'Appuntamento creato con successo!',
      'form.error_creating_appointment': currentLanguage === 'en' ? 'Error creating appointment.' : 'Errore durante la creazione dell\'appuntamento.',

      // CreateOrder component specific translations
      'createorder.new_client': currentLanguage === 'en' ? 'New Client' : 'Nuovo Cliente',
      'createorder.new_sale': currentLanguage === 'en' ? 'New Sale' : 'Nuova Vendita',
      'createorder.new_appointment': currentLanguage === 'en' ? 'New Appointment' : 'Nuovo Appuntamento',
      'createorder.add_new_client': currentLanguage === 'en' ? 'Add a new client to the system' : 'Aggiungi un nuovo cliente al sistema',
      'createorder.register_new_sale': currentLanguage === 'en' ? 'Register a new sale' : 'Registra una nuova vendita',
      'createorder.create_new_appointment': currentLanguage === 'en' ? 'Create a new appointment for a client' : 'Crea un nuovo appuntamento per un cliente',
      'createorder.loading': currentLanguage === 'en' ? 'Loading...' : 'Caricamento...',
      'createorder.no_clients_found': currentLanguage === 'en' ? 'No clients found' : 'Nessun cliente trovato',
      'createorder.add_client_message': currentLanguage === 'en' ? 'Add a client to create a new appointment or sale.' : 'Aggiungi un cliente per poter creare un nuovo appuntamento o vendita.',
      'createorder.no_team_found': currentLanguage === 'en' ? 'No team members found' : 'Nessun membro del team trovato',
      'createorder.add_team_message': currentLanguage === 'en' ? 'Add team members to manage appointments or sales.' : 'Aggiungi membri del team per poter gestire appuntamenti o vendite.',
      'createorder.no_services_found': currentLanguage === 'en' ? 'No active services found' : 'Nessun servizio attivo trovato',
      'createorder.add_services_message': currentLanguage === 'en' ? 'Add services to select them during appointment or sale creation.' : 'Aggiungi servizi per poterli selezionare durante la creazione di appuntamenti o vendite.',
      'createorder.error_loading': currentLanguage === 'en' ? 'Error loading data' : 'Errore nel caricamento dei dati',
      'createorder.user_not_authenticated': currentLanguage === 'en' ? 'User not authenticated.' : 'Utente non autenticato.',
      'createorder.cannot_determine_salon': currentLanguage === 'en' ? 'Cannot determine the associated salon.' : 'Impossibile determinare il salone associato.',
      'createorder.error_during_loading': currentLanguage === 'en' ? 'Error during loading.' : 'Errore durante il caricamento.',

      // ClientSection component specific translations
      'clientsection.select_client': currentLanguage === 'en' ? 'Select a client' : 'Seleziona un cliente',
      'clientsection.add_new_client': currentLanguage === 'en' ? 'Add New Client' : 'Aggiungi Nuovo Cliente',
      'clientsection.add_new_client_desc': currentLanguage === 'en' ? 'Fill out the form to add a new client.' : 'Compila il modulo per aggiungere un nuovo cliente.',
      'clientsection.new_client_added_success': currentLanguage === 'en' ? 'New client added successfully!' : 'Nuovo cliente aggiunto con successo!',

      // ServiceSection component specific translations
      'servicesection.select_service': currentLanguage === 'en' ? 'Select service' : 'Seleziona servizio',
      'servicesection.service': currentLanguage === 'en' ? 'Service' : 'Servizio',
      'servicesection.duration': currentLanguage === 'en' ? 'Duration' : 'Durata',
      'servicesection.price': currentLanguage === 'en' ? 'Price' : 'Prezzo',
      'servicesection.total_duration': currentLanguage === 'en' ? 'Total duration:' : 'Durata totale:',
      'servicesection.remove_service': currentLanguage === 'en' ? 'Remove service' : 'Rimuovi servizio',

      // CreatePausaForm component specific translations
      'pausa.new_break': currentLanguage === 'en' ? 'New Break' : 'Nuova Pausa',
      'pausa.date': currentLanguage === 'en' ? 'Date' : 'Data',
      'pausa.staff': currentLanguage === 'en' ? 'Staff' : 'Staff',
      'pausa.start_time': currentLanguage === 'en' ? 'Start Time' : 'Ora Inizio',
      'pausa.end_time': currentLanguage === 'en' ? 'End Time' : 'Ora Fine',
      'pausa.select_staff': currentLanguage === 'en' ? 'Select staff' : 'Seleziona staff',
      'pausa.select_start_time': currentLanguage === 'en' ? 'Select start time' : 'Seleziona orario inizio',
      'pausa.select_end_time': currentLanguage === 'en' ? 'Select end time' : 'Seleziona orario fine',
      'pausa.notes': currentLanguage === 'en' ? 'Notes' : 'Note',
      'pausa.notes_placeholder': currentLanguage === 'en' ? 'Add notes for this break...' : 'Aggiungi note per questa pausa...',
      'pausa.cancel': currentLanguage === 'en' ? 'Cancel' : 'Annulla',
      'pausa.create_break': currentLanguage === 'en' ? 'Create Break' : 'Crea Pausa',
      'pausa.time_warning': currentLanguage === 'en' ? 'End time must be greater than or equal to start time.' : 'L\'orario di fine deve essere maggiore o uguale all\'orario di inizio.',
      'pausa.overlap_error_title': currentLanguage === 'en' ? 'Appointment Overlap' : 'Sovrapposizione appuntamento',
      'pausa.overlap_error_description': currentLanguage === 'en' ? 'Cannot create break: there is already an appointment for this team member at that time.' : 'Non è possibile creare la pausa: esiste già un appuntamento per questo membro del team in quell\'orario.',
      'pausa.user_not_authenticated': currentLanguage === 'en' ? 'User not authenticated. Login required.' : 'Utente non autenticato. Accesso richiesto.',
      'pausa.cannot_determine_salon': currentLanguage === 'en' ? 'Cannot determine the salon.' : 'Impossibile determinare il salone.',
      'pausa.error_creating_break': currentLanguage === 'en' ? 'Error creating break.' : 'Errore durante la creazione della pausa.',
      'pausa.required_date': currentLanguage === 'en' ? 'Date is required.' : 'La data è obbligatoria.',
      'pausa.required_start_time': currentLanguage === 'en' ? 'Start time is required.' : 'L\'orario di inizio è obbligatorio.',
      'pausa.required_end_time': currentLanguage === 'en' ? 'End time is required.' : 'L\'orario di fine è obbligatorio.',
      'pausa.invalid_start_time_format': currentLanguage === 'en' ? 'Invalid start time format. Use HH:mm.' : 'Formato orario di inizio non valido. Usa HH:mm.',
      'pausa.invalid_end_time_format': currentLanguage === 'en' ? 'Invalid end time format. Use HH:mm.' : 'Formato orario di fine non valido. Usa HH:mm.',
      'pausa.select_team_member': currentLanguage === 'en' ? 'Select a team member.' : 'Selezionare un membro del team.',

      // CreateOrderMobile component specific translations
      'mobile.new_appointment': currentLanguage === 'en' ? 'New Appointment' : 'Nuovo Appuntamento',
      'mobile.client': currentLanguage === 'en' ? 'Client' : 'Cliente',
      'mobile.select_client': currentLanguage === 'en' ? 'Select a client' : 'Seleziona un cliente',
      'mobile.date_time': currentLanguage === 'en' ? 'Date and Time' : 'Data e Orario',
      'mobile.date': currentLanguage === 'en' ? 'Date' : 'Data',
      'mobile.start_time': currentLanguage === 'en' ? 'Start' : 'Inizio',
      'mobile.end_time': currentLanguage === 'en' ? 'End' : 'Fine',
      'mobile.select_time': currentLanguage === 'en' ? 'Select time' : 'Seleziona orario',
      'mobile.select_start_time_first': currentLanguage === 'en' ? 'Select start time first' : 'Seleziona prima l\'orario di inizio',
      'mobile.time_warning': currentLanguage === 'en' ? '⚠️ End time must be greater than start time.' : '⚠️ L\'orario di fine deve essere maggiore dell\'orario di inizio.',
      'mobile.team_member': currentLanguage === 'en' ? 'Team Member' : 'Membro del Team',
      'mobile.select_team_member': currentLanguage === 'en' ? 'Select a team member' : 'Seleziona un membro',
      'mobile.services': currentLanguage === 'en' ? 'Services' : 'Servizi',
      'mobile.available_services': currentLanguage === 'en' ? 'available' : 'disponibili',
      'mobile.no_services_selected': currentLanguage === 'en' ? 'No services selected' : 'Nessun servizio selezionato',
      'mobile.add_service': currentLanguage === 'en' ? 'Add Service' : 'Aggiungi Servizio',
      'mobile.total': currentLanguage === 'en' ? 'Total' : 'Totale',
      'mobile.notes': currentLanguage === 'en' ? 'Notes' : 'Note',
      'mobile.notes_placeholder': currentLanguage === 'en' ? 'Add notes for the appointment...' : 'Aggiungi note per l\'appuntamento...',
      'mobile.notifications': currentLanguage === 'en' ? 'Notifications' : 'Notifiche',
      'mobile.send_notification': currentLanguage === 'en' ? 'Send notification to client' : 'Invia notifica al cliente',
      'mobile.notification_description': currentLanguage === 'en' ? 'Reminder via email or SMS' : 'Promemoria via email o SMS',
      'mobile.notification_method': currentLanguage === 'en' ? 'Notification method' : 'Metodo di notifica',
      'mobile.select_method': currentLanguage === 'en' ? 'Select method' : 'Seleziona metodo',
      'mobile.send_notification_time': currentLanguage === 'en' ? 'Send notification' : 'Invia notifica',
      'mobile.select_time_before': currentLanguage === 'en' ? 'Select time' : 'Seleziona tempo',
      'mobile.minutes_before': currentLanguage === 'en' ? 'minutes before' : 'minuti prima',
      'mobile.hour_before': currentLanguage === 'en' ? 'hour before' : 'ora prima',
      'mobile.hours_before': currentLanguage === 'en' ? 'hours before' : 'ore prima',
      'mobile.day_before': currentLanguage === 'en' ? 'day before' : 'giorno prima',
      'mobile.final_summary': currentLanguage === 'en' ? 'Final Summary' : 'Riepilogo Finale',
      'mobile.not_specified': currentLanguage === 'en' ? 'Not specified' : 'Non specificato',
      'mobile.not_set': currentLanguage === 'en' ? 'Not set' : 'Non impostato',
      'mobile.services_count': currentLanguage === 'en' ? 'services' : 'servizi',
      'mobile.disabled': currentLanguage === 'en' ? 'Disabled' : 'Disabilitate',
      'mobile.next': currentLanguage === 'en' ? 'Next' : 'Avanti',
      'mobile.back': currentLanguage === 'en' ? 'Back' : 'Indietro',
      'mobile.cancel': currentLanguage === 'en' ? 'Cancel' : 'Annulla',
      'mobile.create_appointment': currentLanguage === 'en' ? 'Create Appointment' : 'Crea Appuntamento',
      'mobile.creating': currentLanguage === 'en' ? 'Creating...' : 'Creazione...',
      'mobile.loading_data': currentLanguage === 'en' ? 'Loading data...' : 'Caricamento dati...',
      'mobile.fill_required_fields': currentLanguage === 'en' ? 'Fill in all required fields correctly' : 'Compila correttamente tutti i campi obbligatori',
      'mobile.fill_all_required': currentLanguage === 'en' ? 'Fill in all required fields' : 'Compila tutti i campi obbligatori',
      'mobile.appointment_created_success': currentLanguage === 'en' ? 'Appointment created successfully!' : 'Appuntamento creato con successo!',
      'mobile.error_creating_appointment': currentLanguage === 'en' ? 'Error creating appointment:' : 'Errore nella creazione dell\'appuntamento:',
      'mobile.unknown_error': currentLanguage === 'en' ? 'Unknown error' : 'Errore sconosciuto',
      'mobile.cannot_determine_salon': currentLanguage === 'en' ? 'Cannot determine the associated salon.' : 'Impossibile determinare il salone associato.',
      'mobile.user_not_authenticated': currentLanguage === 'en' ? 'User not authenticated. Login required.' : 'Utente non autenticato. Accesso richiesto.',
      'mobile.error_loading': currentLanguage === 'en' ? 'Error during loading.' : 'Errore durante il caricamento.',
      'mobile.no_clients_found': currentLanguage === 'en' ? 'No clients found' : 'Nessun cliente trovato',
      'mobile.add_client_message': currentLanguage === 'en' ? 'Add a client to create a new appointment or sale.' : 'Aggiungi un cliente per poter creare un nuovo appuntamento o vendita.',
      'mobile.no_team_found': currentLanguage === 'en' ? 'No team members found' : 'Nessun membro del team trovato',
      'mobile.add_team_message': currentLanguage === 'en' ? 'Add team members to manage appointments or sales.' : 'Aggiungi membri del team per poter gestire appuntamenti o vendite.',
      'mobile.no_services_found': currentLanguage === 'en' ? 'No active services found' : 'Nessun servizio attivo trovato',
      'mobile.add_services_message': currentLanguage === 'en' ? 'Add services to select them during appointment or sale creation.' : 'Aggiungi servizi per poterli selezionare durante la creazione di appuntamenti o vendite.',

      // Navbar component specific translations
      'navbar.close_sidebar': currentLanguage === 'en' ? 'Close sidebar' : 'Chiudi sidebar',
      'navbar.open_sidebar': currentLanguage === 'en' ? 'Open sidebar' : 'Apri sidebar',
      'navbar.day': currentLanguage === 'en' ? 'Day' : 'Giorno',
      'navbar.week': currentLanguage === 'en' ? 'Week' : 'Settimana',
      'navbar.month': currentLanguage === 'en' ? 'Month' : 'Mese',
      'navbar.tasks': currentLanguage === 'en' ? 'Tasks' : 'Task',
      'navbar.connection_error': currentLanguage === 'en' ? 'Connection Error' : 'Errore di Connessione',
      'navbar.database_error': currentLanguage === 'en' ? 'Database Error' : 'Errore Database',
      'navbar.heartbeat_error': currentLanguage === 'en' ? 'Heartbeat Error' : 'Errore Heartbeat',
      'navbar.realtime_error': currentLanguage === 'en' ? 'Real-time Error' : 'Errore Real-time',
      'navbar.reconnection_attempts': currentLanguage === 'en' ? 'Reconnection attempts' : 'Tentativi riconnessione',
      'navbar.auto_reconnection': currentLanguage === 'en' ? 'Automatic reconnection attempt...' : 'Tentativo di riconnessione automatica...',
      'navbar.connected': currentLanguage === 'en' ? 'Connected' : 'Connesso',
      'navbar.connecting': currentLanguage === 'en' ? 'Connecting...' : 'Connessione...',
      'navbar.error': currentLanguage === 'en' ? 'Error' : 'Errore',
      'navbar.disconnected': currentLanguage === 'en' ? 'Disconnected' : 'Disconnesso',
      'navbar.unknown': currentLanguage === 'en' ? 'Unknown' : 'Sconosciuto',
      'navbar.notifications': currentLanguage === 'en' ? 'Notifications' : 'Notifiche',
      'navbar.booking_confirmation': currentLanguage === 'en' ? 'You have' : 'Hai',
      'navbar.booking_confirmation_plural': currentLanguage === 'en' ? 'bookings to confirm' : 'prenotazioni da confermare',
      'navbar.booking_confirmation_singular': currentLanguage === 'en' ? 'booking to confirm' : 'prenotazione da confermare',
      'navbar.no_bookings': currentLanguage === 'en' ? 'No bookings' : 'Nessuna prenotazione',
      'navbar.unread_messages': currentLanguage === 'en' ? 'Unread messages' : 'Messaggi da leggere',
      'navbar.view_bookings': currentLanguage === 'en' ? 'View bookings' : 'Visualizza prenotazioni',
      'navbar.open_chat': currentLanguage === 'en' ? 'Open chat' : 'Apri chat',
      'navbar.new': currentLanguage === 'en' ? 'New' : 'Nuovo',
      'navbar.create_new': currentLanguage === 'en' ? 'Create new' : 'Crea nuovo',
      'navbar.new_appointment': currentLanguage === 'en' ? 'New appointment' : 'Nuovo appuntamento',
      'navbar.new_client': currentLanguage === 'en' ? 'New client' : 'Nuovo cliente',
      'navbar.new_service': currentLanguage === 'en' ? 'New service' : 'Nuovo servizio',
      'navbar.new_break': currentLanguage === 'en' ? 'New break' : 'Nuova pausa',
      'navbar.new_task': currentLanguage === 'en' ? 'New task' : 'Nuovo task',
      'navbar.menu': currentLanguage === 'en' ? 'Menu' : 'Menu',
      'navbar.main_menu': currentLanguage === 'en' ? 'Main menu' : 'Menu principale',
      'navbar.clients': currentLanguage === 'en' ? 'Clients' : 'Clienti',
      'navbar.services': currentLanguage === 'en' ? 'Services' : 'Servizi',
      'navbar.staff_management': currentLanguage === 'en' ? 'Staff Management' : 'Gestione Personale',
      'navbar.online_bookings': currentLanguage === 'en' ? 'Online Bookings' : 'Prenotazioni Online',

      // CreateClientModal component specific translations
      'clientmodal.new_client': currentLanguage === 'en' ? 'New Client' : 'Nuovo Cliente',

      // Sidebar page component specific translations
      'sidebar.appointments': currentLanguage === 'en' ? 'Appointments' : 'Appuntamenti',
      'sidebar.chat': currentLanguage === 'en' ? 'Chat' : 'Chat',
      'sidebar.switch_to_appointments': currentLanguage === 'en' ? 'Switch to Appointments' : 'Passa a Appuntamenti',
      'sidebar.switch_to_chat': currentLanguage === 'en' ? 'Switch to Chat' : 'Passa a Chat',
      'sidebar.manual_refresh': currentLanguage === 'en' ? 'Manual refresh' : 'Aggiornamento manuale',
      'sidebar.data_updated_manually': currentLanguage === 'en' ? 'Data updated manually.' : 'Dati aggiornati manualmente.',
      'sidebar.search_appointments': currentLanguage === 'en' ? 'Search appointments...' : 'Cerca appuntamenti...',
      'sidebar.filters': currentLanguage === 'en' ? 'Filters' : 'Filtri',
      'sidebar.status': currentLanguage === 'en' ? 'Status' : 'Stato',
      'sidebar.members': currentLanguage === 'en' ? 'Members' : 'Membri',
      'sidebar.show_deleted': currentLanguage === 'en' ? 'Show deleted' : 'Mostra eliminati',
      'sidebar.hide': currentLanguage === 'en' ? 'Hide' : 'Nascondi',
      'sidebar.show': currentLanguage === 'en' ? 'Show' : 'Mostra',
      'sidebar.clear_filters': currentLanguage === 'en' ? 'Clear filters' : 'Cancella filtri',
      'sidebar.no_appointments': currentLanguage === 'en' ? 'No appointments' : 'Nessun appuntamento',
      'sidebar.no_appointments_filter': currentLanguage === 'en' ? 'No appointments found with the applied filters' : 'Nessun appuntamento trovato con i filtri applicati',
      'sidebar.no_appointments_system': currentLanguage === 'en' ? 'No appointments in the system' : 'Nessun appuntamento nel sistema',
      'sidebar.no_appointments_selected': currentLanguage === 'en' ? 'No appointments for the selected filters' : 'Nessun appuntamento per i filtri selezionati',
      'sidebar.new_appointment': currentLanguage === 'en' ? 'New appointment' : 'Nuovo appuntamento',
      'sidebar.loading_preferences': currentLanguage === 'en' ? 'Loading preferences...' : 'Caricamento preferenze...',
      'sidebar.loading_data': currentLanguage === 'en' ? 'Loading data...' : 'Caricamento dati...',
      'sidebar.preference_saved': currentLanguage === 'en' ? 'Preference saved' : 'Preferenza salvata',
      'sidebar.sidebar_set_to': currentLanguage === 'en' ? 'Sidebar set to:' : 'Sidebar impostata su:',
      'sidebar.error_saving_preference': currentLanguage === 'en' ? 'Error' : 'Errore',
      'sidebar.cannot_save_preference': currentLanguage === 'en' ? 'Cannot save sidebar preference' : 'Impossibile salvare la preferenza della sidebar',
      'sidebar.access_denied': currentLanguage === 'en' ? 'Access Denied' : 'Accesso Negato',
      'sidebar.insufficient_permissions': currentLanguage === 'en' ? 'You do not have permission to edit this appointment' : 'Non hai i permessi per modificare questo appuntamento',
      'sidebar.service_removed': currentLanguage === 'en' ? 'Service removed' : 'Servizio rimosso',
      'sidebar.service_removed_description': currentLanguage === 'en' ? 'The service has been removed from the appointment.' : 'Il servizio è stato rimosso dall\'appuntamento.',
      'sidebar.error_removing_service': currentLanguage === 'en' ? 'Error' : 'Errore',
      'sidebar.cannot_remove_service': currentLanguage === 'en' ? 'Cannot remove service.' : 'Impossibile rimuovere il servizio.',
      'sidebar.services_updated': currentLanguage === 'en' ? 'Services updated' : 'Servizi aggiornati',
      'sidebar.services_updated_description': currentLanguage === 'en' ? 'Services have been updated successfully.' : 'I servizi sono stati aggiornati con successo.',
      'sidebar.error_updating_services': currentLanguage === 'en' ? 'Error' : 'Errore',
      'sidebar.cannot_update_services': currentLanguage === 'en' ? 'Cannot update services.' : 'Impossibile aggiornare i servizi.',
      'sidebar.member': currentLanguage === 'en' ? 'Member' : 'Membro',
      'sidebar.minutes': currentLanguage === 'en' ? 'min' : 'min',

      // UserNav component specific translations
      'usernav.user': currentLanguage === 'en' ? 'User' : 'Utente',
      'usernav.loading': currentLanguage === 'en' ? 'Loading...' : 'Caricamento...',
      'usernav.confirm_logout': currentLanguage === 'en' ? 'Are you sure you want to logout?' : 'Sei sicuro di voler effettuare il logout?',
      'usernav.profile': currentLanguage === 'en' ? 'Profile' : 'Profilo',
      'usernav.advanced_settings': currentLanguage === 'en' ? 'Advanced Settings' : 'Impostazioni Avanzate',
      'usernav.logout': currentLanguage === 'en' ? 'Log out' : 'Log out',
      'usernav.logging_out': currentLanguage === 'en' ? 'Logging out...' : 'Uscita...',

      // NavbarSecondariaDay component specific translations
      'navbar_day.previous_day': currentLanguage === 'en' ? 'Previous day' : 'Giorno precedente',
      'navbar_day.next_day': currentLanguage === 'en' ? 'Next day' : 'Giorno successivo',
      'navbar_day.decrease_zoom': currentLanguage === 'en' ? 'Decrease zoom' : 'Diminuisci zoom',
      'navbar_day.increase_zoom': currentLanguage === 'en' ? 'Increase zoom' : 'Aumenta zoom',
      'navbar_day.current_date_time': currentLanguage === 'en' ? 'Current date and time' : 'Data e ora corrente',
      'navbar_day.team_members': currentLanguage === 'en' ? 'Team members' : 'Membri del team',
      'navbar_day.loading': currentLanguage === 'en' ? 'Loading...' : 'Caricamento...',
      'navbar_day.filter_by_group': currentLanguage === 'en' ? 'Filter by group' : 'Filtra per gruppo',
      'navbar_day.all_members': currentLanguage === 'en' ? 'All members' : 'Tutti i membri',
      'navbar_day.no_members_available': currentLanguage === 'en' ? 'No members available' : 'Nessun membro disponibile',
      'navbar_day.verify_members_salon': currentLanguage === 'en' ? 'Verify that members are correctly associated with the salon.' : 'Verifica che i membri siano associati correttamente al salone.',
      'navbar_day.refresh_page': currentLanguage === 'en' ? 'If you just added members, refresh the page.' : 'Se hai appena aggiunto membri, aggiorna la pagina.',
      'navbar_day.close': currentLanguage === 'en' ? 'Close' : 'Chiudi',
      'navbar_day.filter_by_status': currentLanguage === 'en' ? 'Filter by status' : 'Filtra per stato',
      'navbar_day.select_statuses_to_show': currentLanguage === 'en' ? 'Select statuses to show' : 'Seleziona gli stati da visualizzare',
      'navbar_day.booking': currentLanguage === 'en' ? 'Booking' : 'Prenotazione',
      'navbar_day.payment': currentLanguage === 'en' ? 'Payment' : 'Pagamento',
      'navbar_day.billing': currentLanguage === 'en' ? 'Billing' : 'Fatturazione',
      'navbar_day.management': currentLanguage === 'en' ? 'Management' : 'Gestione',
      'navbar_day.remove_all_filters': currentLanguage === 'en' ? 'Remove all filters' : 'Rimuovi tutti i filtri',
      'navbar_day.hide_deleted_appointments': currentLanguage === 'en' ? 'Hide deleted appointments' : 'Nascondi appuntamenti eliminati',
      'navbar_day.show_deleted_appointments': currentLanguage === 'en' ? 'Show deleted appointments' : 'Mostra appuntamenti eliminati',

      // PermessiFerie page component specific translations
      'permessi.work_hours_update': currentLanguage === 'en' ? 'Work hours update' : 'Aggiornamento ore lavorate',
      'permessi.new_hours_registered': currentLanguage === 'en' ? 'New hours registered' : 'Nuove ore registrate',
      'permessi.hours_updated': currentLanguage === 'en' ? 'Hours updated' : 'Ore aggiornate',
      'permessi.hours_deleted': currentLanguage === 'en' ? 'Hours deleted' : 'Ore eliminate',

      // Change Password Component Translations
      'password.security_title': currentLanguage === 'en' ? 'Account Security' : 'Sicurezza Account',
      'password.security_desc': currentLanguage === 'en' ? 'Change your password to keep your account secure' : 'Modifica la tua password per mantenere sicuro il tuo account',
      'password.requirements_title': currentLanguage === 'en' ? 'Password Requirements' : 'Requisiti Password',
      'password.requirement_1': currentLanguage === 'en' ? 'At least 8 characters' : 'Almeno 8 caratteri',
      'password.requirement_2': currentLanguage === 'en' ? 'Combine uppercase and lowercase letters' : 'Combina lettere maiuscole e minuscole',
      'password.requirement_3': currentLanguage === 'en' ? 'Include at least one number' : 'Includi almeno un numero',
      'password.requirement_4': currentLanguage === 'en' ? 'Use special characters (@, #, $, etc.)' : 'Usa caratteri speciali (@, #, $, etc.)',
      'password.change_title': currentLanguage === 'en' ? 'Change Password' : 'Modifica Password',
      'password.current_password': currentLanguage === 'en' ? 'Current Password' : 'Password Attuale',
      'password.current_placeholder': currentLanguage === 'en' ? 'Enter your current password' : 'Inserisci la password attuale',
      'password.new_password': currentLanguage === 'en' ? 'New Password' : 'Nuova Password',
      'password.new_placeholder': currentLanguage === 'en' ? 'Enter your new password' : 'Inserisci la nuova password',
      'password.confirm_password': currentLanguage === 'en' ? 'Confirm New Password' : 'Conferma Nuova Password',
      'password.confirm_placeholder': currentLanguage === 'en' ? 'Repeat the new password' : 'Ripeti la nuova password',
      'password.update_button': currentLanguage === 'en' ? 'Update Password' : 'Aggiorna Password',
      'password.updating': currentLanguage === 'en' ? 'Updating...' : 'Aggiornamento...',
      'password.passwords_dont_match': currentLanguage === 'en' ? 'Passwords do not match' : 'Le password non coincidono',
      'password.too_short': currentLanguage === 'en' ? 'Password must be at least 8 characters long' : 'La password deve essere lunga almeno 8 caratteri',
      'password.success': currentLanguage === 'en' ? 'Password changed successfully' : 'Password modificata con successo',
      'password.error': currentLanguage === 'en' ? 'Error changing password' : 'Errore durante il cambio password',

      // Appointment Modal Settings
      'appointment_modal.title': currentLanguage === 'en' ? 'Appointment Modal Customization' : 'Personalizzazione Modal Appuntamento',
      'appointment_modal.description': currentLanguage === 'en' ? 'Customize texts, features and layout of the new appointment modal' : 'Personalizza testi, funzionalità e layout del modal di nuovo appuntamento',
      'appointment_modal.sections': currentLanguage === 'en' ? 'Sections' : 'Sezioni',
      'appointment_modal.sections_description': currentLanguage === 'en' ? 'Customize the appointment modal' : 'Personalizza il modal appuntamento',
      
      // Section names
      'appointment_modal.sections.texts': currentLanguage === 'en' ? 'Modal Texts' : 'Testi del Modal',
      'appointment_modal.sections.titles': currentLanguage === 'en' ? 'Section Titles' : 'Titoli delle Sezioni',
      'appointment_modal.sections.labels': currentLanguage === 'en' ? 'Field Labels' : 'Etichette dei Campi',
      'appointment_modal.sections.features': currentLanguage === 'en' ? 'Features' : 'Funzionalità',
      'appointment_modal.sections.validation': currentLanguage === 'en' ? 'Field Validation' : 'Validazione Campi',
      'appointment_modal.sections.colors': currentLanguage === 'en' ? 'Custom Colors' : 'Colori Personalizzati',
      'appointment_modal.sections.messages': currentLanguage === 'en' ? 'Validation Messages' : 'Messaggi di Validazione',
      
      // Actions
      'appointment_modal.actions.reset_default': currentLanguage === 'en' ? 'Reset Default' : 'Reset Default',
      'appointment_modal.actions.save_settings': currentLanguage === 'en' ? 'Save Settings' : 'Salva Impostazioni',
      'appointment_modal.actions.saving': currentLanguage === 'en' ? 'Saving...' : 'Salvataggio...',
      'appointment_modal.actions.reset': currentLanguage === 'en' ? 'Reset...' : 'Reset...',
      
      // Success message
      'appointment_modal.success.saved': currentLanguage === 'en' ? 'Settings saved successfully! Changes are now active in the modal.' : 'Impostazioni salvate con successo! Le modifiche sono ora attive nel modal.',
      
      // Modal texts section
      'appointment_modal.texts.modal_title': currentLanguage === 'en' ? 'Modal Title' : 'Titolo del Modal',
      'appointment_modal.texts.modal_title_placeholder': currentLanguage === 'en' ? 'New Appointment' : 'Nuovo Appuntamento',
      'appointment_modal.texts.modal_title_desc': currentLanguage === 'en' ? 'This title will appear in the header of the new appointment modal' : 'Questo titolo apparirà nell\'header del modal di nuovo appuntamento',
      'appointment_modal.texts.modal_subtitle': currentLanguage === 'en' ? 'Modal Subtitle' : 'Sottotitolo del Modal',
      'appointment_modal.texts.modal_subtitle_placeholder': currentLanguage === 'en' ? 'Enter an optional subtitle' : 'Inserisci un sottotitolo opzionale',
      'appointment_modal.texts.modal_subtitle_desc': currentLanguage === 'en' ? 'Optional subtitle that will appear under the main title' : 'Sottotitolo opzionale che apparirà sotto il titolo principale',
      
      // Section titles
      'appointment_modal.titles.client_section': currentLanguage === 'en' ? 'Client Section Title' : 'Titolo Sezione Cliente',
      'appointment_modal.titles.client_section_placeholder': currentLanguage === 'en' ? 'Client' : 'Cliente',
      'appointment_modal.titles.service_section': currentLanguage === 'en' ? 'Services Section Title' : 'Titolo Sezione Servizi',
      'appointment_modal.titles.service_section_placeholder': currentLanguage === 'en' ? 'Services' : 'Servizi',
      'appointment_modal.titles.time_section': currentLanguage === 'en' ? 'Time Section Title' : 'Titolo Sezione Orari',
      'appointment_modal.titles.time_section_placeholder': currentLanguage === 'en' ? 'Date and Time' : 'Data e Orario',
      'appointment_modal.titles.notes_section': currentLanguage === 'en' ? 'Notes Section Title' : 'Titolo Sezione Note',
      'appointment_modal.titles.notes_section_placeholder': currentLanguage === 'en' ? 'Notes' : 'Note',
      
      // Field labels
      'appointment_modal.labels.client_name': currentLanguage === 'en' ? 'Client Name Label' : 'Etichetta Nome Cliente',
      'appointment_modal.labels.client_name_placeholder': currentLanguage === 'en' ? 'Client Name' : 'Nome Cliente',
      'appointment_modal.labels.client_phone': currentLanguage === 'en' ? 'Phone Label' : 'Etichetta Telefono',
      'appointment_modal.labels.client_phone_placeholder': currentLanguage === 'en' ? 'Phone' : 'Telefono',
      'appointment_modal.labels.client_email': currentLanguage === 'en' ? 'Email Label' : 'Etichetta Email',
      'appointment_modal.labels.client_email_placeholder': currentLanguage === 'en' ? 'Email' : 'Email',
      'appointment_modal.labels.service': currentLanguage === 'en' ? 'Service Label' : 'Etichetta Servizio',
      'appointment_modal.labels.service_placeholder': currentLanguage === 'en' ? 'Service' : 'Servizio',
      
      // Features
      'appointment_modal.features.show_client_section': currentLanguage === 'en' ? 'Show Client Section' : 'Mostra Sezione Cliente',
      'appointment_modal.features.show_client_section_desc': currentLanguage === 'en' ? 'Shows or hides the entire client section' : 'Mostra o nasconde l\'intera sezione cliente',
      'appointment_modal.features.client_search': currentLanguage === 'en' ? 'Client Search' : 'Ricerca Cliente',
      'appointment_modal.features.client_search_desc': currentLanguage === 'en' ? 'Allows searching for existing clients' : 'Permette di cercare clienti esistenti',
      'appointment_modal.features.new_client': currentLanguage === 'en' ? 'New Client Creation' : 'Creazione Nuovo Cliente',
      'appointment_modal.features.new_client_desc': currentLanguage === 'en' ? 'Allows creating new clients' : 'Permette di creare nuovi clienti',
      'appointment_modal.features.service_selection': currentLanguage === 'en' ? 'Service Selection' : 'Selezione Servizi',
      'appointment_modal.features.service_selection_desc': currentLanguage === 'en' ? 'Allows selecting services' : 'Permette di selezionare servizi',
      'appointment_modal.features.show_service_section': currentLanguage === 'en' ? 'Show Service Section' : 'Mostra Sezione Servizi',
      'appointment_modal.features.show_service_section_desc': currentLanguage === 'en' ? 'Shows or hides the entire service section' : 'Mostra o nasconde l\'intera sezione servizi',
      'appointment_modal.features.show_time_section': currentLanguage === 'en' ? 'Show Time Section' : 'Mostra Sezione Orari',
      'appointment_modal.features.show_time_section_desc': currentLanguage === 'en' ? 'Shows or hides the entire time section' : 'Mostra o nasconde l\'intera sezione orari',
      'appointment_modal.features.show_team_section': currentLanguage === 'en' ? 'Show Staff Section' : 'Mostra Sezione Staff',
      'appointment_modal.features.show_team_section_desc': currentLanguage === 'en' ? 'Shows or hides the entire staff section' : 'Mostra o nasconde l\'intera sezione staff',
      'appointment_modal.features.show_notes_section': currentLanguage === 'en' ? 'Show Notes Section' : 'Mostra Sezione Note',
      'appointment_modal.features.show_notes_section_desc': currentLanguage === 'en' ? 'Shows or hides the notes section' : 'Mostra o nasconde la sezione note',
      'appointment_modal.features.show_notifications_section': currentLanguage === 'en' ? 'Show Notifications Section' : 'Mostra Sezione Notifiche',
      'appointment_modal.features.show_notifications_section_desc': currentLanguage === 'en' ? 'Shows or hides the notifications section' : 'Mostra o nasconde la sezione notifiche',
      'appointment_modal.features.show_color_section': currentLanguage === 'en' ? 'Show Color Section' : 'Mostra Sezione Colori',
      'appointment_modal.features.show_color_section_desc': currentLanguage === 'en' ? 'Shows or hides the color section' : 'Mostra o nasconde la sezione colori',
      'appointment_modal.features.multiple_services': currentLanguage === 'en' ? 'Multiple Services' : 'Servizi Multipli',
      'appointment_modal.features.multiple_services_desc': currentLanguage === 'en' ? 'Allows adding multiple services' : 'Permette di aggiungere più servizi',
      'appointment_modal.features.price_editing': currentLanguage === 'en' ? 'Price Editing' : 'Modifica Prezzo',
      'appointment_modal.features.price_editing_desc': currentLanguage === 'en' ? 'Allows editing the price' : 'Permette di modificare il prezzo',
      'appointment_modal.features.notes': currentLanguage === 'en' ? 'Notes' : 'Note',
      'appointment_modal.features.notes_desc': currentLanguage === 'en' ? 'Allows adding notes' : 'Permette di aggiungere note',
      
      // Validation
      'appointment_modal.validation.client_name_required': currentLanguage === 'en' ? 'Client Name Required' : 'Nome Cliente Obbligatorio',
      'appointment_modal.validation.client_name_required_desc': currentLanguage === 'en' ? 'Requires client name' : 'Richiede il nome del cliente',
      'appointment_modal.validation.client_phone_required': currentLanguage === 'en' ? 'Phone Required' : 'Telefono Obbligatorio',
      'appointment_modal.validation.client_phone_required_desc': currentLanguage === 'en' ? 'Requires client phone' : 'Richiede il telefono del cliente',
      'appointment_modal.validation.client_email_required': currentLanguage === 'en' ? 'Email Required' : 'Email Obbligatoria',
      'appointment_modal.validation.client_email_required_desc': currentLanguage === 'en' ? 'Requires client email' : 'Richiede l\'email del cliente',
      'appointment_modal.validation.service_required': currentLanguage === 'en' ? 'Service Required' : 'Servizio Obbligatorio',
      'appointment_modal.validation.service_required_desc': currentLanguage === 'en' ? 'Requires service selection' : 'Richiede la selezione di un servizio',
      
      // Colors
      'appointment_modal.colors.primary': currentLanguage === 'en' ? 'Primary Color' : 'Colore Primario',
      'appointment_modal.colors.secondary': currentLanguage === 'en' ? 'Secondary Color' : 'Colore Secondario',
      'appointment_modal.colors.success': currentLanguage === 'en' ? 'Success Color' : 'Colore Successo',
      'appointment_modal.colors.error': currentLanguage === 'en' ? 'Error Color' : 'Colore Errore',
      
      // Validation messages
      'appointment_modal.messages.required_field': currentLanguage === 'en' ? 'Required Field Message' : 'Messaggio Campo Obbligatorio',
      'appointment_modal.messages.required_field_placeholder': currentLanguage === 'en' ? 'Required field' : 'Campo obbligatorio',
      'appointment_modal.messages.invalid_email': currentLanguage === 'en' ? 'Invalid Email Message' : 'Messaggio Email Non Valida',
      'appointment_modal.messages.invalid_email_placeholder': currentLanguage === 'en' ? 'Invalid email' : 'Email non valida',
      'appointment_modal.messages.invalid_phone': currentLanguage === 'en' ? 'Invalid Phone Message' : 'Messaggio Telefono Non Valido',
      'appointment_modal.messages.invalid_phone_placeholder': currentLanguage === 'en' ? 'Invalid phone number' : 'Telefono non valido',
      
      // Loading and error states
      'appointment_modal.loading': currentLanguage === 'en' ? 'Loading settings...' : 'Caricamento impostazioni...',
      'appointment_modal.error.loading': currentLanguage === 'en' ? 'Error loading settings' : 'Errore nel caricamento delle impostazioni',
      'appointment_modal.error.general': currentLanguage === 'en' ? 'Error loading settings' : 'Errore nel caricamento delle impostazioni',
      'appointment_modal.retry': currentLanguage === 'en' ? 'Retry' : 'Riprova',

      // Form component specific translations
      'form.modal_title': currentLanguage === 'en' ? 'Modal Title' : 'Titolo del Modal',
      'form.modal_subtitle': currentLanguage === 'en' ? 'Modal Subtitle' : 'Sottotitolo del Modal',
      'form.date_label': currentLanguage === 'en' ? 'Date' : 'Data',
      'form.start_time_label': currentLanguage === 'en' ? 'Start Time' : 'Orario di inizio',
      'form.end_time_label': currentLanguage === 'en' ? 'End Time' : 'Orario di fine',
      'form.time_placeholder': currentLanguage === 'en' ? 'Select time' : 'Seleziona orario',
      'form.team_section_title': currentLanguage === 'en' ? 'Staff and Notes' : 'Staff e Note',
      'form.team_member_label': currentLanguage === 'en' ? 'Staff Member' : 'Membro Staff',
      'form.team_member_placeholder': currentLanguage === 'en' ? 'Select staff member' : 'Seleziona membro staff',
      'form.notes_label': currentLanguage === 'en' ? 'Notes' : 'Note',
      'form.notifications_section_title': currentLanguage === 'en' ? 'Notifications' : 'Notifiche',
      'form.notify_client_label': currentLanguage === 'en' ? 'Send notification to client' : 'Invia notifica al cliente',
      'form.color_section_title': currentLanguage === 'en' ? 'Card Colors' : 'Colori Card',
      'form.color_card_label': currentLanguage === 'en' ? 'Card Color (max 2)' : 'Colore card (max 2)',
      'form.card_style_label': currentLanguage === 'en' ? 'Where to apply the color' : 'Dove applicare il colore',
      'form.cancel_button_text': currentLanguage === 'en' ? 'Cancel' : 'Annulla',
      'form.save_button_text': currentLanguage === 'en' ? 'Create Appointment' : 'Crea Appuntamento',
      'form.end_time_before_start_message': currentLanguage === 'en' ? 'End time must be greater than or equal to start time.' : 'L\'orario di fine deve essere maggiore o uguale all\'orario di inizio.',
      
      // Section visibility settings
      'form.show_client_section': currentLanguage === 'en' ? 'Show Client Section' : 'Mostra Sezione Cliente',
      'form.show_service_section': currentLanguage === 'en' ? 'Show Service Section' : 'Mostra Sezione Servizi',
      'form.show_time_section': currentLanguage === 'en' ? 'Show Time Section' : 'Mostra Sezione Orari',
      'form.show_team_section': currentLanguage === 'en' ? 'Show Staff Section' : 'Mostra Sezione Staff',
      'form.show_notes_section': currentLanguage === 'en' ? 'Show Notes Section' : 'Mostra Sezione Note',
      'form.show_notifications_section': currentLanguage === 'en' ? 'Show Notifications Section' : 'Mostra Sezione Notifiche',
      'form.show_color_section': currentLanguage === 'en' ? 'Show Color Section' : 'Mostra Sezione Colori',


    }
    
    return texts[key as keyof typeof texts] || defaultValue || key
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    return dateObj.toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'it-IT', options)
  }

  const formatNumber = (number: number) => {
    return number.toLocaleString(currentLanguage === 'en' ? 'en-US' : 'it-IT')
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(currentLanguage === 'en' ? 'en-US' : 'it-IT', {
      style: 'currency',
      currency: currentLanguage === 'en' ? 'USD' : 'EUR'
    })
  }

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit'
    }
    return dateObj.toLocaleTimeString(currentLanguage === 'en' ? 'en-US' : 'it-IT', options)
  }

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_language', lang)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('preferred_language') as Language
      if (savedLanguage && (savedLanguage === 'it' || savedLanguage === 'en')) {
        setCurrentLanguage(savedLanguage)
      }
    }
  }, [])

  const value: LocalizationContextType = {
    currentLanguage,
    setLanguage,
    t,
    formatDate,
    formatNumber,
    formatCurrency,
    formatTime
  }

  return React.createElement(
    LocalizationContext.Provider,
    { value: value },
    children
  )
}
