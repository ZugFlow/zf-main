'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Upload,
  User,
  Award,
  Star
} from 'lucide-react'

const supabase = createClient()

interface TeamMember {
  id: string
  salon_id: string
  name: string
  role: string
  experience: string
  bio: string
  avatar_url: string | null
  specialties: string[]
  is_active: boolean
  is_featured: boolean
  sort_order: number
  social_instagram: string | null
  social_facebook: string | null
  created_at: string
  updated_at: string
}

interface TeamManagerProps {
  salonId: string
}

export default function TeamManager({ salonId }: TeamManagerProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchTeamMembers()
  }, [salonId])

  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('salon_team_members')
        .select('*')
        .eq('salon_id', salonId)
        .order('sort_order', { ascending: true })

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMember = () => {
    const newMember: Partial<TeamMember> = {
      salon_id: salonId,
      name: '',
      role: '',
      experience: '',
      bio: '',
      avatar_url: null,
      specialties: [],
      is_active: true,
      is_featured: false,
      sort_order: teamMembers.length + 1,
      social_instagram: null,
      social_facebook: null
    }
    setEditingMember(newMember as TeamMember)
    setIsCreating(true)
  }

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member)
    setIsCreating(false)
  }

  const handleSaveMember = async () => {
    if (!editingMember) return

    setSaving(true)
    try {
      if (isCreating) {
        const { error } = await supabase
          .from('salon_team_members')
          .insert(editingMember)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('salon_team_members')
          .update(editingMember)
          .eq('id', editingMember.id)

        if (error) throw error
      }

      setEditingMember(null)
      setIsCreating(false)
      await fetchTeamMembers()
    } catch (error) {
      console.error('Error saving team member:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo membro del team?')) return

    try {
      const { error } = await supabase
        .from('salon_team_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
      await fetchTeamMembers()
    } catch (error) {
      console.error('Error deleting team member:', error)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    if (!editingMember) return

    setUploading(true)
    try {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File troppo grande. Dimensione massima: 5MB')
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File non valido. Carica solo immagini.')
      }

      // Create a unique file name
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileName = `team_avatar_${Date.now()}.${fileExt}`

      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('salon-assets')
        .upload(`${salonId}/team/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('salon-assets')
        .getPublicUrl(`${salonId}/team/${fileName}`)

      // Update the editing member with the new avatar URL
      setEditingMember({
        ...editingMember,
        avatar_url: publicUrl
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    if (!editingMember) return

    let newSpecialties = [...editingMember.specialties]
    if (checked) {
      if (!newSpecialties.includes(specialty)) {
        newSpecialties.push(specialty)
      }
    } else {
      newSpecialties = newSpecialties.filter(s => s !== specialty)
    }

    setEditingMember({
      ...editingMember,
      specialties: newSpecialties
    })
  }

  const commonSpecialties = [
    'Taglio', 'Colore', 'Piega', 'Trattamenti', 'Extension', 
    'Acconciature', 'Barba', 'Manicure', 'Pedicure', 'Massaggi'
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
          <h2 className="text-2xl font-bold text-gray-900">Gestione Team</h2>
          <p className="text-gray-600">Personalizza i membri del tuo team</p>
        </div>
        <Button onClick={handleCreateMember} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Membro
        </Button>
      </div>

      {/* Team Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => (
          <Card key={member.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="bg-violet-100 text-violet-600 text-lg">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <CardDescription className="text-sm">{member.role}</CardDescription>
                </div>
                <div className="flex items-center space-x-1">
                  {member.is_featured && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      In Evidenza
                    </Badge>
                  )}
                  {!member.is_active && (
                    <Badge variant="secondary">Inattivo</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Award className="w-4 h-4" />
                  <span>{member.experience}</span>
                </div>
                
                {member.bio && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {member.bio}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-1">
                  {member.specialties.slice(0, 3).map((specialty) => (
                    <Badge key={specialty} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {member.specialties.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{member.specialties.length - 3}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex space-x-2">
                    {member.social_instagram && (
                      <Button size="sm" variant="ghost" className="p-1">
                        <span className="text-pink-600">📷</span>
                      </Button>
                    )}
                    {member.social_facebook && (
                      <Button size="sm" variant="ghost" className="p-1">
                        <span className="text-blue-600">📘</span>
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditMember(member)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteMember(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Create Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {isCreating ? 'Nuovo Membro Team' : 'Modifica Membro Team'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingMember(null)
                    setIsCreating(false)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={editingMember.avatar_url || undefined} />
                  <AvatarFallback className="bg-violet-100 text-violet-600 text-xl">
                    {editingMember.name ? editingMember.name.split(' ').map(n => n[0]).join('') : <User className="w-8 h-8" />}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Foto Profilo</Label>
                  <input
                    type="file"
                    id="avatar"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleAvatarUpload(file)
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('avatar')?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-600"></div>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Carica Foto
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      name: e.target.value
                    })}
                    placeholder="Es: Maria Rossi"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Ruolo *</Label>
                  <Input
                    id="role"
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      role: e.target.value
                    })}
                    placeholder="Es: Parrucchiera Senior"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Esperienza</Label>
                  <Input
                    id="experience"
                    value={editingMember.experience}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      experience: e.target.value
                    })}
                    placeholder="Es: 15 anni"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Ordine</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    min="1"
                    value={editingMember.sort_order}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      sort_order: parseInt(e.target.value) || 1
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={editingMember.bio}
                  onChange={(e) => setEditingMember({
                    ...editingMember,
                    bio: e.target.value
                  })}
                  placeholder="Breve descrizione del membro del team..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Specialità</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commonSpecialties.map((specialty) => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`specialty-${specialty}`}
                        checked={editingMember.specialties.includes(specialty)}
                        onChange={(e) => handleSpecialtyChange(specialty, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`specialty-${specialty}`} className="text-sm">
                        {specialty}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="social_instagram">Instagram</Label>
                  <Input
                    id="social_instagram"
                    value={editingMember.social_instagram || ''}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      social_instagram: e.target.value || null
                    })}
                    placeholder="@username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="social_facebook">Facebook</Label>
                  <Input
                    id="social_facebook"
                    value={editingMember.social_facebook || ''}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      social_facebook: e.target.value || null
                    })}
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={editingMember.is_active}
                      onCheckedChange={(checked) => setEditingMember({
                        ...editingMember,
                        is_active: checked
                      })}
                    />
                    <Label htmlFor="is_active">Attivo</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_featured"
                      checked={editingMember.is_featured}
                      onCheckedChange={(checked) => setEditingMember({
                        ...editingMember,
                        is_featured: checked
                      })}
                    />
                    <Label htmlFor="is_featured">In Evidenza</Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingMember(null)
                    setIsCreating(false)
                  }}
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleSaveMember}
                  disabled={saving || !editingMember.name.trim() || !editingMember.role.trim()}
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
