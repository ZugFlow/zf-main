import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export type Theme = 'light' | 'dark' | 'system'

export function useUserTheme() {
  const [theme, setThemeState] = useState<Theme>('light')
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Carica il tema dell'utente dal database
  const loadUserTheme = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: teamData, error } = await supabase
          .from('team')
          .select('theme')
          .eq('user_id', user.id)
          .single()

        if (teamData?.theme) {
          setThemeState(teamData.theme as Theme)
        } else {
          // Se non c'è un tema salvato, usa 'light' come default
          setThemeState('light')
        }
      } else {
        // Se non c'è un utente autenticato, usa 'light'
        setThemeState('light')
      }
    } catch (error) {
      console.error('Errore nel caricamento del tema:', error)
      setThemeState('light')
    } finally {
      setIsLoading(false)
    }
  }

  // Salva il tema dell'utente nel database
  const saveUserTheme = async (newTheme: Theme) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error } = await supabase
          .from('team')
          .update({ theme: newTheme })
          .eq('user_id', user.id)

        if (error) {
          console.error('Errore nel salvataggio del tema:', error)
          throw error
        }
      }
    } catch (error) {
      console.error('Errore nel salvataggio del tema:', error)
      throw error
    }
  }

  // Funzione per cambiare tema
  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme)
      await saveUserTheme(newTheme)
    } catch (error) {
      console.error('Errore nel cambio tema:', error)
    }
  }

  useEffect(() => {
    loadUserTheme()
  }, [])

  return {
    theme,
    setTheme,
    isLoading,
    loadUserTheme
  }
} 