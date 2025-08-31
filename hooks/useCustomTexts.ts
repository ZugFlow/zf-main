import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getSalonId } from '@/utils/getSalonId'

interface CustomText {
  id: string
  text_key: string
  text_value: string
  description: string
  is_active: boolean
}

export function useCustomTexts() {
  const [texts, setTexts] = useState<CustomText[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchTexts()
  }, [])

  const fetchTexts = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Usa getSalonId() per ottenere il salon_id
      const salonId = await getSalonId()
      if (!salonId) {
        console.error('Impossibile determinare il salone')
        return
      }

      const { data, error } = await supabase
        .from('custom_texts')
        .select('*')
        .eq('salon_id', salonId)
        .eq('is_active', true)

      if (error) {
        console.error('Errore nel caricamento dei testi personalizzati:', error)
        return
      }

      setTexts(data || [])
    } catch (error) {
      console.error('Errore nel caricamento dei testi personalizzati:', error)
    } finally {
      setLoading(false)
    }
  }

  const getText = (key: string, defaultValue: string = '') => {
    const customText = texts.find(t => t.text_key === key)
    return customText ? customText.text_value : defaultValue
  }

  const refreshTexts = () => {
    fetchTexts()
  }

  return {
    texts,
    loading,
    getText,
    refreshTexts
  }
} 