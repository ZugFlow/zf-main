'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Clock, Save, RefreshCw } from 'lucide-react'
import { 
  OpeningHours, 
  DAYS_OF_WEEK, 
  formatOpeningHoursForDisplay 
} from '@/utils/openingHoursUtils'

const supabase = createClient()

interface OpeningHoursManagerProps {
  salonId: string
  onHoursChange?: (hours: OpeningHours[]) => void
}

export default function OpeningHoursManager({ salonId, onHoursChange }: OpeningHoursManagerProps) {
  const [openingHours, setOpeningHours] = useState<OpeningHours[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadOpeningHours()
  }, [salonId])

  const loadOpeningHours = async () => {
    try {
      setLoading(true)
      
      // Initialize with default values
      const defaultHours: OpeningHours[] = DAYS_OF_WEEK.map(day => ({
        day: day.day,
        dayNumber: day.dayNumber,
        isOpen: day.dayNumber !== 0, // Default: closed on Sunday
        startTime: '09:00',
        endTime: '18:00',
        isBreakTime: false,
        breakStartTime: '12:00',
        breakEndTime: '13:00'
      }))

      // Try to load existing hours from salon_web_settings table
      const { data: webSettings, error } = await supabase
        .from('salon_web_settings')
        .select('*')
        .eq('salon_id', salonId)
        .single()

      if (error) {
        console.log('No existing opening hours found, using defaults')
        setOpeningHours(defaultHours)
        return
      }

      // Parse opening hours from web_map_opening_hours field
      const openingHoursString = (webSettings as any)?.web_map_opening_hours || ''
      
      if (!openingHoursString || openingHoursString.trim() === '') {
        console.log('No opening hours configured, using defaults')
        setOpeningHours(defaultHours)
        return
      }

      // Use the utility function to parse opening hours
      const parsedHours = require('@/utils/openingHoursUtils').parseOpeningHours(openingHoursString)
      setOpeningHours(parsedHours)
    } catch (error) {
      console.error('Error:', error)
      // Fallback to defaults
      const defaultHours: OpeningHours[] = DAYS_OF_WEEK.map(day => ({
        day: day.day,
        dayNumber: day.dayNumber,
        isOpen: day.dayNumber !== 0,
        startTime: '09:00',
        endTime: '18:00',
        isBreakTime: false,
        breakStartTime: '12:00',
        breakEndTime: '13:00'
      }))
      setOpeningHours(defaultHours)
    } finally {
      setLoading(false)
    }
  }

  const handleDayToggle = (dayNumber: number, isOpen: boolean) => {
    const updatedHours = openingHours.map(hour => 
      hour.dayNumber === dayNumber ? { ...hour, isOpen } : hour
    )
    setOpeningHours(updatedHours)
    setHasChanges(true)
    onHoursChange?.(updatedHours)
  }

  const handleTimeChange = (dayNumber: number, field: string, value: string) => {
    const updatedHours = openingHours.map(hour => 
      hour.dayNumber === dayNumber ? { ...hour, [field]: value } : hour
    )
    
    // Validate that end time is after start time
    const updatedHour = updatedHours.find(h => h.dayNumber === dayNumber)
    if (updatedHour && field === 'endTime' && updatedHour.startTime >= value) {
      return // Don't update if end time is before or equal to start time
    }
    
    setOpeningHours(updatedHours)
    setHasChanges(true)
    onHoursChange?.(updatedHours)
  }

  const handleBreakToggle = (dayNumber: number, isBreakTime: boolean) => {
    const updatedHours = openingHours.map(hour => 
      hour.dayNumber === dayNumber ? { ...hour, isBreakTime } : hour
    )
    setOpeningHours(updatedHours)
    setHasChanges(true)
    onHoursChange?.(updatedHours)
  }

  const handleBreakTimeChange = (dayNumber: number, field: string, value: string) => {
    const updatedHours = openingHours.map(hour => 
      hour.dayNumber === dayNumber ? { ...hour, [field]: value } : hour
    )
    
    // Validate break times are within working hours
    const updatedHour = updatedHours.find(h => h.dayNumber === dayNumber)
    if (updatedHour) {
      if (field === 'breakStartTime' && value >= updatedHour.endTime) {
        return // Break start must be before end time
      }
      if (field === 'breakEndTime' && value <= updatedHour.startTime) {
        return // Break end must be after start time
      }
      if (field === 'breakEndTime' && value <= updatedHour.breakStartTime) {
        return // Break end must be after break start
      }
    }
    
    setOpeningHours(updatedHours)
    setHasChanges(true)
    onHoursChange?.(updatedHours)
  }

  const saveOpeningHours = async () => {
    try {
      setSaving(true)
      setMessage(null)

      console.log('🔄 Saving opening hours for salon_id:', salonId)

      // Format opening hours for display in the web page
      const formattedHours = formatOpeningHoursForDisplay(openingHours)
      
      console.log('📝 Formatted hours:', formattedHours)

      // Save directly to salon_web_settings table
      const { error: webError } = await supabase
        .from('salon_web_settings')
        .update({ web_map_opening_hours: formattedHours })
        .eq('salon_id', salonId)

      if (webError) {
        console.error('❌ Error updating salon web settings:', webError)
        throw new Error(`Errore nel salvataggio: ${webError.message}`)
      }

      console.log('✅ Opening hours saved successfully!')

      setHasChanges(false)
      onHoursChange?.(openingHours)
      setMessage({ type: 'success', text: 'Orari salvati con successo!' })
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000)

    } catch (error) {
      console.error('❌ Error saving opening hours:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Errore nel salvataggio degli orari. Riprova.' 
      })
      
      // Clear error message after 5 seconds
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  const getDayStatus = (hour: OpeningHours) => {
    if (!hour.isOpen) return { text: 'Chiuso', variant: 'secondary' as const }
    return { text: 'Aperto', variant: 'default' as const }
  }

  const applyCommonPattern = (pattern: string) => {
    let newHours = [...openingHours]
    
    switch (pattern) {
      case 'standard':
        // Lunedì-Venerdì: 9-18, Sabato: 9-17, Domenica: chiuso
        newHours = newHours.map(hour => ({
          ...hour,
          isOpen: hour.dayNumber >= 1 && hour.dayNumber <= 6,
          startTime: hour.dayNumber === 6 ? '09:00' : '09:00',
          endTime: hour.dayNumber === 6 ? '17:00' : '18:00',
          isBreakTime: hour.dayNumber >= 1 && hour.dayNumber <= 5,
          breakStartTime: '12:00',
          breakEndTime: '13:00'
        }))
        break
      case 'extended':
        // Lunedì-Sabato: 8-20, Domenica: chiuso
        newHours = newHours.map(hour => ({
          ...hour,
          isOpen: hour.dayNumber >= 1 && hour.dayNumber <= 6,
          startTime: '08:00',
          endTime: '20:00',
          isBreakTime: hour.dayNumber >= 1 && hour.dayNumber <= 5,
          breakStartTime: '12:00',
          breakEndTime: '13:00'
        }))
        break
      case 'weekend':
        // Lunedì-Venerdì: 9-18, Sabato: 9-16, Domenica: 10-16
        newHours = newHours.map(hour => ({
          ...hour,
          isOpen: true,
          startTime: hour.dayNumber === 0 ? '10:00' : hour.dayNumber === 6 ? '09:00' : '09:00',
          endTime: hour.dayNumber === 0 ? '16:00' : hour.dayNumber === 6 ? '16:00' : '18:00',
          isBreakTime: hour.dayNumber >= 1 && hour.dayNumber <= 5,
          breakStartTime: '12:00',
          breakEndTime: '13:00'
        }))
        break
    }
    
    setOpeningHours(newHours)
    setHasChanges(true)
    onHoursChange?.(newHours)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Caricamento orari...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Orari di Apertura</span>
          </CardTitle>
          <CardDescription>
            Configura gli orari di apertura del salone per ogni giorno della settimana
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Patterns */}
          <div className="space-y-3">
            <Label>Modelli Rapidi</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyCommonPattern('standard')}
              >
                Standard (Lun-Ven 9-18, Sab 9-17)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyCommonPattern('extended')}
              >
                Esteso (Lun-Sab 8-20)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyCommonPattern('weekend')}
              >
                Weekend (Lun-Dom)
              </Button>
            </div>
          </div>
          {message && (
            <div className={`p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}
          
          {openingHours.map((hour) => (
            <div key={hour.dayNumber} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-gray-900">{hour.day}</h4>
                  <Badge variant={getDayStatus(hour).variant}>
                    {getDayStatus(hour).text}
                  </Badge>
                </div>
                <Switch
                  checked={hour.isOpen}
                  onCheckedChange={(checked) => handleDayToggle(hour.dayNumber, checked)}
                />
              </div>

              {hour.isOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`start-${hour.dayNumber}`}>Orario di Apertura</Label>
                    <Input
                      id={`start-${hour.dayNumber}`}
                      type="time"
                      value={hour.startTime}
                      onChange={(e) => handleTimeChange(hour.dayNumber, 'startTime', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`end-${hour.dayNumber}`}>Orario di Chiusura</Label>
                    <Input
                      id={`end-${hour.dayNumber}`}
                      type="time"
                      value={hour.endTime}
                      onChange={(e) => handleTimeChange(hour.dayNumber, 'endTime', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {hour.isOpen && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`break-${hour.dayNumber}`}>Pausa Pranzo</Label>
                    <Switch
                      id={`break-${hour.dayNumber}`}
                      checked={hour.isBreakTime}
                      onCheckedChange={(checked) => handleBreakToggle(hour.dayNumber, checked)}
                    />
                  </div>
                  
                  {hour.isBreakTime && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`break-start-${hour.dayNumber}`}>Inizio Pausa</Label>
                        <Input
                          id={`break-start-${hour.dayNumber}`}
                          type="time"
                          value={hour.breakStartTime}
                          onChange={(e) => handleBreakTimeChange(hour.dayNumber, 'breakStartTime', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`break-end-${hour.dayNumber}`}>Fine Pausa</Label>
                        <Input
                          id={`break-end-${hour.dayNumber}`}
                          type="time"
                          value={hour.breakEndTime}
                          onChange={(e) => handleBreakTimeChange(hour.dayNumber, 'breakEndTime', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={loadOpeningHours}
              disabled={saving}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Ripristina
            </Button>
            <Button
              onClick={saveOpeningHours}
              disabled={saving || !hasChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salva Orari'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Anteprima Orari</CardTitle>
          <CardDescription>
            Come appariranno gli orari nella sezione mappa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm text-gray-700 whitespace-pre-line">
              {formatOpeningHoursForDisplay(openingHours) || 'Nessun orario configurato'}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
