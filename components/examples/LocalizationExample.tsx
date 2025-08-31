import React from 'react'
import { useLocalization } from '@/hooks/useLocalization'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function LocalizationExample() {
  const { t, currentLanguage, formatDate, formatNumber, formatCurrency, formatTime } = useLocalization()

  const sampleDate = new Date()
  const sampleNumber = 1234567.89
  const sampleAmount = 99.99

  return (
    <div className="space-y-6 p-6">
      {/* Header con switch lingua */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.dashboard', 'Dashboard')}</h1>
        <LanguageSwitcher />
      </div>

      {/* Card di esempio */}
      <Card>
        <CardHeader>
          <CardTitle>{t('nav.appointments', 'Appuntamenti')}</CardTitle>
          <CardDescription>
            {t('message.loading', 'Caricamento...')} - {t('status.active', 'Attivo')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Esempi di formattazione */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">{t('date.today', 'Oggi')}</h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(sampleDate)}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">{t('action.save', 'Salva')}</h3>
              <p className="text-sm text-muted-foreground">
                {formatTime(sampleDate)}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">{t('form.required', 'Campo obbligatorio')}</h3>
              <p className="text-sm text-muted-foreground">
                {formatNumber(sampleNumber)}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">{t('status.success', 'Successo')}</h3>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(sampleAmount)}
              </p>
            </div>
          </div>

          {/* Stati con badge */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">{t('status.pending', 'In attesa')}</Badge>
            <Badge variant="secondary">{t('status.confirmed', 'Confermato')}</Badge>
            <Badge variant="destructive">{t('status.cancelled', 'Annullato')}</Badge>
            <Badge variant="outline">{t('status.completed', 'Completato')}</Badge>
          </div>

          {/* Azioni */}
          <div className="flex gap-2">
            <Button>{t('action.save', 'Salva')}</Button>
            <Button variant="outline">{t('action.cancel', 'Annulla')}</Button>
            <Button variant="secondary">{t('action.edit', 'Modifica')}</Button>
          </div>

          {/* Messaggi di esempio */}
          <div className="space-y-2">
            <p className="text-sm">
              <strong>{t('message.save_success', 'Salvato con successo')}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              {t('message.confirm_delete', 'Sei sicuro di voler eliminare questo elemento?')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informazioni sulla lingua corrente */}
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Localizzazione</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Lingua corrente:</strong> {currentLanguage}</p>
            <p><strong>Locale date:</strong> {currentLanguage === 'en' ? 'en-US' : 'it-IT'}</p>
            <p><strong>Valuta:</strong> {currentLanguage === 'en' ? 'USD' : 'EUR'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
