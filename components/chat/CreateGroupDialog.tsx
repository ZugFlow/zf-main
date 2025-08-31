'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { 
  UserFollow,
  Checkmark,
  Search
} from '@carbon/icons-react'
import { 
  chatService, 
  ChatGroup, 
  TeamMember 
} from '@/lib/chat-service'
import { createClient } from '@/utils/supabase/client'
import { getSalonId } from '@/utils/getSalonId'

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateGroup: (groupData: Partial<ChatGroup>, memberIds: string[]) => void
}

export function CreateGroupDialog({ 
  open, 
  onOpenChange, 
  onCreateGroup 
}: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [availableMembers, setAvailableMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load available team members
  useEffect(() => {
    if (open) {
      loadTeamMembers()
    }
  }, [open])

  const loadTeamMembers = async () => {
    try {
      console.log('🔍 Loading team members for group creation...')
      
      // Debug: Check current user
      const { data: { user } } = await createClient().auth.getUser()
      console.log('👤 Current user:', user?.id)
      
      // Debug: Check salon_id
      const salonId = await getSalonId()
      console.log('🏢 Salon ID:', salonId)
      
      if (!salonId) {
        console.error('❌ No salon_id found for current user')
        toast.error('Errore: Impossibile identificare il salone. Verifica che tu sia associato a un salone.')
        return
      }
      
      const members = await chatService.getAvailableTeamMembers()
      console.log('✅ Team members loaded:', members.length)
      console.log('📋 Members data:', members)
      setAvailableMembers(members)
      
      if (members.length === 0) {
        console.warn('⚠️ No team members found')
        toast.error('Nessun membro del team trovato. Verifica che ci siano dipendenti attivi nel sistema.')
      } else {
        console.log('✅ Successfully loaded', members.length, 'team members')
      }
    } catch (error) {
      console.error('❌ Errore nel caricamento dei membri:', error)
      toast.error('Errore nel caricamento dei membri del team')
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Inserisci un nome per il gruppo')
      return
    }

    if (selectedMembers.length === 0) {
      toast.error('Seleziona almeno un membro')
      return
    }

    setIsLoading(true)

    try {
      const groupData: Partial<ChatGroup> = {
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        is_private: isPrivate,
        max_members: 100
      }

      await onCreateGroup(groupData, selectedMembers)
      
      // Reset form
      setGroupName('')
      setGroupDescription('')
      setIsPrivate(false)
      setSelectedMembers([])
      setSearchQuery('')
      
      onOpenChange(false)
    } catch (error) {
      console.error('Errore nella creazione del gruppo:', error)
      toast.error('Errore nella creazione del gruppo')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const filteredMembers = availableMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
            Crea nuovo gruppo
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            Crea un nuovo gruppo di chat e seleziona i membri
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Group Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Nome del gruppo *
                </label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Inserisci il nome del gruppo"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Descrizione (opzionale)
                </label>
                <Textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Inserisci una descrizione del gruppo"
                  className="w-full"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPrivate" className="text-sm text-gray-700 dark:text-slate-300">
                  Gruppo privato
                </label>
                <Badge variant="secondary" className="text-xs">
                  {isPrivate ? 'Privato' : 'Pubblico'}
                </Badge>
              </div>
            </div>

            {/* Member Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Seleziona membri *
                </label>
                <Badge variant="secondary" className="text-xs">
                  {selectedMembers.length} selezionati
                </Badge>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-slate-400" />
                <Input
                  placeholder="Cerca membri..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Members List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                    <UserFollow className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">
                      {availableMembers.length === 0 
                        ? 'Nessun membro del team disponibile' 
                        : 'Nessun membro trovato con la ricerca applicata'
                      }
                    </p>
                    {availableMembers.length === 0 && (
                      <p className="text-xs mt-1 text-gray-400">
                        Verifica che ci siano dipendenti attivi nel sistema
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                      {filteredMembers.length} di {availableMembers.length} membri
                    </div>
                    {filteredMembers.map((member) => (
                      <Card
                        key={member.user_id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedMembers.includes(member.user_id)
                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30'
                            : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                        }`}
                        onClick={() => toggleMember(member.user_id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatar_url} alt={member.name} />
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                                {member.name}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                {member.email}
                              </p>
                            </div>
                            
                            <div className="flex-shrink-0">
                              {selectedMembers.includes(member.user_id) && (
                                <Checkmark className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Annulla
          </Button>
          <Button
            onClick={handleCreateGroup}
            disabled={isLoading || !groupName.trim() || selectedMembers.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Creazione...' : 'Crea gruppo'}
          </Button>
        </div>
      </div>
    </div>
  )
}
