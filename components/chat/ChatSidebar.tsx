'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { StableAvatar } from '@/components/ui/stable-avatar'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import './chat-sidebar.css'
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
  Close,
  OverflowMenuVertical,
  ChevronLeft,
  Reply,
  Edit,
  TrashCan,
  FaceAdd,
  Settings,
  User,
  UserMultiple,
  Information,
  Pin,
  Notification
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

interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
  inline?: boolean // New prop to determine if it should be inline or fixed
}

export function ChatSidebar({ isOpen, onClose, className = '', inline = false }: ChatSidebarProps) {
  // Memoize Supabase client to avoid recreating across renders, which can break realtime subscriptions
  const supabase = useMemo(() => createClient(), [])
  
  // State management
  const [user, setUser] = useState<any>(null)
  const [groups, setGroups] = useState<ChatGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null)
  const [selectedDirectUser, setSelectedDirectUser] = useState<any>(null)
  const [directChatUsers, setDirectChatUsers] = useState<any[]>([])
  const [unreadBySender, setUnreadBySender] = useState<Record<string, number>>({})
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [members, setMembers] = useState<ChatGroupMember[]>([])
  const [replyMessage, setReplyMessage] = useState<ChatMessage | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedGroupTypes, setSelectedGroupTypes] = useState<string[]>([])
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [showGroupList, setShowGroupList] = useState(true)
  const [activeTab, setActiveTab] = useState<'groups' | 'direct'>('direct')
  
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
    loadDirectChatUsers()
  }, [user])

  // Load direct chat users
  const loadDirectChatUsers = async () => {
    if (!user) return

    try {
      const teamMembers = await chatService.getAvailableTeamMembers()
      // Filter out current user
      const filteredMembers = teamMembers.filter(member => member.user_id !== user.id)
      setDirectChatUsers(filteredMembers)

      // Fetch unread counts per sender for the current user
      try {
        const { data: unread } = await supabase.rpc('get_unread_direct_counts')
        const map: Record<string, number> = {}
        ;(unread || []).forEach((row: any) => {
          if (row.sender_id) map[row.sender_id] = row.unread_count || 0
        })
        setUnreadBySender(map)
      } catch {}
    } catch (error) {
      console.error('Errore nel caricamento degli utenti per chat dirette:', error)
      toast.error('Errore nel caricamento degli utenti')
    }
  }

  // Load messages and members when group is selected
  useEffect(() => {
    if (!selectedGroup && !selectedDirectUser) return

    const loadData = async () => {
      try {
        if (selectedGroup) {
          const [messagesData, membersData] = await Promise.all([
            chatService.getMessages(selectedGroup.id),
            chatService.getGroupMembers(selectedGroup.id)
          ])
          setMessages(messagesData)
          setMembers(membersData)
        } else if (selectedDirectUser) {
          const directMessages = await loadDirectMessages(user.id, selectedDirectUser.user_id)
          setMessages(directMessages)
          setMembers([]) // No members for direct chat
        }
        // Force scroll to bottom after messages are loaded
        setTimeout(() => {
          scrollToBottom()
        }, 150)
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error)
        toast.error('Errore nel caricamento dei messaggi')
      }
    }

    loadData()
  }, [selectedGroup, selectedDirectUser, user])

  // Load direct messages between two users
  const loadDirectMessages = async (userId1: string, userId2: string): Promise<ChatMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching direct messages:', error)
        return []
      }

      if (!data || data.length === 0) {
        return []
      }

      // Get user information for both users
      const userIds = [...new Set(data.map(msg => msg.sender_id).concat(data.map(msg => msg.recipient_id)))]
      const { data: teamData } = await supabase
        .from('team')
        .select('user_id, name, email, avatar_url')
        .in('user_id', userIds)
        .eq('is_active', true)

      // Transform messages to match ChatMessage interface
      const messagesWithUserInfo = data.map(message => {
        const teamInfo = teamData?.find(t => t.user_id === message.sender_id)
        
        return {
          ...message,
          group_id: '', // Not applicable for direct messages
          user: {
            id: message.sender_id,
            email: teamInfo?.email || '',
            user_metadata: {
              full_name: teamInfo?.name || 'Utente sconosciuto',
              avatar_url: teamInfo?.avatar_url || null
            }
          }
        }
      })

      return messagesWithUserInfo as ChatMessage[]
    } catch (error) {
      console.error('Error in loadDirectMessages:', error)
      return []
    }
  }

  // Real-time message subscription
  useEffect(() => {
    if (!selectedGroup && !selectedDirectUser) return

    let channel: any

    if (selectedGroup) {
      // Subscribe to group messages
      channel = supabase
        .channel(`messages:${selectedGroup.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `group_id=eq.${selectedGroup.id}`
          },
          (payload) => {
            setMessages(prev => {
              const next = payload.new as ChatMessage
              return prev.some(m => m.id === next.id) ? prev : [...prev, next]
            })
            setTimeout(() => {
              scrollToBottom()
            }, 100)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
            filter: `group_id=eq.${selectedGroup.id}`
          },
          (payload) => {
            setMessages(prev => prev.map(msg => (msg.id === payload.new.id ? (payload.new as ChatMessage) : msg)))
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'chat_messages',
            filter: `group_id=eq.${selectedGroup.id}`
          },
          (payload) => {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
          }
        )
        .subscribe((status) => {
          // Optional logging for troubleshooting
          // console.log('Group channel status', status)
        })
    } else if (selectedDirectUser) {
      // Subscribe to direct messages
      const channelName = `direct_messages_recipient_${user.id}`
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `recipient_id=eq.${user.id}`
          },
          async (payload) => {
            // Only handle messages from the currently opened direct user
            if (payload.new.sender_id !== selectedDirectUser.user_id) return

            const { data: teamData } = await supabase
              .from('team')
              .select('user_id, name, email, avatar_url')
              .eq('user_id', payload.new.sender_id)
              .eq('is_active', true)
              .single()

            const messageWithUserInfo = {
              ...payload.new,
              group_id: '',
              user: {
                id: payload.new.sender_id,
                email: teamData?.email || '',
                user_metadata: {
                  full_name: teamData?.name || 'Utente sconosciuto',
                  avatar_url: teamData?.avatar_url || null
                }
              }
            }

            setMessages(prev => {
              const next = messageWithUserInfo as ChatMessage
              return prev.some(m => m.id === next.id) ? prev : [...prev, next]
            })
            setTimeout(() => {
              scrollToBottom()
            }, 100)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'direct_messages',
            filter: `recipient_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.new.sender_id !== selectedDirectUser.user_id) return
            setMessages(prev => prev.map(msg => (msg.id === payload.new.id ? (payload.new as ChatMessage) : msg)))
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'direct_messages',
            filter: `recipient_id=eq.${user.id}`
          },
          (payload) => {
            // On delete, sender_id is in payload.old
            if (payload.old.sender_id !== selectedDirectUser.user_id) return
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
          }
        )
        .subscribe((status) => {
          // Optional logging for troubleshooting
          // console.log('Direct channel status', status)
        })
    }

    messageSubscription.current = channel

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedGroup, selectedDirectUser, user, supabase])

  // Global realtime subscription for direct messages to update unread counts in list view
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`realtime:direct_unread_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          const msg: any = payload.new
          // If the user is currently viewing this sender's chat, mark as read immediately and append
          if (selectedDirectUser && !showGroupList && msg.sender_id === selectedDirectUser.user_id) {
            try {
              await supabase
                .from('direct_message_reads')
                .upsert({ message_id: msg.id, user_id: user.id }, { onConflict: 'message_id,user_id' })
            } catch {}
            // Optimistically append minimal message to chat view if needed
            setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, { ...msg, group_id: '' } as any]))
            // Inform global UI (navbars) that unread counts changed
            window.dispatchEvent(new CustomEvent('chat:unreadCountsChanged'))
          } else {
            // Otherwise increment unread counter for that sender
            setUnreadBySender((prev) => ({ ...prev, [msg.sender_id]: (prev[msg.sender_id] ?? 0) + 1 }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, selectedDirectUser, showGroupList, supabase])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      })
    }
  }

  // Force scroll to bottom when entering chat view
  useEffect(() => {
    if (!showGroupList && (selectedGroup || selectedDirectUser)) {
      // Small delay to ensure messages are loaded
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }, [showGroupList, selectedGroup, selectedDirectUser])

  // Force scroll to bottom when new message is sent
  const handleSendMessage = async (content: string, replyTo?: string) => {
    if ((!selectedGroup && !selectedDirectUser) || !content.trim()) return

    try {
      if (selectedGroup) {
        await chatService.sendMessage(selectedGroup.id, content.trim(), replyTo)
      } else if (selectedDirectUser) {
        await sendDirectMessage(user.id, selectedDirectUser.user_id, content.trim(), replyTo)
      }
      setNewMessage('')
      setReplyMessage(null)
      // Force scroll to bottom after sending message
      setTimeout(() => {
        scrollToBottom()
      }, 50)
    } catch (error) {
      console.error('Errore nell\'invio del messaggio:', error)
      toast.error('Errore nell\'invio del messaggio')
    }
  }

  // Send direct message
  const sendDirectMessage = async (senderId: string, recipientId: string, content: string, replyTo?: string) => {
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: senderId,
          recipient_id: recipientId,
          content: content.trim(),
          reply_to: replyTo || null
        })
        .select()
        .single()

      if (error) {
        console.error('Error sending direct message:', error)
        throw error
      }

      // Get user info for the sent message
      const { data: teamData } = await supabase
        .from('team')
        .select('user_id, name, email, avatar_url')
        .eq('user_id', senderId)
        .eq('is_active', true)
        .single()

      const messageWithUserInfo = {
        ...data,
        group_id: '',
        user: {
          id: senderId,
          email: teamData?.email || '',
          user_metadata: {
            full_name: teamData?.name || 'Utente sconosciuto',
            avatar_url: teamData?.avatar_url || null
          }
        }
      }

      // Add to local state immediately
      setMessages(prev => [...prev, messageWithUserInfo as ChatMessage])
    } catch (error) {
      console.error('Error in sendDirectMessage:', error)
      throw error
    }
  }

  const handleReply = (message: ChatMessage) => {
    setReplyMessage(message)
  }

  const handleEdit = async (message: ChatMessage) => {
    const newContent = prompt('Modifica messaggio:', message.content)
    if (newContent && newContent !== message.content) {
      try {
        await chatService.editMessage(message.id, newContent)
        toast.success('Messaggio aggiornato')
      } catch (error) {
        console.error('Errore nell\'aggiornamento del messaggio:', error)
        toast.error('Errore nell\'aggiornamento del messaggio')
      }
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo messaggio?')) return

    try {
      // Group chat message deletion
      if (selectedGroup) {
        await chatService.deleteMessage(messageId)
        // Aggiorna subito l'interfaccia in modo ottimistico
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId
              ? { ...m, is_deleted: true, content: 'Questo messaggio è stato eliminato' }
              : m
          )
        )
        toast.success('Messaggio eliminato')
        return
      }

      // Direct message deletion
      if (selectedDirectUser) {
        const { error } = await supabase
          .from('direct_messages')
          .update({
            is_deleted: true,
            content: 'Questo messaggio è stato eliminato',
            updated_at: new Date().toISOString()
          })
          .eq('id', messageId)

        if (error) throw error

        // Aggiorna immediatamente lo stato locale
        setMessages(prev =>
          prev.map(m =>
            m.id === messageId
              ? { ...m, is_deleted: true, content: 'Questo messaggio è stato eliminato' }
              : m
          )
        )
        toast.success('Messaggio eliminato')
        return
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione del messaggio:', error)
      toast.error('Errore nell\'eliminazione del messaggio')
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
      setGroups(prev => [...prev, newGroup])
      setShowCreateGroupModal(false)
      toast.success('Gruppo creato con successo')
    } catch (error) {
      console.error('Errore nella creazione del gruppo:', error)
      toast.error('Errore nella creazione del gruppo')
    }
  }

  const getCurrentUserRole = () => {
    if (!selectedGroup || !user) return null
    return members.find(member => member.user_id === user.id)?.role
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  // Filter groups based on search and filters
  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const matchesSearch = searchQuery === '' || 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = selectedGroupTypes.length === 0 || 
        selectedGroupTypes.includes('general')
      
      return matchesSearch && matchesType
    })
  }, [groups, searchQuery, selectedGroupTypes])

  // Group types for filtering
  const groupTypes = [
    { value: 'general', label: 'Generale' },
    { value: 'support', label: 'Supporto' },
    { value: 'announcements', label: 'Annunci' }
  ]

  if (!isOpen) return null

  // If inline, render as a flex container within the sidebar
  if (inline) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header - Match main sidebar header structure */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800/40 dark:to-purple-700/40 rounded-lg flex items-center justify-center">
                <Chat className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {showGroupList ? 'Chat' : selectedGroup?.name || selectedDirectUser?.name || 'Chat'}
              </h2>
            </div>
            <div className="flex items-center gap-1">
              {!showGroupList && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowGroupList(true)
                    setSelectedGroup(null)
                    setSelectedDirectUser(null)
                  }}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-md transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {showGroupList && activeTab === 'groups' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateGroupModal(true)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:text-gray-400 dark:hover:text-purple-400 dark:hover:bg-purple-900/20 rounded-md transition-all duration-200"
                >
                  <Add className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Gruppi nascosti: rimosso il selettore tab */}

          {/* Gruppi nascosti: rimosso search e filtri gruppi */}
        </div>

        {/* Filters Panel - Only show for group list and groups tab */}
        {/* Gruppi nascosti: rimosso pannello filtri gruppi */}

        {/* Content Area - Match main sidebar content structure */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-teams min-h-0">
          {showGroupList ? (
            // List View (Direct Users only, groups hidden)
            <>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce"></div>
                  </div>
                </div>
              ) : (
                // Direct Messages Tab
                <>
                  {directChatUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-8">
                      <User className="h-12 w-12 text-gray-500 dark:text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
                        Nessun membro
                      </h3>
                      <p className="text-gray-600 dark:text-slate-400 mb-4 text-sm">
                        Non ci sono altri membri del team disponibili per la chat diretta
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {directChatUsers.map((directUser) => (
                        <motion.div
                          key={directUser.user_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card 
                            className={`cursor-pointer transition-all duration-200 hover:shadow-lg dark:hover:shadow-xl ${
                              selectedDirectUser?.user_id === directUser.user_id 
                                ? 'ring-2 ring-purple-500 dark:ring-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                                : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                            }`}
                            onClick={() => {
                              setSelectedDirectUser(directUser)
                              setShowGroupList(false)
                               // Mark all messages from this sender to me as read and clear badge
                               ;(async () => {
                                 try {
                                   if (!user?.id) return
                                   const { data: unreadMsgs } = await supabase
                                     .from('direct_messages')
                                     .select('id')
                                     .eq('sender_id', directUser.user_id)
                                     .eq('recipient_id', user.id)
                                   if (unreadMsgs && unreadMsgs.length > 0) {
                                     const upserts = unreadMsgs.map((m: any) => ({ message_id: m.id, user_id: user.id }))
                                     // Batch upserts to avoid payload limits
                                     const batchSize = 200
                                     for (let i = 0; i < upserts.length; i += batchSize) {
                                       const slice = upserts.slice(i, i + batchSize)
                                       await supabase.from('direct_message_reads').upsert(slice, { onConflict: 'message_id,user_id' })
                                     }
                                   }
                                   setUnreadBySender(prev => ({ ...prev, [directUser.user_id]: 0 }))
                                  // Inform global UI (navbars) that unread counts changed
                                  window.dispatchEvent(new CustomEvent('chat:unreadCountsChanged'))
                                 } catch {}
                               })()
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <StableAvatar
                                  src={directUser.avatar_url}
                                  alt={directUser.name}
                                  fallback={getInitials(directUser.name)}
                                  className="w-10 h-10 shadow-sm flex-shrink-0"
                                  fallbackClassName="text-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white font-medium"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 dark:text-slate-100 truncate text-sm">
                                    {directUser.name}
                                  </h4>
                                  {directUser.email && (
                                    <p className="text-xs text-gray-600 dark:text-slate-400 truncate mt-1">
                                      {directUser.email}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                                      Chat diretta
                                    </Badge>
                                     {unreadBySender[directUser.user_id] > 0 && (
                                       <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-600 text-white">
                                         {unreadBySender[directUser.user_id]} non letti
                                       </span>
                                     )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
              ) : (
                // Chat View - only direct chat header when selectedDirectUser
            <>
              {/* Chat Header */}
                {selectedDirectUser && (
                <div className="flex items-center gap-2.5 mb-3 p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700/50">
                  <div className="flex-shrink-0">
                    <StableAvatar
                      src={selectedDirectUser.avatar_url}
                      alt={selectedDirectUser.name}
                      fallback={getInitials(selectedDirectUser.name)}
                      className="w-6 h-6 shadow-sm"
                      fallbackClassName="text-xs bg-gradient-to-br from-purple-500 to-purple-600 text-white font-medium"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug">
                      {selectedDirectUser.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Chat diretta
                    </p>
                  </div>
                </div>
              )}
              
              {/* Messages */}
              <div className="space-y-2 px-1.5">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="group message-hover"
                  >
                    <div className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-end ${message.user_id === user?.id ? 'flex-row-reverse' : 'flex-row'} gap-2 max-w-[85%]`}>
                        {/* Avatar solo per ricevuti */}
                        {message.user_id !== user?.id && (
                          <div className="flex-shrink-0 mt-1">
                            <StableAvatar
                              src={message.user?.user_metadata?.avatar_url}
                              alt={message.user?.user_metadata?.full_name || 'User'}
                              fallback={getInitials(message.user?.user_metadata?.full_name || 'User')}
                              className="w-6 h-6 shadow-sm"
                              fallbackClassName="text-xs bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium"
                            />
                          </div>
                        )}

                        {/* Contenuto messaggio */}
                        <div className={`flex flex-col ${message.user_id === user?.id ? 'items-end text-right' : 'items-start text-left'} min-w-0`}>
                          {/* Nome (solo ricevuti) */}
                          {message.user_id !== user?.id && (
                            <div className="mb-0.5 text-[11px] text-gray-500 dark:text-slate-400">
                              {message.user?.user_metadata?.full_name || 'User'}
                            </div>
                          )}

                          {/* Bubble */}
                          <div className={`inline-block rounded-xl px-3 py-1.5 max-w-full ${
                            message.user_id === user?.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100'
                          }`}>
                            {message.reply_to && (
                              <div className={`text-xs mb-1 p-1 rounded-lg ${
                                message.user_id === user?.id ? 'bg-blue-700 text-blue-100' : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300'
                              }`}>
                                <div className="font-medium mb-1">
                                  Risposta a {message.reply_message?.user?.user_metadata?.full_name || 'User'}
                                </div>
                                <div className="truncate">
                                  {message.reply_message?.content || 'Messaggio'}
                                </div>
                              </div>
                            )}
                            <p className="text-sm leading-snug">{message.content}</p>
                          </div>

                          {/* Timestamp sotto bubble */}
                          <div className={`mt-0.5 text-[10px] text-gray-400 ${message.user_id === user?.id ? 'text-right' : 'text-left'}`}>
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: it })}
                          </div>

                          {/* Azioni (solo per i propri messaggi) */}
                          {message.user_id === user?.id && (
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
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}
        </div>

        {/* Gruppi nascosti: nessun bottone per creare gruppi in inline */}

        {/* Chat Input - Fixed at bottom for chat view */}
        {!showGroupList && (selectedGroup || selectedDirectUser) && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
            {replyMessage && (
              <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Reply className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Rispondendo a {replyMessage.user?.user_metadata?.full_name || 'User'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyMessage(null)}
                    className="h-6 w-6 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-100 dark:text-purple-400 dark:hover:text-purple-200 dark:hover:bg-purple-800/30 rounded"
                  >
                    <Close className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm text-purple-600 dark:text-purple-300 truncate">
                  {replyMessage.content}
                </p>
              </div>
            )}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Scrivi un messaggio..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(newMessage, replyMessage?.id)
                    }
                  }}
                  className="border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                />
              </div>
              <Button
                onClick={() => handleSendMessage(newMessage, replyMessage?.id)}
                disabled={!newMessage.trim()}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg w-10 h-10 p-0 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Create Group Modal */}
        <CreateGroupDialog
          open={showCreateGroupModal}
          onOpenChange={(open) => setShowCreateGroupModal(open)}
          onCreateGroup={handleCreateGroup}
        />
      </div>
    )
  }

  // Original fixed overlay version
  return (
    <div className={`fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-2xl z-50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800/40 dark:to-purple-700/40 rounded-lg flex items-center justify-center">
            <Chat className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-md transition-all duration-200"
        >
          <Close className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showGroupList ? (
          // Group List View
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Gruppi nascosti (overlay): rimosso search e filtri */}

            {/* Gruppi nascosti (overlay): rimosso pannello filtri */}

            {/* Gruppi nascosti (overlay): rimosso elenco gruppi */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0" />

            {/* Gruppi nascosti (overlay): rimosso bottone crea gruppo */}
          </div>
        ) : (
          // Chat View
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowGroupList(true)
                    setSelectedGroup(null)
                  }}
                  className="text-muted-foreground hover:text-primary hover:bg-accent p-2 rounded-md transition-all duration-200"
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </Button>
                <div className="flex items-center gap-3">
                  {/* Group Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-slate-700/60 dark:to-slate-600/60 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ring-1 ring-blue-100 dark:ring-slate-600/50">
                    <Chat className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                      {selectedGroup?.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 dark:text-slate-400">
                        {members.length} membri
                      </span>
                      {/* Member Avatars */}
                      <div className="flex -space-x-1">
                        {members.slice(0, 4).map((member, index) => (
                          <Avatar key={member.id} className="w-5 h-5 border border-white dark:border-slate-800">
                            <AvatarImage 
                              src={member.user?.user_metadata?.avatar_url || undefined} 
                              alt={member.user?.user_metadata?.full_name || 'User'}
                            />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                              {getInitials(member.user?.user_metadata?.full_name || 'User')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {members.length > 4 && (
                          <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-slate-600 border border-white dark:border-slate-800 flex items-center justify-center">
                            <span className="text-xs text-gray-600 dark:text-slate-400 font-medium">
                              +{members.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <OverflowMenuVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <View className="h-4 w-4 mr-2" />
                    Dettagli gruppo
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <UserFollow className="h-4 w-4 mr-2" />
                    Gestisci membri
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[85%] ${message.user_id === user?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    {message.user_id !== user?.id && (
                      <div className="flex-shrink-0">
                        <Avatar className="w-6 h-6">
                          <AvatarImage 
                            src={message.user?.user_metadata?.avatar_url || undefined} 
                            alt={message.user?.user_metadata?.full_name || 'User'}
                          />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                            {getInitials(message.user?.user_metadata?.full_name || 'User')}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    
                    {/* Message Content */}
                    <div className={`flex flex-col ${message.user_id === user?.id ? 'items-end' : 'items-start'}`}>
                      {/* Name for received messages */}
                      {message.user_id !== user?.id && (
                        <div className="mb-0.5 text-[11px] text-gray-500 dark:text-slate-400">
                          {message.user?.user_metadata?.full_name || 'User'}
                        </div>
                      )}
                      
                      {/* Message Bubble */}
                      <div className={`rounded-xl px-3 py-1.5 max-w-full ${
                        message.user_id === user?.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100'
                      }`}>
                        {message.reply_to && (
                          <div className={`text-xs mb-1 p-1 rounded-lg ${
                            message.user_id === user?.id 
                              ? 'bg-blue-700 text-blue-100' 
                              : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-300'
                          }`}>
                            <div className="font-medium mb-1">
                              Risposta a {message.reply_message?.user?.user_metadata?.full_name || 'User'}
                            </div>
                            <div className="truncate">
                              {message.reply_message?.content || 'Messaggio'}
                            </div>
                          </div>
                        )}
                        <p className="text-sm leading-snug">{message.content}</p>
                        
                        {/* Message Actions */}
                        {message.user_id === user?.id && (
                          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(message)}
                              className="h-6 w-6 p-0 text-blue-100 hover:text-white hover:bg-blue-700 rounded-full"
                            >
                              <View className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(message.id)}
                              className="h-6 w-6 p-0 text-blue-100 hover:text-white hover:bg-blue-700 rounded-full"
                            >
                              <Close className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Timestamp below bubble */}
                      <div className={`mt-0.5 text-[10px] text-gray-400 ${message.user_id === user?.id ? 'text-right' : 'text-left'}`}>
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: it })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex-shrink-0">
              {replyMessage && (
                <div className="mb-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-slate-400">
                      Rispondendo a {replyMessage.user?.user_metadata?.full_name || 'User'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyMessage(null)}
                      className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full"
                    >
                      <Close className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-slate-100 truncate">
                    {replyMessage.content}
                  </p>
                </div>
              )}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Scrivi un messaggio..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(newMessage, replyMessage?.id)
                      }
                    }}
                    className="rounded-2xl border-gray-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                  />
                </div>
                <Button
                  onClick={() => handleSendMessage(newMessage, replyMessage?.id)}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 dark:bg-slate-700 hover:bg-blue-700 dark:hover:bg-slate-600 text-white rounded-full w-10 h-10 p-0 flex items-center justify-center"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupDialog
        open={showCreateGroupModal}
        onOpenChange={(open) => setShowCreateGroupModal(open)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  )
}