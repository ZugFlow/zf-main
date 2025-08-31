import { createClient } from '@/utils/supabase/client'
import { getSalonId } from '@/utils/getSalonId'

export interface ChatGroup {
  id: string
  name: string
  description?: string
  created_by: string
  created_at: string
  updated_at: string
  avatar_url?: string
  is_private: boolean
  max_members: number
  member_count?: number
  unread_count?: number
}

export interface ChatMessage {
  id: string
  group_id: string
  user_id: string
  content: string
  message_type: 'text' | 'image' | 'file' | 'system'
  reply_to?: string
  created_at: string
  updated_at: string
  is_edited: boolean
  is_deleted: boolean
  attachments: any[]
  user?: {
    id: string
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  }
  reactions?: ChatReaction[]
  reply_message?: ChatMessage
}

export interface ChatGroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'moderator' | 'member'
  joined_at: string
  last_seen: string
  is_muted: boolean
  user?: {
    id: string
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export interface ChatReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
  user?: {
    user_metadata: {
      full_name?: string
    }
  }
}

export interface TeamMember {
  user_id: string
  name: string
  email: string
  avatar_url?: string
}

class ChatService {
  private supabase = createClient()
  private userCache: any = null
  private userCacheTime: number = 0
  private readonly CACHE_DURATION = 30000 // 30 seconds
  private instanceId = Math.random().toString(36).substr(2, 9)

  constructor() {
    console.log(`🔧 ChatService instance created: ${this.instanceId}`)
  }

  // Get cached user or fetch new one
  private async getCurrentUser() {
    const now = Date.now()
    
    // Return cached user if still valid
    if (this.userCache && (now - this.userCacheTime) < this.CACHE_DURATION) {
      console.log(`📦 Using cached user for instance ${this.instanceId}`)
      
      // Verifica che l'utente cached sia ancora valido
      try {
        const { data: { user } } = await this.supabase.auth.getUser()
        if (user && user.id === this.userCache.id) {
          return this.userCache
        } else {
          console.log('🔄 Cached user is no longer valid, refreshing...')
          this.clearUserCache()
        }
      } catch (error) {
        console.error('❌ Error validating cached user:', error)
        this.clearUserCache()
      }
    }

    // Fetch new user
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error) {
        console.error('❌ Error getting current user:', error)
        this.clearUserCache()
        return null
      }
      
      if (!user) {
        console.log('⚠️ No authenticated user found')
        this.clearUserCache()
        return null
      }

      // Cache the user
      this.userCache = user
      this.userCacheTime = now
      
