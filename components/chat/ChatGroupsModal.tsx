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
  Checkmark,
  OverflowMenuVertical,
  View,
  Close
} from '@carbon/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { ChatMessageItem } from '@/components/chat/ChatMessageItem'
import { ChatInput } from '@/components/chat/ChatInput'
import { CreateGroupDialog } from '@/components/chat/CreateGroupDialog'

import { 
  chatService, 
  ChatGroup, 
  ChatMessage, 
  ChatGroupMember 
} from '@/lib/chat-service'

interface DirectChatUser {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  online?: boolean;
  last_seen?: string;
}

interface ChatGroupsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatGroupsModal({ open, onOpenChange }: ChatGroupsModalProps) {
  const supabase = createClient()
  
  // State management
  const [user, setUser] = useState<any>(null)
  const [groups, setGroups] = useState<ChatGroup[]>([])
  const [directChatUsers, setDirectChatUsers] = useState<DirectChatUser[]>([])
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null)
  const [selectedDirectUser, setSelectedDirectUser] = useState<DirectChatUser | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [members, setMembers] = useState<ChatGroupMember[]>([])
  const [replyMessage, setReplyMessage] = useState<ChatMessage | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedGroupTypes, setSelectedGroupTypes] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'groups' | 'direct'>('groups')
  
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

  // Load groups and users
  useEffect(() => {
    if (!user || !open) return

    const loadData = async () => {
      try {
        console.log('🚀 Loading chat data for user:', user.id)
        const [groupsData, usersData] = await Promise.all([
          chatService.getGroups(),
          loadDirectChatUsers()
        ])
        console.log('📊 Loaded groups:', groupsData.length)
        console.log('👥 Loaded direct users:', usersData.length)
        setGroups(groupsData)
        setDirectChatUsers(usersData)
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error)
        toast.error('Errore nel caricamento dei dati')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, open])

  // Load direct chat users from team members
  const loadDirectChatUsers = async (): Promise<DirectChatUser[]> => {
    try {
      console.log('🔍 Loading direct chat users...')
      console.log('Current user:', user)
      
      // Prova a recuperare il salon_id dall'utente corrente
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('❌ Error getting user:', userError)
        return []
      }

      console.log('User data:', userData)
      
      let salonId = userData.user?.user_metadata?.salon_id

      // Se non c'è salon_id nei metadata, prova a recuperarlo dalla tabella team
      if (!salonId && user?.id) {
        console.log('🔍 No salon_id in metadata, trying to get from team table...')
        const { data: teamMember, error: teamError } = await supabase
          .from('team')
          .select('salon_id')
          .eq('user_id', user.id)
          .single()

        if (!teamError && teamMember) {
          salonId = teamMember.salon_id
          console.log('✅ Found salon_id from team table:', salonId)
        } else {
          console.error('❌ Error getting salon_id from team table:', teamError)
        }
      }

      if (!salonId) {
        console.error('❌ No salon_id found')
        return []
      }

      console.log('🏢 Using salon_id:', salonId)

      // Carica i membri del team dalla tabella 'team'
      const { data: teamMembers, error: teamError } = await supabase
        .from('team')
        .select('id, name, email, avatar_url, user_id')
        .eq('salon_id', salonId)
        .eq('is_active', true)
        .neq('user_id', user?.id) // Exclude current user

      if (teamError) {
        console.error('❌ Error loading from team table:', teamError)
        throw teamError
      }

      // Mappa i campi dalla tabella team per DirectChatUser
      const members = teamMembers?.map(member => ({
        id: member.user_id || member.id, // Usa user_id se disponibile, altrimenti id
        name: member.name || 'Anonymous',
        email: member.email,
        avatar_url: member.avatar_url
      })) || []

      console.log('✅ Loaded from team table:', members.length, 'members')
      console.log('Members data:', members)
      return members
    } catch (error) {
      console.error('❌ Errore nel caricamento degli utenti:', error)
      return []
    }
  }

  // Load messages and members when group or direct user is selected
  useEffect(() => {
    if (selectedGroup) {
      loadGroupData()
    } else if (selectedDirectUser) {
      loadDirectChatData()
    }
  }, [selectedGroup, selectedDirectUser])

  const loadGroupData = async () => {
    if (!selectedGroup) return
    try {
      console.log('📁 Loading group data for:', selectedGroup.name)
      const [messagesData, membersData] = await Promise.all([
        chatService.getMessages(selectedGroup.id),
        chatService.getGroupMembers(selectedGroup.id)
      ])
      setMessages(messagesData)
      setMembers(membersData)
      console.log('✅ Group data loaded, messages:', messagesData.length)
    } catch (error) {
      console.error('Errore nel caricamento dati gruppo:', error)
      toast.error('Errore nel caricamento dei messaggi')
    }
  }

  const loadDirectChatData = async () => {
    if (!selectedDirectUser || !user) return
    try {
      console.log('📁 Loading direct chat data between:', user.id, 'and', selectedDirectUser.id)
      const directMessages = await loadDirectMessages(user.id, selectedDirectUser.id)
      setMessages(directMessages)
      setMembers([]) // No members for direct chat
      console.log('✅ Direct chat data loaded, messages:', directMessages.length)
    } catch (error) {
      console.error('Errore nel caricamento chat diretta:', error)
      toast.error('Errore nel caricamento dei messaggi')
    }
  }

  // Load direct messages between two users
  const loadDirectMessages = async (userId1: string, userId2: string): Promise<ChatMessage[]> => {
    try {
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select(`
          id,
          content,
          sender_id,
          recipient_id,
          created_at,
          updated_at,
          is_edited,
          is_deleted,
          reply_to
        `)
        .or(`and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Get sender info separately dalla tabella team usando user_id
      const userIds = [...new Set(messages?.map(m => m.sender_id) || [])]
      const { data: senders } = await supabase
        .from('team')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds)

      const sendersMap = new Map(senders?.map(s => [s.user_id, s]) || [])

      return messages?.map(msg => {
        const sender = sendersMap.get(msg.sender_id)
        return {
          id: msg.id,
          content: msg.content,
          user_id: msg.sender_id,
          group_id: '', // Not applicable for direct messages
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          is_edited: msg.is_edited,
          is_deleted: msg.is_deleted,
          reply_to: msg.reply_to,
          message_type: 'text' as const,
          attachments: [],
          user: {
            id: msg.sender_id,
            email: '',
            user_metadata: {
              full_name: sender?.name || 'Unknown',
              avatar_url: sender?.avatar_url
            }
          }
        }
      }) || []
    } catch (error) {
      console.error('Errore nel caricamento messaggi diretti:', error)
      return []
    }
  }

  // Real-time message subscription
  useEffect(() => {
    if (selectedGroup) {
      subscribeToGroupMessages()
    } else if (selectedDirectUser) {
      subscribeToDirectMessages()
    }

    return () => {
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe()
        messageSubscription.current = null
      }
    }
  }, [selectedGroup, selectedDirectUser, user])

  const subscribeToGroupMessages = () => {
    if (!selectedGroup) return

    // Cleanup previous subscription
    if (messageSubscription.current) {
      messageSubscription.current.unsubscribe()
      messageSubscription.current = null
    }

    console.log('🔄 Subscribing to group messages for group:', selectedGroup.id)

    // Subscribe to new messages
    messageSubscription.current = chatService.subscribeToMessages(
      selectedGroup.id,
      (newMessage) => {
        console.log('📨 New group message received:', newMessage)
        setMessages(prev => {
          // Evita duplicati
          if (prev.some(msg => msg.id === newMessage.id)) {
            return prev
          }
          return [...prev, newMessage]
        })
        scrollToBottom()
      }
    )
  }

  const subscribeToDirectMessages = async () => {
    if (!selectedDirectUser || !user) return

    // Cleanup previous subscription
    if (messageSubscription.current) {
      messageSubscription.current.unsubscribe()
      messageSubscription.current = null
    }

    console.log('🔄 Subscribing to direct messages between:', user.id, 'and', selectedDirectUser.id)

    // Crea un canale unico per questa conversazione
    const channelName = `direct_messages_${user.id}_${selectedDirectUser.id}`
    
    messageSubscription.current = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `or(and(sender_id.eq.${user.id},recipient_id.eq.${selectedDirectUser.id}),and(sender_id.eq.${selectedDirectUser.id},recipient_id.eq.${user.id}))`
      }, async (payload) => {
        console.log('📨 Direct message payload received:', payload)
        
        const newData = payload.new as any
        
        // Doppio controllo per sicurezza
        const isRelevant = (
          (newData.sender_id === user.id && newData.recipient_id === selectedDirectUser.id) ||
          (newData.sender_id === selectedDirectUser.id && newData.recipient_id === user.id)
        )

        if (!isRelevant) {
          console.log('❌ Message not relevant for current conversation, ignoring')
          return
        }

        try {
          // Ottieni i dati del sender dalla tabella team
          const { data: senderData } = await supabase
            .from('team')
            .select('user_id, name, avatar_url')
            .eq('user_id', newData.sender_id)
            .single()

          const newMessage: ChatMessage = {
            id: newData.id,
            content: newData.content,
            user_id: newData.sender_id,
            group_id: '',
            created_at: newData.created_at,
            updated_at: newData.updated_at,
            is_edited: newData.is_edited || false,
            is_deleted: newData.is_deleted || false,
            reply_to: newData.reply_to,
            message_type: 'text',
            attachments: [],
            user: {
              id: newData.sender_id,
              email: '',
              user_metadata: {
                full_name: senderData?.name || (newData.sender_id === user.id ? 'Tu' : selectedDirectUser.name),
                avatar_url: senderData?.avatar_url
              }
            }
          }

          console.log('✅ Adding new direct message:', newMessage)
          
          setMessages(prev => {
            // Evita duplicati controllando sia per ID che per content+timestamp
            const exists = prev.some(msg => 
              msg.id === newMessage.id || 
              (msg.content === newMessage.content && 
               msg.user_id === newMessage.user_id && 
               Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 1000)
            )
            
            if (exists) {
              console.log('🔄 Message already exists, skipping')
              return prev
            }
            
            return [...prev, newMessage].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
          })
          
          // Auto scroll dopo un breve delay per permettere al DOM di aggiornarsi
          setTimeout(() => {
            scrollToBottom()
          }, 100)
        } catch (error) {
          console.error('❌ Error processing direct message:', error)
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'direct_messages',
        filter: `or(and(sender_id.eq.${user.id},recipient_id.eq.${selectedDirectUser.id}),and(sender_id.eq.${selectedDirectUser.id},recipient_id.eq.${user.id}))`
      }, (payload) => {
        console.log('📝 Direct message updated:', payload)
        const updatedData = payload.new as any
        
        setMessages(prev => prev.map(msg => 
          msg.id === updatedData.id 
            ? { 
                ...msg, 
                content: updatedData.content,
                is_edited: updatedData.is_edited,
                is_deleted: updatedData.is_deleted,
                updated_at: updatedData.updated_at
              }
            : msg
        ))
      })
      .subscribe((status) => {
        console.log('📡 Direct messages subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to direct messages')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to direct messages')
        }
      })
  }

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Scroll to bottom when group/direct user is selected
  useEffect(() => {
    if (selectedGroup || selectedDirectUser) {
      setTimeout(() => {
        scrollToBottom()
      }, 200)
    }
  }, [selectedGroup, selectedDirectUser])

  // Filter groups and users based on search and type
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

  const filteredDirectUsers = useMemo(() => {
    return directChatUsers.filter(user => {
      return searchQuery === '' || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [directChatUsers, searchQuery])

  // Handlers
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

  const handleSendMessage = async (content: string, replyTo?: string) => {
    if (!content.trim()) return

    try {
      console.log('📤 Sending message:', { content, selectedGroup: selectedGroup?.name, selectedDirectUser: selectedDirectUser?.name })
      
      if (selectedGroup) {
        await chatService.sendMessage(selectedGroup.id, content, replyTo)
        console.log('✅ Group message sent')
      } else if (selectedDirectUser && user) {
        await sendDirectMessage(user.id, selectedDirectUser.id, content, replyTo)
        console.log('✅ Direct message sent')
      }
      setReplyMessage(null)
    } catch (error) {
      console.error('Errore nell\'invio del messaggio:', error)
      toast.error('Errore nell\'invio del messaggio')
    }
  }

  // Send direct message
  const sendDirectMessage = async (senderId: string, recipientId: string, content: string, replyTo?: string) => {
    console.log('📤 Sending direct message from', senderId, 'to', recipientId)
    console.log('📝 Content:', content)
    
    // Ottimistic update: aggiungi il messaggio immediatamente all'interfaccia
    const tempId = `temp_${Date.now()}`
    const currentUser = await supabase.auth.getUser()
    const { data: senderData } = await supabase
      .from('team')
      .select('user_id, name, avatar_url')
      .eq('user_id', senderId)
      .single()

    const optimisticMessage: ChatMessage = {
      id: tempId,
      content,
      user_id: senderId,
      group_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_edited: false,
      is_deleted: false,
      reply_to: replyTo,
      message_type: 'text',
      attachments: [],
      user: {
        id: senderId,
        email: '',
        user_metadata: {
          full_name: senderData?.name || 'Tu',
          avatar_url: senderData?.avatar_url
        }
      }
    }

    // Aggiungi il messaggio ottimisticamente
    setMessages(prev => [...prev, optimisticMessage])
    scrollToBottom()
    
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: senderId,
          recipient_id: recipientId,
          content,
          reply_to: replyTo
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error sending direct message:', error)
        console.error('❌ Error details:', JSON.stringify(error, null, 2))
        
        // Rimuovi il messaggio ottimistico in caso di errore
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        throw error
      }
      
      console.log('✅ Direct message inserted successfully:', data)
      
      // Sostituisci il messaggio temporaneo con quello reale
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...optimisticMessage, id: data.id, created_at: data.created_at, updated_at: data.updated_at }
          : msg
      ))
      
    } catch (error) {
      console.error('❌ Catch block error:', error)
      throw error
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

  const getCurrentUserRole = () => {
    if (!user || !selectedGroup) return 'member'
    const member = members.find(m => m.user_id === user.id)
    return member?.role || 'member'
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Direct User Card Component
  const DirectUserCard = React.memo(({ user: directUser }: { user: DirectChatUser }) => {
    const isSelected = selectedDirectUser?.id === directUser.id

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
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg dark:hover:shadow-xl mb-3 overflow-hidden group border-gray-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600/50 ${
            isSelected ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-600/50' : 'bg-white dark:bg-slate-800'
          }`}
          onClick={() => {
            setSelectedDirectUser(directUser)
            setSelectedGroup(null)
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={directUser.avatar_url} alt={directUser.name} />
                  <AvatarFallback className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-semibold text-sm">
                    {getInitials(directUser.name)}
                  </AvatarFallback>
                </Avatar>
                {directUser.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                  {directUser.name}
                </h3>
                {directUser.email && (
                  <p className="text-xs text-gray-600 dark:text-slate-400 truncate">
                    {directUser.email}
                  </p>
                )}
                {directUser.last_seen && !directUser.online && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                    {formatDistanceToNow(new Date(directUser.last_seen), {
                      addSuffix: true,
                      locale: it
                    })}
                  </p>
                )}
                {directUser.online && (
                  <p className="text-xs text-green-600 dark:text-green-400 truncate">
                    Online
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  })

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
          onClick={() => {
            setSelectedGroup(group)
            setSelectedDirectUser(null)
          }}
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
                <div className="flex items-start justify-between mb-1 gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate flex-1">
                    {group.name}
                  </h3>
                  <div className="flex-shrink-0">
                    {group.is_private ? (
                      <Badge variant="secondary" className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 whitespace-nowrap">
                        Privato
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 whitespace-nowrap">
                        Pubblico
                      </Badge>
                    )}
                  </div>
                </div>
                
                {group.description && (
                  <p className="text-xs text-gray-600 dark:text-slate-400 mb-2 line-clamp-2 break-words">
                    {group.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-slate-400 min-w-0">
                    <UserFollow className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{group.member_count || 0} membri</span>
                  </div>
                  
                  <span className="text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0">
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

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedGroup(null)
      setSelectedDirectUser(null)
      setMessages([])
      setMembers([])
      setReplyMessage(null)
      setSearchQuery('')
      setSelectedGroupTypes([])
      setShowFilters(false)
      setActiveTab('groups')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full h-[85vh] p-0 overflow-hidden">
        <div className="flex h-full overflow-hidden">
          {/* Chat Sidebar */}
          <div className="w-80 min-w-80 max-w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col h-full shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-gray-50/50 dark:from-slate-800/30 to-gray-50/30 dark:to-slate-800/10 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Chat className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">Chat</h1>
                </div>
                <div className="flex items-center gap-2">
                  {activeTab === 'groups' && (
                    <Button
                      size="sm"
                      onClick={() => setIsCreateGroupOpen(true)}
                      className="h-8 w-8 p-0 bg-blue-600 dark:bg-slate-700 hover:bg-blue-700 dark:hover:bg-slate-600 text-white shadow-sm"
                    >
                      <Add className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    variant="ghost"
                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                  >
                    <Close className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex rounded-lg bg-gray-100 dark:bg-slate-800 p-1 mb-4">
                <button
                  onClick={() => setActiveTab('groups')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === 'groups'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'
                  }`}
                >
                  Gruppi
                </button>
                <button
                  onClick={() => setActiveTab('direct')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === 'direct'
                      ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'
                  }`}
                >
                  Chat Dirette
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-slate-400" />
                <Input
                  placeholder={activeTab === 'groups' ? "Cerca gruppi..." : "Cerca utenti..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-9 text-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                />
              </div>

              {/* Filters Toggle - Only for groups */}
              {activeTab === 'groups' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full justify-between text-sm text-gray-900 dark:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800/50 rounded-md transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filtri</span>
                    {selectedGroupTypes.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedGroupTypes.length}
                      </Badge>
                    )}
                  </div>
                  {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              )}
            </div>

            {/* Filters Panel - Only for groups */}
            <AnimatePresence>
              {showFilters && activeTab === 'groups' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/20 flex-shrink-0"
                >
                  <div className="p-4 space-y-3">
                    {/* Group Type Filter */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 dark:text-slate-300 mb-2 block">
                        Tipo di gruppo
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: 'public', label: 'Pubblici', color: 'green' },
                          { value: 'private', label: 'Privati', color: 'orange' }
                        ].map(type => (
                          <Button
                            key={type.value}
                            variant={selectedGroupTypes.includes(type.value) ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedGroupTypes(prev => 
                                prev.includes(type.value)
                                  ? prev.filter(t => t !== type.value)
                                  : [...prev, type.value]
                              )
                            }}
                            className="text-xs"
                          >
                            {selectedGroupTypes.includes(type.value) && <Checkmark className="h-3 w-3 mr-1" />}
                            {type.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Clear Filters */}
                    {selectedGroupTypes.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedGroupTypes([])}
                        className="w-full text-xs text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100"
                      >
                        Cancella filtri
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Groups/Users List */}
            <div className="flex-1 chat-scroll-container p-4 min-h-0 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                </div>
              ) : activeTab === 'groups' ? (
                filteredGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <Chat className="h-12 w-12 text-gray-500 dark:text-slate-400 mx-auto mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                      {searchQuery || selectedGroupTypes.length > 0 ? 'Nessun gruppo trovato' : 'Nessun gruppo'}
                    </h3>
                    <p className="text-gray-600 dark:text-slate-400 mb-4 text-xs">
                      {searchQuery || selectedGroupTypes.length > 0
                        ? 'Nessun gruppo trovato con i filtri applicati'
                        : groups.length === 0 
                          ? 'Nessun gruppo nel sistema'
                          : 'Nessun gruppo per i filtri selezionati'
                      }
                    </p>
                    {(!searchQuery && selectedGroupTypes.length === 0) && (
                      <Button 
                        onClick={() => setIsCreateGroupOpen(true)}
                        className="bg-blue-600 dark:bg-slate-700 hover:bg-blue-700 dark:hover:bg-slate-600 text-white shadow-sm"
                      >
                        <Add className="h-4 w-4 mr-2" />
                        {groups.length === 0 ? 'Crea primo gruppo' : 'Nuovo gruppo'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredGroups.map((group) => (
                      <GroupCard key={group.id} group={group} />
                    ))}
                  </div>
                )
              ) : (
                filteredDirectUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <UserFollow className="h-12 w-12 text-gray-500 dark:text-slate-400 mx-auto mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                      {searchQuery ? 'Nessun utente trovato' : 'Nessun utente'}
                    </h3>
                    <p className="text-gray-600 dark:text-slate-400 mb-4 text-xs">
                      {searchQuery
                        ? 'Nessun utente trovato con la ricerca applicata'
                        : directChatUsers.length === 0 
                          ? 'Nessun membro del team disponibile'
                          : 'Nessun utente disponibile'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredDirectUsers.map((user) => (
                      <DirectUserCard key={user.id} user={user} />
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedGroup || selectedDirectUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage 
                          src={selectedGroup?.avatar_url || selectedDirectUser?.avatar_url} 
                          alt={selectedGroup?.name || selectedDirectUser?.name} 
                        />
                        <AvatarFallback className={`text-xs ${
                          selectedGroup 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        }`}>
                          {getInitials(selectedGroup?.name || selectedDirectUser?.name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 truncate">
                          {selectedGroup?.name || selectedDirectUser?.name}
                        </h2>
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          {selectedGroup ? (
                            <>
                              <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                <UserFollow className="h-3 w-3 mr-1" />
                                {members.length} membri
                              </Badge>
                              {selectedGroup.is_private && (
                                <Badge variant="outline" className="text-xs whitespace-nowrap">
                                  Privato
                                </Badge>
                              )}
                            </>
                          ) : selectedDirectUser ? (
                            <>
                              <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 whitespace-nowrap">
                                Chat Diretta
                              </Badge>
                              {selectedDirectUser.online ? (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-600 whitespace-nowrap">
                                  Online
                                </Badge>
                              ) : selectedDirectUser.last_seen && (
                                <span className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                  {formatDistanceToNow(new Date(selectedDirectUser.last_seen), {
                                    addSuffix: true,
                                    locale: it
                                  })}
                                </span>
                              )}
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    
                    {selectedGroup && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <OverflowMenuVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <View className="h-4 w-4 mr-2" />
                            Informazioni gruppo
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserFollow className="h-4 w-4 mr-2" />
                            Gestisci membri
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  {selectedGroup?.description && (
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-2 break-words">
                      {selectedGroup.description}
                    </p>
                  )}
                  {selectedDirectUser?.email && (
                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-2 truncate">
                      {selectedDirectUser.email}
                    </p>
                  )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 chat-messages-container min-h-0 overflow-hidden">
                  <div className="p-4 max-w-full overflow-x-hidden overflow-y-auto h-full flex flex-col scroll-smooth">
                    {messages.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-slate-400">
                        <div className="text-center">
                          <Chat className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-slate-500" />
                          <p className="text-sm">Nessun messaggio ancora.</p>
                          <p className="text-xs mt-1">Inizia la conversazione!</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-h-0">
                          {messages.map((message) => (
                            <div key={message.id} className="max-w-full overflow-hidden mb-2">
                              <ChatMessageItem
                                message={message}
                                currentUserId={user?.id}
                                userRole={getCurrentUserRole()}
                                onReply={handleReply}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onReaction={handleReaction}
                              />
                            </div>
                          ))}
                        </div>
                        <div ref={messagesEndRef} className="h-4" />
                      </>
                    )}
                  </div>
                </div>

                {/* Chat Input */}
                <ChatInput
                  onSend={handleSendMessage}
                  replyMessage={replyMessage || undefined}
                  onCancelReply={() => setReplyMessage(null)}
                  placeholder={selectedGroup ? `Scrivi in ${selectedGroup.name}...` : `Scrivi a ${selectedDirectUser?.name}...`}
                />
              </>
            ) : (
              // No Group Selected
              <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-800/20">
                <div className="text-center">
                  <Chat className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-slate-500" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
                    Seleziona una conversazione
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                    Scegli un gruppo o un utente per iniziare a chattare
                  </p>
                  {groups.length === 0 && directChatUsers.length === 0 && (
                    <Button onClick={() => setIsCreateGroupOpen(true)}>
                      <Add className="h-4 w-4 mr-2" />
                      Crea primo gruppo
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Group Dialog */}
        <CreateGroupDialog
          open={isCreateGroupOpen}
          onOpenChange={setIsCreateGroupOpen}
          onCreateGroup={handleCreateGroup}
        />
      </DialogContent>
    </Dialog>
  )
}
