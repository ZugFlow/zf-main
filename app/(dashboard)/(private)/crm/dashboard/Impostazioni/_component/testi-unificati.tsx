'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'react-hot-toast'
import { createClient } from '@/utils/supabase/client'
import { getSalonId } from '@/utils/getSalonId'
import { 
  Mail, 
  Save, 
  RotateCcw, 
  Eye, 
  FileText, 
  Code,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Loader2,
  Maximize2,
  Variable,
  Plus,
  Trash2,
  Search,
  Info
} from 'lucide-react'

// Interfacce per i template email
interface EmailTemplate {
  id: string
  template_type: string
  subject: string
  html_content: string
  text_content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface TemplateVariables {
  customer_name: string
  service_name: string
  appointment_date: string
  appointment_time: string
  salon_name: string
  salon_address?: string
  salon_phone?: string
}

// Interfacce per le variabili personalizzabili
interface CustomVariable {
  id: string
  variable_name: string
  variable_value: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function TestiUnificatiManager() {
  // Stati per i template email
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [templateLoading, setTemplateLoading] = useState(true)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [activeTemplateTab, setActiveTemplateTab] = useState('confirmation')
  const [previewMode, setPreviewMode] = useState<'text'>('text')
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  // Stati per le variabili personalizzabili
  const [variables, setVariables] = useState<CustomVariable[]>([])
  const [variableLoading, setVariableLoading] = useState(true)
  const [variableSaving, setVariableSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingVariable, setEditingVariable] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editValue, setEditValue] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newVariableName, setNewVariableName] = useState('')
  const [newVariableValue, setNewVariableValue] = useState('')
  const [newVariableDescription, setNewVariableDescription] = useState('')
  const [viewMode, setViewMode] = useState<'text'>('text')

  // Tab principale
  const [mainTab, setMainTab] = useState('templates')
  
  const supabase = createClient()

  // Template di esempio per preview
  const sampleData: TemplateVariables = {
    customer_name: 'Mario Rossi',
    service_name: 'Taglio e Piega',
    appointment_date: '15 Dicembre 2024',
    appointment_time: '14:30',
    salon_name: 'Il Mio Salone',
    salon_address: 'Via Roma 123, Milano',
    salon_phone: '+39 02 1234567'
  }

