'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Scissors,
  Sparkles,
  Heart,
  Gift,
  Star,
  Clock,
  Euro
} from 'lucide-react'

const supabase = createClient()

interface Service {
  id: number
  name: string
  category: string | null
  price: number
  duration: number
  type: string | null
  description: string | null
  status: string
  promo: boolean | null
  date_added: string
  user_id: string
  salon_id: string
  online_booking_enabled?: boolean
}

interface ServicesManagerProps {
  salonId: string
}

export default function ServicesManager({ salonId }: ServicesManagerProps) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchServices()
  }, [salonId])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonId)
        .eq('status', 'active')
        .order('name', { ascending: true })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateService = () => {
    const newService: Partial<Service> = {
      salon_id: salonId,
      name: '',
      description: '',
      price: 0,
      duration: 60,
      category: 'hair',
      status: 'active',
      promo: false,
      online_booking_enabled: true
    }
    setEditingService(newService as Service)
    setIsCreating(true)
  }

  const handleEditService = (service: Service) => {
    setEditingService(service)
    setIsCreating(false)
  }

  const handleSaveService = async () => {
    if (!editingService) return

    setSaving(true)
    try {
      if (isCreating) {
        const { error } = await supabase
          .from('services')
          .insert(editingService)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('services')
          .update(editingService)
          .eq('id', editingService.id)

        if (error) throw error
      }

      setEditingService(null)
      setIsCreating(false)
      await fetchServices()
    } catch (error) {
      console.error('Error saving service:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteService = async (serviceId: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo servizio?')) return

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (error) throw error
      await fetchServices()
    } catch (error) {
      console.error('Error deleting service:', error)
    }
  }

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      scissors: Scissors,
      sparkles: Sparkles,
      heart: Heart,
      gift: Gift,
      star: Star,
      clock: Clock,
      euro: Euro
    }
    return icons[iconName] || Scissors
  }

  const categories = [
    { value: 'hair', label: 'Capelli' },
    { value: 'beauty', label: 'Bellezza' },
    { value: 'nail', label: 'Unghie' },
    { value: 'spa', label: 'Spa' },
    { value: 'other', label: 'Altro' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestione Servizi</h2>
          <p className="text-gray-600">Personalizza i servizi offerti dal tuo salone</p>
        </div>
        <Button onClick={handleCreateService} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Servizio
        </Button>
      </div>

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card key={service.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {React.createElement(getIconComponent('scissors'), { 
                    className: "w-5 h-5 text-violet-600" 
                  })}
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-1">
                  {service.promo && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      Promo
                    </Badge>
                  )}
                  {service.status !== 'active' && (
                    <Badge variant="secondary">Inattivo</Badge>
                  )}
                  {service.online_booking_enabled && (
                    <Badge className="bg-green-100 text-green-800">
                      Online
                    </Badge>
                  )}
                </div>
              </div>
              {service.description && (
                <CardDescription className="line-clamp-2">
                  {service.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-violet-600">
                    €{service.price}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{service.duration} min</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {categories.find(c => c.value === service.category)?.label || service.category || 'Generale'}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditService(service)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteService(service.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Create Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {isCreating ? 'Nuovo Servizio' : 'Modifica Servizio'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingService(null)
                    setIsCreating(false)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Servizio *</Label>
                  <Input
                    id="name"
                    value={editingService.name}
                    onChange={(e) => setEditingService({
                      ...editingService,
                      name: e.target.value
                    })}
                    placeholder="Es: Taglio e Piega"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <select
                    id="category"
                    value={editingService.category || ''}
                    onChange={(e) => setEditingService({
                      ...editingService,
                      category: e.target.value
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({
                    ...editingService,
                    description: e.target.value
                  })}
                  placeholder="Descrizione del servizio..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prezzo (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingService.price}
                    onChange={(e) => setEditingService({
                      ...editingService,
                      price: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Durata (minuti)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={editingService.duration}
                    onChange={(e) => setEditingService({
                      ...editingService,
                      duration: parseInt(e.target.value) || 60
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Input
                    id="type"
                    value={editingService.type || ''}
                    onChange={(e) => setEditingService({
                      ...editingService,
                      type: e.target.value
                    })}
                    placeholder="Tipo di servizio"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Stato</Label>
                  <select
                    id="status"
                    value={editingService.status}
                    onChange={(e) => setEditingService({
                      ...editingService,
                      status: e.target.value
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="active">Attivo</option>
                    <option value="inactive">Inattivo</option>
                    <option value="draft">Bozza</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="promo"
                      checked={editingService.promo || false}
                      onCheckedChange={(checked) => setEditingService({
                        ...editingService,
                        promo: checked
                      })}
                    />
                    <Label htmlFor="promo">Promozione</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="online_booking_enabled"
                      checked={editingService.online_booking_enabled || false}
                      onCheckedChange={(checked) => setEditingService({
                        ...editingService,
                        online_booking_enabled: checked
                      })}
                    />
                    <Label htmlFor="online_booking_enabled">Prenotazione Online</Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingService(null)
                    setIsCreating(false)
                  }}
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleSaveService}
                  disabled={saving || !editingService.name.trim()}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salva'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
