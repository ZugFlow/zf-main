'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'react-hot-toast'
import { User, Camera, Upload, Trash2 } from 'lucide-react'

export default function FotoProfilo() {
  const [isLoading, setIsLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Il file deve essere inferiore a 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Seleziona un file immagine valido')
      return
    }

    setIsLoading(true)
    try {
      // Qui implementerai l'upload del file
      // const uploadedUrl = await uploadFile(file)
      // setAvatarUrl(uploadedUrl)
      
      // Simulazione
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      toast.success('Foto profilo aggiornata con successo')
    } catch (error) {
      toast.error('Errore durante il caricamento della foto')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarUrl(null)
    toast.success('Foto profilo rimossa')
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Implementa qui l'aggiornamento del profilo
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulazione
      toast.success('Profilo aggiornato con successo')
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento del profilo')
    } finally {
      setIsLoading(false)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Avatar Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Foto Profilo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || undefined} alt="Foto profilo" />
                <AvatarFallback className="text-lg bg-gray-100">
                  <User className="h-8 w-8 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  onClick={triggerFileSelect}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Upload className="h-4 w-4" />
                  Carica Foto
                </Button>
                
                {avatarUrl && (
                  <Button
                    onClick={handleRemoveAvatar}
                    disabled={isLoading}
                    variant="outline"
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Rimuovi
                  </Button>
                )}
              </div>
              
              <p className="text-sm text-gray-500">
                JPG, PNG o GIF. Massimo 5MB.
              </p>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Informazioni Profilo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Inserisci il tuo nome"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Cognome</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Inserisci il tuo cognome"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Inserisci la tua email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Inserisci il tuo numero di telefono"
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Aggiornamento...
                  </div>
                ) : (
                  'Salva Modifiche'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
