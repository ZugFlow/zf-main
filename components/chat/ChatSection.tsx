'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Add,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Chat,
  UserFollow,
  View,
  Checkmark,
  Send,
  Reply,
  Edit,
  TrashCan
} from '@carbon/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { 
  chatService, 
  ChatGroup, 
  ChatMessage, 
  ChatGroupMember 
} from '@/lib/chat-service'
import { CreateGroupDialog } from './CreateGroupDialog'

interface ChatSectionProps {
  isOpen: boolean
  onToggle: () => void
}

export function ChatSection({ isOpen, onToggle }: ChatSectionProps) {
  const supabase = createClient()
  
  // State management
  const [user, setUser] = useState<any>(null)
  const [groups, setGroups] = useState<ChatGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [members, setMembers] = useState<ChatGroupMember[]>([])
  const [replyMessage, setReplyMessage] = useState<ChatMessage | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedGroupTypes, setSelectedGroupTypes] = useState<string[]>([])
  const [showChatModal, setShowChatModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageSubscription = useRef<any>(null)

  // Authentication check
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      }
    }
    getUser()
  }, [supabase.auth])

  // Load groups
  useEffect(() => {
    if (!user) return

    const loadGroups = async () => {
      try {
        const groupsData = await chatService.getGroups()
        setGroups(groupsData)
      } catch (error) {
        console.error('Errore nel caricamento dei gruppi:', error)
        toast.error('Errore nel caricamento dei gruppi')
      } finally {
        setIsLoading(false)
      }
    }

    loadGroups()
  }, [user])

  // Load messages and members when group is selected
  useEffect(() => {
    if (!selectedGroup) return

    const loadGroupData = async () => {
      try {
        const [messagesData, membersData] = await Promise.all([
          chatService.getMessages(selectedGroup.id),
          chatService.getGroupMembers(selectedGroup.id)
        ])
        setMessages(messagesData)
        setMembers(membersData)
      } catch (error) {
        console.error('Errore nel caricamento dati gruppo:', error)
        toast.error('Errore nel caricamento dei messaggi')
      }
    }

    loadGroupData()
  }, [selectedGroup])

  // Real-time message subscription
  useEffect(() => {
    if (!selectedGroup) return

    // Cleanup previous subscription
    if (messageSubscription.current) {
      messageSubscription.current.unsubscribe()
    }

    // Subscribe to new messages
    messageSubscription.current = chatService.subscribeToMessages(
      selectedGroup.id,
      (newMessage) => {
        setMessages(prev => {
          // Controlla se il messaggio è già presente (per evitare duplicati)
          const messageExists = prev.some(m => m.id === newMessage.id)
          if (messageExists) {
            return prev
          }
          return [...prev, newMessage]
        })
        scrollToBottom()
      }
    )

    return () => {
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe()
      }
    }
  }, [selectedGroup])

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Filter groups based on search and type
  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const matchesSearch = searchQuery === '' || 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = selectedGroupTypes.length === 0 ||
        (selectedGroupTypes.includes('private') && group.is_private) ||
        (selectedGroupTypes.includes('public') && !group.is_private)

      return matchesSearch && matchesType
    })
  }, [groups, searchQuery, selectedGroupTypes])

  // Handlers
  const handleSendMessage = async (content: string, replyTo?: string) => {
    if (!selectedGroup || !content.trim()) return

    // Crea un messaggio ottimistico
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      group_id: selectedGroup.id,
      user_id: user?.id || '',
      content: content.trim(),
      message_type: 'text',
      reply_to: replyTo || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_edited: false,
      is_deleted: false,
      attachments: [],
      user: {
        id: user?.id || '',
        email: user?.email || '',
        user_metadata: {
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Tu',
          avatar_url: user?.user_metadata?.avatar_url || null
        }
      }
    }

    // Aggiungi immediatamente il messaggio alla lista locale
    setMessages(prev => [...prev, optimisticMessage])
    setReplyMessage(null)
    setNewMessage('')
    scrollToBottom()

    try {
      // Invia il messaggio al server
      const newMessage = await chatService.sendMessage(selectedGroup.id, content, replyTo)
      
      // Sostituisci il messaggio temporaneo con quello reale dal server
      setMessages(prev => prev.map(m => 
        m.id === optimisticMessage.id ? newMessage : m
      ))
    } catch (error) {
      console.error('Errore nell\'invio del messaggio:', error)
      toast.error('Errore nell\'invio del messaggio')
      
      // Rimuovi il messaggio ottimistico in caso di errore
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
    }
  }

  const handleReply = (message: ChatMessage) => {
    setReplyMessage(message)
  }

  const handleEdit = async (message: ChatMessage) => {
    const newContent = prompt('Modifica messaggio:', message.content)
    if (newContent && newContent.trim() !== message.content) {
      try {
        await chatService.editMessage(message.id, newContent)
        setMessages(prev => prev.map(m => 
          m.id === message.id 
            ? { ...m, content: newContent, is_edited: true }
            : m
        ))
        toast.success('Messaggio modificato')
      } catch (error) {
        console.error('Errore nella modifica del messaggio:', error)
        toast.error('Errore nella modifica del messaggio')
      }
    }
  }

  const handleDelete = async (messageId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo messaggio?')) {
      try {
        await chatService.deleteMessage(messageId)
        setMessages(prev => prev.map(m => 
          m.id === messageId 
            ? { ...m, is_deleted: true, content: 'Questo messaggio è stato eliminato' }
            : m
        ))
        toast.success('Messaggio eliminato')
      } catch (error) {
        console.error('Errore nell\'eliminazione del messaggio:', error)
        toast.error('Errore nell\'eliminazione del messaggio')
      }
    }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await chatService.addReaction(messageId, emoji)
    } catch (error) {
      console.error('Errore nell\'aggiunta della reazione:', error)
      toast.error('Errore nell\'aggiunta della reazione')
    }
  }

  const handleCreateGroup = async (groupData: Partial<ChatGroup>, memberIds: string[]) => {
    try {
      const newGroup = await chatService.createGroupWithMembers(groupData, memberIds)
      setGroups(prev => [newGroup, ...prev])
      toast.success('Gruppo creato con successo!')
    } catch (error) {
      console.error('Errore nella creazione del gruppo:', error)
      toast.error('Errore nella creazione del gruppo')
    }
  }

  const getCurrentUserRole = () => {
    if (!user || !selectedGroup) return 'member'
    const member = members.find(m => m.user_id === user.id)
    return member?.role || 'member'
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Group Card Component
  const GroupCard = React.memo(({ group }: { group: ChatGroup }) => {
    const isSelected = selectedGroup?.id === group.id

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg dark:hover:shadow-xl mb-3 overflow-hidden group border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600/50 ${
            isSelected ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-600/50' : 'bg-white dark:bg-slate-800'
          }`}
          onClick={() => setSelectedGroup(group)}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={group.avatar_url} alt={group.name} />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-sm">
                    {getInitials(group.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                    {group.name}
                  </h3>
                  <div className="flex items-center space-x-1">
                    {group.is_private ? (
                      <Badge variant="secondary" className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                        Privato
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        Pubblico
                      </Badge>
                    )}
                  </div>
                </div>
                
                {group.description && (
                  <p className="text-xs text-gray-600 dark:text-slate-400 mb-2 line-clamp-2">
                    {group.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-slate-400">
                      <UserFollow className="h-3 w-3" />
                      <span>{group.member_count || 0} membri</span>
                    </div>
                  </div>
                  
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    {formatDistanceToNow(new Date(group.updated_at), {
                      addSuffix: true,
                      locale: it
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  })

  // Chat Message Item Component (Teams-like layout)
  const ChatMessageItem = React.memo(({ message }: { message: ChatMessage }) => {
    const isOwner = message.user_id === user?.id
    const isTemporaryMessage = message.id.startsWith('temp-')

    return (
      <div className={`group flex ${isOwner ? 'justify-end' : 'justify-start'} px-2`}>
        <div className={`flex items-end ${isOwner ? 'flex-row-reverse' : 'flex-row'} gap-2 max-w-[85%] ${isTemporaryMessage ? 'opacity-70' : ''}`}>
          {!isOwner && (
            <div className="flex-shrink-0 mt-1">
              <Avatar className="h-6 w-6">
                <AvatarImage src={message.user?.user_metadata?.avatar_url} alt={message.user?.user_metadata?.full_name || 'Utente'} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-[10px]">
                  {getInitials(message.user?.user_metadata?.full_name || 'U')}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          <div className={`flex flex-col ${isOwner ? 'items-end text-right' : 'items-start text-left'} min-w-0`}>
            {!isOwner && (
              <div className="mb-0.5 text-[11px] text-gray-500 dark:text-slate-400">
                {message.user?.user_metadata?.full_name || message.user?.email || 'Utente'}
              </div>
            )}

            <div className={`inline-block rounded-xl px-3 py-1.5 max-w-full ${isOwner ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100'}`}>
              {message.reply_to && (
                <div className={`text-xs mb-1 p-1 rounded-lg ${isOwner ? 'bg-blue-700 text-blue-100' : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300'}`}>
                  <div className="font-medium mb-1">
                    Risposta a {message.reply_message?.user?.user_metadata?.full_name || 'Utente'}
                  </div>
                  <div className="truncate">
                    {message.reply_message?.content || 'Messaggio'}
                  </div>
                </div>
              )}
              <p className="text-sm leading-snug whitespace-pre-wrap break-words">{message.content}</p>
            </div>

            <div className={`mt-0.5 text-[10px] text-gray-400 ${isOwner ? 'text-right' : 'text-left'}`}>
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: it })}
              {message.is_edited && <span className="ml-1">· modificato</span>}
            </div>

            {isOwner && (
              <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(message)}
                  className="h-6 w-6 p-0 text-blue-400 hover:text-white hover:bg-blue-700/60 rounded"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(message.id)}
                  className="h-6 w-6 p-0 text-blue-400 hover:text-white hover:bg-blue-700/60 rounded"
                >
                  <TrashCan className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  })

  if (!isOpen) {
    return null
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      {/* Fascia Chat Gruppi rimossa */}

      {/* Fascia filtri gruppi rimossa */}

      {/* Lista gruppi rimossa */}
      <div className="flex-1" />

      {/* Chat Modal */}
      {showChatModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full h-[85vh] flex flex-col border border-gray-200 dark:border-slate-700">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedGroup.avatar_url} alt={selectedGroup.name} />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs">
                    {getInitials(selectedGroup.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    {selectedGroup.name}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      <UserFollow className="h-3 w-3 mr-1" />
                      {members.length} membri
                    </Badge>
                    {selectedGroup.is_private && (
                      <Badge variant="outline" className="text-xs">
                        Privato
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChatModal(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
            
            {selectedGroup.description && (
              <p className="text-sm text-gray-600 dark:text-slate-400 px-4 pb-2">
                {selectedGroup.description}
              </p>
            )}

            {/* Messages Area */}
            <div className="flex-1 chat-messages-container p-4 min-h-0">
              <div className="space-y-1">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                    <Chat className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-slate-500" />
                    <p className="text-sm">Nessun messaggio ancora.</p>
                    <p className="text-xs mt-1">Inizia la conversazione!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <ChatMessageItem key={message.id} message={message} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700">
              {replyMessage && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                        Risposta a {replyMessage.user?.user_metadata?.full_name || 'Utente'}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-slate-300 line-clamp-2">
                        {replyMessage.content}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyMessage(null)}
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(newMessage, replyMessage?.id)
                      }
                    }}
                    placeholder={`Scrivi in ${selectedGroup.name}...`}
                    className="min-h-[40px] resize-none"
                  />
                </div>
                
                <Button
                  onClick={() => handleSendMessage(newMessage, replyMessage?.id)}
                  disabled={!newMessage.trim()}
                  className="h-10 w-10 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
                     </div>
         </div>
       )}

      {/* Dialog creazione gruppo rimosso temporaneamente */}
     </div>
   )
 } 