      console.log(`✅ User cached for instance ${this.instanceId}:`, user.id)
      return user
    } catch (error) {
      console.error('❌ Error in getCurrentUser:', error)
      this.clearUserCache()
      return null
    }
  }

  // Clear cache when needed
  private clearUserCache() {
    this.userCache = null
    this.userCacheTime = 0
  }

  // GRUPPI
  async getGroups(): Promise<ChatGroup[]> {
    try {
      // Verifica utente autenticato
      const user = await this.getCurrentUser()
      
      if (!user) {
        console.log('User not authenticated')
        return []
      }
      
      // Ottieni tutti i gruppi dell'utente
      const { data: groupsData, error } = await this.supabase
        .from('chat_groups')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching groups:', error)
        return []
      }

      if (!groupsData || groupsData.length === 0) {
        return []
      }

      // Per ogni gruppo, ottieni il conteggio dei membri
      const groupsWithCount = await Promise.all(
        groupsData.map(async (group) => {
          const { count, error: countError } = await this.supabase
            .from('chat_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)

          if (countError) {
            console.error('Error counting members for group:', group.id, countError)
          }

          return {
            ...group,
            member_count: count || 0
          }
        })
      )

      return groupsWithCount
    } catch (error) {
      console.error('Error in getGroups:', error)
      return []
    }
  }

  async createGroupWithMembers(
    group: Partial<ChatGroup>, 
    memberIds: string[] = []
  ): Promise<ChatGroup> {
    try {
      const { data: groupId, error } = await this.supabase
        .rpc('create_chat_group_with_members', {
          group_name: group.name!,
          group_description: group.description || null,
          group_avatar_url: group.avatar_url || null,
          group_is_private: group.is_private || false,
          group_max_members: group.max_members || 100,
          member_ids: memberIds
        })

      if (error) {
        console.error('Error creating group:', error)
        throw error
      }

      // Recupera il gruppo creato
      const { data: groupData, error: fetchError } = await this.supabase
        .from('chat_groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (fetchError) {
        console.error('Error fetching created group:', fetchError)
        throw fetchError
      }

      // Calcola subito il numero membri per evitare che compaia 0 nel client
      let memberCount = 0
      try {
        const { count } = await this.supabase
          .from('chat_group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', groupId)
        memberCount = count || 0
      } catch (countError) {
        console.warn('Warning counting members for newly created group:', countError)
      }

      return { ...groupData, member_count: memberCount }
    } catch (error) {
      console.error('Error in createGroupWithMembers:', error)
      throw error
    }
  }

  // DEBUG FUNCTION
  async debugUserTeamMembership(): Promise<{ 
    user: any, 
    teamMember: any, 
    salonId: string | null,
    hasTeamMembership: boolean 
  }> {
    try {
      const user = await this.getCurrentUser()
      
      if (!user) {
        return { user: null, teamMember: null, salonId: null, hasTeamMembership: false }
      }

      // Get user's salon_id using the utility function
      const salonId = await getSalonId()

      // Get team member data
      const { data: teamMember } = await this.supabase
        .from('team')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      return {
        user: user,
        teamMember,
        salonId: salonId,
        hasTeamMembership: !!teamMember
      }
    } catch (error) {
      console.error('❌ Error in debugUserTeamMembership:', error)
      return { user: null, teamMember: null, salonId: null, hasTeamMembership: false }
    }
  }

  // TEST FUNCTION
  async testTeamMembersFunction(): Promise<{ success: boolean, data?: any, error?: any }> {
    try {
      console.log('🧪 Testing team members RPC function...')
      
      // Test 1: Check if function exists
      const { data, error } = await this.supabase
        .rpc('get_team_members_for_chat')
      
      if (error) {
        console.error('❌ RPC function error:', error)
        return { success: false, error }
      }
      
      console.log('✅ RPC function works, data:', data)
      return { success: true, data }
    } catch (error) {
      console.error('❌ Test function error:', error)
      return { success: false, error }
    }
  }

  // MEMBRI DEL TEAM
  async getAvailableTeamMembers(): Promise<TeamMember[]> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        console.error('❌ User not authenticated')
        throw new Error('User not authenticated')
      }

      // Get salon_id using the utility function
      const salonId = await getSalonId()
      
      if (!salonId) {
        console.error('❌ No salon_id found for user:', user.id)
        throw new Error('No salon_id found for current user. Please ensure you are associated with a salon.')
      }

      console.log('🏢 Using salon_id:', salonId)

      // Get team members using RPC function
      const { data, error } = await this.supabase
        .rpc('get_team_members_for_chat')

      if (error) {
        console.error('❌ Error calling get_team_members_for_chat:', error)
        
        // Fallback: query manuale se la funzione RPC non funziona
        console.log('🔄 Falling back to manual query...')
        const { data: fallbackData, error: fallbackError } = await this.supabase
          .from('team')
          .select('user_id, name, email, avatar_url')
          .eq('salon_id', salonId)
          .eq('is_active', true)
          .order('name')

        if (fallbackError) {
          console.error('❌ Fallback query also failed:', fallbackError)
          throw fallbackError
        }

        console.log('✅ Fallback query successful:', fallbackData?.length || 0, 'members')
        return fallbackData || []
      }

      console.log('✅ RPC function successful:', data?.length || 0, 'members')
      return data || []
    } catch (error) {
      console.error('❌ Error in getAvailableTeamMembers:', error)
      throw error
    }
  }

  // MEMBRI DEL GRUPPO
  async getGroupMembers(groupId: string): Promise<ChatGroupMember[]> {
    try {
      // Ottieni i membri del gruppo
      const { data: membersData, error: membersError } = await this.supabase
        .from('chat_group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true })

      if (membersError) {
        console.error('Error fetching group members:', membersError)
        throw membersError
      }

      if (!membersData || membersData.length === 0) {
        return []
      }

      // Ottieni le informazioni degli utenti dal team
      const userIds = membersData.map(member => member.user_id)
      const { data: teamData } = await this.supabase
        .from('team')
        .select('user_id, name, email, avatar_url')
        .in('user_id', userIds)
        .eq('is_active', true)

      // Combina i dati
      const membersWithUserInfo = membersData.map(member => {
        const teamInfo = teamData?.find(t => t.user_id === member.user_id)
        
        return {
          ...member,
          user: {
            id: member.user_id,
            email: teamInfo?.email || '',
            user_metadata: {
              full_name: teamInfo?.name || 'Utente sconosciuto',
              avatar_url: teamInfo?.avatar_url || null
            }
          }
        }
      })

      return membersWithUserInfo as ChatGroupMember[]
    } catch (error) {
      console.error('Error in getGroupMembers:', error)
      return []
    }
  }

  // MESSAGGI
  async getMessages(groupId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    try {
      const { data, error } = await this.supabase
        .from('chat_messages')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching messages:', error)
        throw error
      }

      if (!data || data.length === 0) {
        return []
      }

      // Ottieni informazioni degli utenti
      const userIds = [...new Set(data.map(msg => msg.user_id))]
      const { data: teamData } = await this.supabase
        .from('team')
        .select('user_id, name, email, avatar_url')
        .in('user_id', userIds)
        .eq('is_active', true)

      // Combina i dati
      const messagesWithUserInfo = data.map(message => {
        const teamInfo = teamData?.find(t => t.user_id === message.user_id)
        
        return {
          ...message,
          user: {
            id: message.user_id,
            email: teamInfo?.email || '',
            user_metadata: {
              full_name: teamInfo?.name || 'Utente sconosciuto',
              avatar_url: teamInfo?.avatar_url || null
            }
          }
        }
      })

      return messagesWithUserInfo.reverse() as ChatMessage[]
    } catch (error) {
      console.error('Error in getMessages:', error)
      return []
    }
  }

  async sendMessage(groupId: string, content: string, replyTo?: string): Promise<ChatMessage> {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await this.supabase
        .from('chat_messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content: content.trim(),
          reply_to: replyTo || null
        })
        .select()
        .single()

      if (error) {
        console.error('Error sending message:', error)
        throw error
      }

      // Ottieni informazioni dell'utente
      const { data: teamData } = await this.supabase
        .from('team')
        .select('user_id, name, email, avatar_url')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      const messageWithUserInfo = {
        ...data,
        user: {
          id: user.id,
          email: teamData?.email || user.email || '',
          user_metadata: {
            full_name: teamData?.name || user.email?.split('@')[0] || 'Utente sconosciuto',
            avatar_url: teamData?.avatar_url || user.user_metadata?.avatar_url || null
          }
        }
      }

      return messageWithUserInfo as ChatMessage
    } catch (error) {
      console.error('Error in sendMessage:', error)
      throw error
    }
  }

  async editMessage(messageId: string, content: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('chat_messages')
        .update({
          content: content.trim(),
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)

      if (error) throw error
    } catch (error) {
      console.error('Error in editMessage:', error)
      throw error
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('chat_messages')
        .update({
          is_deleted: true,
          content: 'Questo messaggio è stato eliminato',
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)

      if (error) throw error
    } catch (error) {
      console.error('Error in deleteMessage:', error)
      throw error
    }
  }

  // GESTIONE GRUPPI
  async joinGroup(groupId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await this.supabase
        .from('chat_group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error in joinGroup:', error)
      throw error
    }
  }

  async leaveGroup(groupId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await this.supabase
        .from('chat_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Error in leaveGroup:', error)
      throw error
    }
  }

  // REAZIONI
  async addReaction(messageId: string, emoji: string): Promise<void> {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await this.supabase
        .from('chat_message_reactions')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          emoji
        })

      if (error) throw error
    } catch (error) {
      console.error('Error in addReaction:', error)
      throw error
    }
  }

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await this.supabase
        .from('chat_message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)

      if (error) throw error
    } catch (error) {
      console.error('Error in removeReaction:', error)
      throw error
    }
  }

  // REAL-TIME SUBSCRIPTIONS
  subscribeToMessages(groupId: string, callback: (message: ChatMessage) => void) {
    console.log('🔄 Creating subscription for group:', groupId)
    
    return this.supabase
      .channel(`messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          console.log('📨 New message payload:', payload)
          try {
            const { data: messageData } = await this.supabase
              .from('chat_messages')
              .select('*')
              .eq('id', payload.new.id)
              .single()

            if (messageData) {
              // Migliorata gestione errori per team data
              let teamData = null
              try {
                const { data: teamResult } = await this.supabase
                  .from('team')
                  .select('user_id, name, email, avatar_url')
                  .eq('user_id', messageData.user_id)
                  .eq('is_active', true)
                  .single()
                teamData = teamResult
              } catch (teamError) {
                console.warn('⚠️ Team data not found for user:', messageData.user_id, teamError)
                // Continua con dati di fallback
              }

              const messageWithUserInfo = {
                ...messageData,
                user: {
                  id: messageData.user_id,
                  email: teamData?.email || messageData.user_id, // Fallback all'ID utente
                  user_metadata: {
                    full_name: teamData?.name || `Utente ${messageData.user_id.slice(0, 8)}`,
                    avatar_url: teamData?.avatar_url || null
                  }
                }
              }

              console.log('✅ Calling callback with message:', messageWithUserInfo)
              callback(messageWithUserInfo as ChatMessage)
            }
          } catch (error) {
            console.error('❌ Error in message subscription:', error)
            // Non bloccare il flusso per errori di singoli messaggi
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Group messages subscription status:', status)
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error in subscription')
        }
      })
  }

  // UTILITY
  async markAsRead(messageId: string): Promise<void> {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await this.supabase
        .from('chat_message_reads')
        .upsert({
          message_id: messageId,
          user_id: user.id
        })

      if (error) throw error
    } catch (error) {
      console.error('Error in markAsRead:', error)
      throw error
    }
  }

  // Handle auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      // Clear cache on auth state changes
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        this.clearUserCache()
      }
      callback(event, session)
    })
  }

  // Force refresh user cache
  async refreshUserCache() {
    this.clearUserCache()
    return await this.getCurrentUser()
  }
}

// Singleton pattern to prevent multiple instances during Fast Refresh
let chatServiceInstance: ChatService | null = null

export const chatService = (() => {
  if (!chatServiceInstance) {
    chatServiceInstance = new ChatService()
  }
  return chatServiceInstance
})()
