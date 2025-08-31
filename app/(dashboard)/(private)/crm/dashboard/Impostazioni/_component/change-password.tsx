'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { useLocalization } from '@/hooks/useLocalization'

export default function ChangePassword() {
  const { t } = useLocalization()
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('password.passwords_dont_match', 'Le password non coincidono'))
      return
    }

    if (formData.newPassword.length < 8) {
      toast.error(t('password.too_short', 'La password deve essere lunga almeno 8 caratteri'))
      return
    }

    setIsLoading(true)
    try {
      // Implementa qui la logica per il cambio password
      // usando la tua API o servizio di autenticazione
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulazione
      toast.success(t('password.success', 'Password modificata con successo'))
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast.error(t('password.error', 'Errore durante il cambio password'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-red-100 rounded-lg">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{t('password.security_title', 'Sicurezza Account')}</h2>
            <p className="text-sm text-gray-600">{t('password.security_desc', 'Modifica la tua password per mantenere sicuro il tuo account')}</p>
          </div>
        </div>
      </div>

      {/* Password Requirements Card */}
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardContent className="pt-4">
          <h3 className="font-medium text-yellow-800 mb-2">{t('password.requirements_title', 'Requisiti Password')}</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• {t('password.requirement_1', 'Almeno 8 caratteri')}</li>
            <li>• {t('password.requirement_2', 'Combina lettere maiuscole e minuscole')}</li>
            <li>• {t('password.requirement_3', 'Includi almeno un numero')}</li>
            <li>• {t('password.requirement_4', 'Usa caratteri speciali (@, #, $, etc.)')}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Change Password Form */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{t('password.change_title', 'Modifica Password')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium">
                {t('password.current_password', 'Password Attuale')}
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  name="currentPassword"
                  placeholder={t('password.current_placeholder', 'Inserisci la password attuale')}
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">
                {t('password.new_password', 'Nuova Password')}
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  placeholder={t('password.new_placeholder', 'Inserisci la nuova password')}
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                {t('password.confirm_password', 'Conferma Nuova Password')}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  placeholder={t('password.confirm_placeholder', 'Ripeti la nuova password')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-6"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('password.updating', 'Aggiornamento...')}
                  </div>
                ) : (
                  t('password.update_button', 'Aggiorna Password')
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