  const templateTypes = [
    { value: 'confirmation', label: 'Conferma Prenotazione', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    { value: 'cancellation', label: 'Cancellazione Prenotazione', icon: XCircle, color: 'bg-red-100 text-red-800' },
    { value: 'modification', label: 'Modifica Prenotazione', icon: RefreshCw, color: 'bg-orange-100 text-orange-800' }
  ]

  // Variabili predefinite del sistema
  const systemVariables = [
    {
      name: '{{CLIENT_NAME}}',
      description: 'Nome del cliente',
      example: 'Mario Rossi'
    },
    {
      name: '{{SERVICE_NAME}}',
      description: 'Nome del servizio prenotato',
      example: 'Taglio e piega'
    },
    {
      name: '{{APPOINTMENT_DATE}}',
      description: 'Data dell\'appuntamento',
      example: '15/12/2024'
    },
    {
      name: '{{APPOINTMENT_TIME}}',
      description: 'Orario dell\'appuntamento',
      example: '14:30'
    },
    {
      name: '{{SALON_NAME}}',
      description: 'Nome del salone',
      example: 'Beauty Salon'
    },
    {
      name: '{{PHONE_NUMBER}}',
      description: 'Numero di telefono del salone',
      example: '+39 123 456 789'
    }
  ]

  useEffect(() => {
    if (mainTab === 'templates') {
      fetchTemplates()
    } else {
      fetchVariables()
    }
  }, [mainTab])

  // Prevenire scroll del body quando il modal è aperto
  useEffect(() => {
    if (previewModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [previewModalOpen])

  // ===== FUNZIONI PER I TEMPLATE EMAIL =====
  const fetchTemplates = async () => {
    try {
      setTemplateLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const salonId = await getSalonId()
      if (!salonId) {
        console.error('Impossibile determinare il salone')
        toast.error('Impossibile determinare il salone')
        return
      }

      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('salon_id', salonId)
        .eq('is_active', true)
        .order('template_type')

      if (error) {
        console.error('Errore nel caricamento dei template:', error)
        toast.error('Errore nel caricamento dei template')
        return
      }

      setTemplates(data || [])
    } catch (error) {
      console.error('Errore nel caricamento dei template:', error)
      toast.error('Errore nel caricamento dei template')
    } finally {
      setTemplateLoading(false)
    }
  }

  const getCurrentTemplate = () => {
    return templates.find(t => t.template_type === activeTemplateTab)
  }

  const updateTemplate = (field: keyof EmailTemplate, value: string) => {
    setTemplates(prev => 
      prev.map(template => 
        template.template_type === activeTemplateTab 
          ? { ...template, [field]: value }
          : template
      )
    )
  }

  const saveTemplate = async () => {
    try {
      setTemplateSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const salonId = await getSalonId()
      if (!salonId) {
        console.error('Impossibile determinare il salone')
        toast.error('Impossibile determinare il salone')
        return
      }

      const currentTemplate = getCurrentTemplate()
      if (!currentTemplate) return

      // Prima disattiva tutti i template di questo tipo
      await supabase
        .from('email_templates')
        .update({ is_active: false })
        .eq('salon_id', salonId)
        .eq('template_type', activeTemplateTab)

      // Poi inserisci il nuovo template
      const { error } = await supabase
        .from('email_templates')
        .insert({
          salon_id: salonId,
          template_type: activeTemplateTab,
          subject: currentTemplate.subject,
          html_content: currentTemplate.text_content, // Usa il testo come HTML
          text_content: currentTemplate.text_content,
          is_active: true
        })

      if (error) {
        console.error('Errore nel salvataggio del template:', error)
        toast.error('Errore nel salvataggio del template')
        return
      }

      toast.success('Template salvato con successo')
      await fetchTemplates()
    } catch (error) {
      console.error('Errore nel salvataggio del template:', error)
      toast.error('Errore nel salvataggio del template')
    } finally {
      setTemplateSaving(false)
    }
  }

  const resetToDefault = async () => {
    try {
      setTemplateSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const salonId = await getSalonId()
      if (!salonId) {
        console.error('Impossibile determinare il salone')
        toast.error('Impossibile determinare il salone')
        return
      }

      // Disattiva il template corrente
      await supabase
        .from('email_templates')
        .update({ is_active: false })
        .eq('salon_id', salonId)
        .eq('template_type', activeTemplateTab)

      toast.success('Template reimpostato ai valori di default')
      await fetchTemplates()
    } catch (error) {
      console.error('Errore nel reset del template:', error)
      toast.error('Errore nel reset del template')
    } finally {
      setTemplateSaving(false)
    }
  }

  const renderPreview = () => {
    const currentTemplate = getCurrentTemplate()
    if (!currentTemplate) return null

    let content = currentTemplate.text_content

    // Sostituisci le variabili con i dati di esempio
    Object.entries(sampleData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, value || '')
    })

    // Gestisci le condizioni Handlebars semplici
    content = content.replace(/\{\{#if salon_address\}\}(.*?)\{\{\/if\}\}/g, sampleData.salon_address ? '$1' : '')
    content = content.replace(/\{\{#if salon_phone\}\}(.*?)\{\{\/if\}\}/g, sampleData.salon_phone ? '$1' : '')

    return (
      <pre className="border rounded-lg p-4 bg-gray-50 overflow-y-auto whitespace-pre-wrap text-sm"
           style={{ minHeight: '400px' }}>
        {content}
      </pre>
    )
  }

  // ===== FUNZIONI PER LE VARIABILI PERSONALIZZABILI =====
  const fetchVariables = async () => {
    try {
      setVariableLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const salonId = await getSalonId()
      if (!salonId) {
        toast.error('Impossibile determinare il salone')
        return
      }

      const { data, error } = await supabase
        .from('custom_variables')
        .select('*')
        .eq('salon_id', salonId)
        .eq('is_active', true)
        .order('variable_name')

      if (error) {
        toast.error('Errore nel caricamento delle variabili')
        return
      }

      setVariables(data || [])
    } catch (error) {
      toast.error('Errore nel caricamento delle variabili')
    } finally {
      setVariableLoading(false)
    }
  }

  const getVariableByName = (name: string) => {
    return variables.find(v => v.variable_name === name)
  }

  const startEditing = (variableName: string) => {
    const variable = getVariableByName(variableName)
    if (variable) {
      setEditingVariable(variableName)
      setEditName(variable.variable_name)
      setEditValue(variable.variable_value)
      setEditDescription(variable.description)
    }
  }

  const cancelEditing = () => {
    setEditingVariable(null)
    setEditName('')
    setEditValue('')
    setEditDescription('')
  }

  const saveVariable = async (variableName: string) => {
    try {
      setVariableSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const salonId = await getSalonId()
      if (!salonId) {
        toast.error('Impossibile determinare il salone')
        return
      }

      // Validazione formato nome variabile
      const variableNamePattern = /^\{\{[A-Z_][A-Z0-9_]*\}\}$/
      if (!variableNamePattern.test(editName.trim())) {
        toast.error('Il nome della variabile deve essere nel formato {{NOME_VARIABILE}}')
        return
      }

      // Disattiva la variabile corrente
      await supabase
        .from('custom_variables')
        .update({ is_active: false })
        .eq('salon_id', salonId)
        .eq('variable_name', variableName)

      // Inserisci la nuova variabile
      const { error } = await supabase
        .from('custom_variables')
        .insert({
          salon_id: salonId,
          variable_name: editName,
          variable_value: editValue,
          description: editDescription,
          is_active: true
        })

      if (error) {
        toast.error('Errore nel salvataggio della variabile')
        return
      }

      toast.success('Variabile salvata con successo')
      await fetchVariables()
      cancelEditing()
    } catch (error) {
      toast.error('Errore nel salvataggio della variabile')
    } finally {
      setVariableSaving(false)
    }
  }

  const deleteVariable = async (variableName: string) => {
    try {
      setVariableSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const salonId = await getSalonId()
      if (!salonId) {
        toast.error('Impossibile determinare il salone')
        return
      }

      // Disattiva la variabile
      const { error } = await supabase
        .from('custom_variables')
        .update({ is_active: false })
        .eq('salon_id', salonId)
        .eq('variable_name', variableName)

      if (error) {
        toast.error('Errore nella cancellazione della variabile')
        return
      }

      toast.success('Variabile eliminata con successo')
      await fetchVariables()
    } catch (error) {
      toast.error('Errore nella cancellazione della variabile')
    } finally {
      setVariableSaving(false)
    }
  }

  const addNewVariable = async () => {
    try {
      setVariableSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const salonId = await getSalonId()
      if (!salonId) {
        toast.error('Impossibile determinare il salone')
        return
      }

      if (!newVariableName.trim() || !newVariableValue.trim()) {
        toast.error('Nome e valore della variabile sono obbligatori')
        return
      }

      // Validazione formato nome variabile
      const variableNamePattern = /^\{\{[A-Z_][A-Z0-9_]*\}\}$/
      if (!variableNamePattern.test(newVariableName.trim())) {
        toast.error('Il nome della variabile deve essere nel formato {{NOME_VARIABILE}}')
        return
      }

      // Verifica se la variabile esiste già
      const existingVariable = getVariableByName(newVariableName.trim())
      if (existingVariable) {
        toast.error('Una variabile con questo nome esiste già')
        return
      }

      const { error } = await supabase
        .from('custom_variables')
        .insert({
          salon_id: salonId,
          variable_name: newVariableName.trim(),
          variable_value: newVariableValue.trim(),
          description: newVariableDescription.trim(),
          is_active: true
        })

      if (error) {
        toast.error('Errore nell\'aggiunta della variabile')
        return
      }

      toast.success('Variabile aggiunta con successo')
      await fetchVariables()
      setShowAddForm(false)
      setNewVariableName('')
      setNewVariableValue('')
      setNewVariableDescription('')
    } catch (error) {
      toast.error('Errore nell\'aggiunta della variabile')
    } finally {
      setVariableSaving(false)
    }
  }

  const filteredVariables = variables.filter(variable => 
    variable.variable_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variable.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variable.variable_value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderVariableValue = (value: string) => {
    return <p className="text-sm mt-1 whitespace-pre-wrap">{value}</p>
  }

  const getTemplateIcon = (type: string) => {
    const templateType = templateTypes.find(t => t.value === type)
    return templateType ? templateType.icon : AlertCircle
  }

  const getTemplateColor = (type: string) => {
    const templateType = templateTypes.find(t => t.value === type)
    return templateType ? templateType.color : 'bg-gray-100 text-gray-800'
  }

  if (templateLoading && mainTab === 'templates') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Caricamento template email...</span>
        </div>
      </div>
    )
  }

  if (variableLoading && mainTab === 'variables') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Caricamento variabili...</span>
        </div>
      </div>
    )
  }

  const currentTemplate = getCurrentTemplate()

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 relative">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gestione Testi e Template</h2>
            <p className="text-sm text-gray-600">Personalizza template email e variabili per i tuoi messaggi</p>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Template Email
          </TabsTrigger>
          <TabsTrigger value="variables" className="flex items-center gap-2">
            <Variable className="w-4 h-4" />
            Variabili Personalizzabili
          </TabsTrigger>
        </TabsList>

        {/* Template Email Tab */}
        <TabsContent value="templates" className="mt-6">
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Template Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTemplateTab} onValueChange={setActiveTemplateTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  {templateTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <TabsTrigger key={type.value} value={type.value} className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {templateTypes.map((type) => (
                  <TabsContent key={type.value} value={type.value} className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Editor Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            {(() => {
                              const IconComponent = type.icon;
                              return <IconComponent className="w-5 h-5" />;
                            })()}
                            {type.label}
                          </h3>
                          <Badge className={type.color}>
                            {currentTemplate ? 'Personalizzato' : 'Default'}
                          </Badge>
                        </div>

                        {/* Subject */}
                        <div className="space-y-2">
                          <Label htmlFor="subject">Oggetto Email</Label>
                          <Input
                            id="subject"
                            value={currentTemplate?.subject || ''}
                            onChange={(e) => updateTemplate('subject', e.target.value)}
                            placeholder="Inserisci l'oggetto dell'email"
                          />
                        </div>

                        {/* Content Editor */}
                        <div className="space-y-2">
                          <Label>Contenuto Email</Label>
                          <Textarea
                            value={currentTemplate?.text_content || ''}
                            onChange={(e) => updateTemplate('text_content', e.target.value)}
                            placeholder="Inserisci il contenuto dell'email. Puoi usare variabili come {{customer_name}}, {{service_name}}, ecc."
                            rows={15}
                            className="font-mono text-sm"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4">
                          <Button 
                            onClick={saveTemplate}
                            disabled={templateSaving || !currentTemplate}
                            className="flex items-center gap-2"
                          >
                            {templateSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {templateSaving ? 'Salvando...' : 'Salva Template'}
                          </Button>
                          
                          <Button 
                            variant="outline"
                            onClick={resetToDefault}
                            disabled={templateSaving}
                            className="flex items-center gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Reset Default
                          </Button>
                        </div>
                      </div>

                      {/* Preview Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Anteprima</h3>
                          
                          <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <Maximize2 className="w-4 h-4" />
                                Anteprima Completa
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Eye className="w-5 h-5" />
                                  Anteprima Email - {templateTypes.find(t => t.value === activeTemplateTab)?.label}
                                </DialogTitle>
                              </DialogHeader>
                              
                              <div className="space-y-4 overflow-hidden flex flex-col" style={{ height: 'calc(90vh - 120px)' }}>
                                {/* Dati di esempio */}
                                <div className="bg-blue-50 p-4 rounded-lg flex-shrink-0">
                                  <h4 className="font-semibold mb-2 text-blue-900">Dati di Esempio:</h4>
                                  <div className="text-sm space-y-1 text-blue-800">
                                    <div><strong>Cliente:</strong> {sampleData.customer_name}</div>
                                    <div><strong>Servizio:</strong> {sampleData.service_name}</div>
                                    <div><strong>Data:</strong> {sampleData.appointment_date}</div>
                                    <div><strong>Orario:</strong> {sampleData.appointment_time}</div>
                                    <div><strong>Salone:</strong> {sampleData.salon_name}</div>
                                    {sampleData.salon_address && <div><strong>Indirizzo:</strong> {sampleData.salon_address}</div>}
                                    {sampleData.salon_phone && <div><strong>Telefono:</strong> {sampleData.salon_phone}</div>}
                                  </div>
                                </div>
                                
                                {/* Anteprima */}
                                <div className="flex-1 mt-4 overflow-hidden min-h-0">
                                  <div className="h-full overflow-y-auto border rounded-lg">
                                    {renderPreview()}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="border rounded-lg p-4 bg-white overflow-y-auto" style={{ minHeight: '400px' }}>
                          {renderPreview()}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Variables Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Variabili Disponibili
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Variabili Principali:</h4>
                  <div className="space-y-1 text-sm">
                    <div><code className="bg-gray-100 px-1 rounded">{'{{customer_name}}'}</code> - Nome del cliente</div>
                    <div><code className="bg-gray-100 px-1 rounded">{'{{service_name}}'}</code> - Nome del servizio</div>
                    <div><code className="bg-gray-100 px-1 rounded">{'{{appointment_date}}'}</code> - Data appuntamento</div>
                    <div><code className="bg-gray-100 px-1 rounded">{'{{appointment_time}}'}</code> - Orario appuntamento</div>
                    <div><code className="bg-gray-100 px-1 rounded">{'{{salon_name}}'}</code> - Nome del salone</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Variabili Condizionali:</h4>
                  <div className="space-y-1 text-sm">
                    <div><code className="bg-gray-100 px-1 rounded">{'{{salon_address}}'}</code> - Indirizzo salone</div>
                    <div><code className="bg-gray-100 px-1 rounded">{'{{salon_phone}}'}</code> - Telefono salone</div>
                    <div className="mt-2">
                      <strong>Condizioni:</strong>
                      <div className="text-xs mt-1">
                        <code className="bg-blue-100 px-1 rounded">{'{{#if salon_address}}...{{/if}}'}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Stato Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templateTypes.map((type) => {
                  const template = templates.find(t => t.template_type === type.value)
                  const Icon = type.icon
                  return (
                    <div key={type.value} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Icon className="w-5 h-5" />
                      <div className="flex-1">
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-500">
                          {template ? 'Template personalizzato' : 'Template di default'}
                        </div>
                      </div>
                      <Badge className={template ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {template ? 'Attivo' : 'Default'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variabili Personalizzabili Tab */}
        <TabsContent value="variables" className="mt-6">
          {/* System Variables Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Variabili di Sistema Disponibili
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemVariables.map((variable) => (
                  <div key={variable.name} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="font-mono text-sm font-medium text-blue-600 mb-2">
                      {variable.name}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {variable.description}
                    </div>
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      Es: {variable.example}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search and Add */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Cerca variabili..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi Variabile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Add New Variable Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Nuova Variabile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newVariableName">Nome Variabile *</Label>
                    <Input
                      id="newVariableName"
                      placeholder="es: {{WELCOME_MESSAGE}}"
                      value={newVariableName}
                      onChange={(e) => setNewVariableName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newVariableDescription">Descrizione</Label>
                    <Input
                      id="newVariableDescription"
                      placeholder="Descrizione della variabile"
                      value={newVariableDescription}
                      onChange={(e) => setNewVariableDescription(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="newVariableValue">Valore *</Label>
                  <Textarea
                    id="newVariableValue"
                    placeholder="Inserisci il valore della variabile. Puoi usare le variabili di sistema come {{CLIENT_NAME}}"
                    value={newVariableValue}
                    onChange={(e) => setNewVariableValue(e.target.value)}
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={addNewVariable}
                    disabled={variableSaving}
                    className="flex items-center gap-2"
                  >
                    {variableSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salva Variabile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewVariableName('')
                      setNewVariableValue('')
                      setNewVariableDescription('')
                    }}
                    disabled={variableSaving}
                  >
                    Annulla
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Custom Variables List */}
          <Card>
            <CardHeader>
                              <CardTitle>Le Tue Variabili</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredVariables.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Variable className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium mb-2">
                    {searchTerm ? 'Nessuna variabile trovata' : 'Non hai ancora creato variabili personalizzate'}
                  </p>
                  <p className="text-sm">
                    {searchTerm ? 'Prova a modificare i termini di ricerca' : 'Clicca su "Aggiungi Variabile" per iniziare'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredVariables.map((variable) => (
                    <Card key={variable.id} className="border hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        {editingVariable === variable.variable_name ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Nome Variabile</Label>
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="es: {{WELCOME_MESSAGE}}"
                                  className="font-mono"
                                />
                              </div>
                              <div>
                                <Label>Descrizione</Label>
                                <Input
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  placeholder="Descrizione della variabile"
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Valore</Label>
                              <Textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder="Inserisci il valore della variabile"
                                rows={4}
                                className="font-mono text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => saveVariable(variable.variable_name)}
                                disabled={variableSaving}
                                className="flex items-center gap-2"
                              >
                                {variableSaving ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                                Salva
                              </Button>
                              <Button
                                variant="outline"
                                onClick={cancelEditing}
                                disabled={variableSaving}
                              >
                                Annulla
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-blue-100 text-blue-800 font-mono text-xs">
                                    {variable.variable_name}
                                  </Badge>
                                </div>
                                {variable.description && (
                                  <p className="text-sm text-muted-foreground mb-3">{variable.description}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditing(variable.variable_name)}
                                  className="flex items-center gap-1"
                                >
                                  <FileText className="w-4 h-4" />
                                  Modifica
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteVariable(variable.variable_name)}
                                  disabled={variableSaving}
                                  className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Elimina
                                </Button>
                              </div>
                            </div>
                            <div className="bg-muted/50 p-4 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Anteprima:</span>
                              </div>
                              <div className="min-h-[60px]">
                                {renderVariableValue(variable.variable_value)}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p>
                Crea variabili personalizzate per i tuoi messaggi. Puoi usare le variabili di sistema disponibili 
                all&apos;interno dei tuoi valori personalizzati. Ad esempio: &quot;Benvenuto {'{{CLIENT_NAME}}'}, il tuo appuntamento 
                per {'{{SERVICE_NAME}}'} è confermato per il {'{{APPOINTMENT_DATE}}'} alle {'{{APPOINTMENT_TIME}}'}.&quot;
              </p>
                        <p className="mt-2 text-sm">
            <strong>Formato:</strong> Tutti i contenuti sono gestiti come testo semplice per una migliore compatibilità.
          </p>
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  )
} 