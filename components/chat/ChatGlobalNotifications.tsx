"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useCarbonNotifications } from '@/hooks/use-carbon-notifications'
import { dispatchChatNotificationEvent } from '@/app/(dashboard)/(private)/crm/dashboard/utils/chatEvents'

/**
 * Global listener for chat notifications across the whole dashboard.
 * - Listens for direct messages where the current user is the recipient
 * - Listens for group chat messages (RLS restricts to groups the user can access)
 * Shows Carbon-style notifications in the bottom-right corner.
 */
export const ChatGlobalNotifications: React.FC = () => {
  const supabase = useMemo(() => createClient(), [])
  const notifications = useCarbonNotifications()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const notifiedMessageIdsRef = useRef<Set<string>>(new Set())

  // Load current user id once
  useEffect(() => {
    let isMounted = true
    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return
        setCurrentUserId(data.user?.id ?? null)
      } catch (_) {
        setCurrentUserId(null)
      }
    }
    loadUser()
    return () => {
      isMounted = false
    }
  }, [supabase])

  // Subscribe for notifications
  useEffect(() => {
    if (!currentUserId) return

    const notifyOnce = (
      id: string,
      title: string,
      subtitle?: string,
      payload?: Parameters<typeof dispatchChatNotificationEvent>[0]['payload']
    ) => {
      if (notifiedMessageIdsRef.current.has(id)) return
      notifiedMessageIdsRef.current.add(id)
      console.log('[ChatGlobalNotifications] notifyOnce ->', { id, title, hasSubtitle: !!subtitle, payload })
      notifications.info(title, subtitle)
      // Emit global event for navbar badge
      dispatchChatNotificationEvent({ id, title, subtitle, payload })
    }

    // Direct messages to me
    const directChannel = supabase
      .channel(`global:direct_messages:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `recipient_id=eq.${currentUserId}`,
        },
        async (payload) => {
          console.log('[ChatGlobalNotifications] direct_messages INSERT received')
          try {
            const message = payload.new as any
            if (message.sender_id === currentUserId) return

            const { data: teamData } = await supabase
              .from('team')
              .select('user_id, name')
              .eq('user_id', message.sender_id)
              .eq('is_active', true)
              .single()

            const senderName = teamData?.name || 'Nuovo messaggio'
            notifyOnce(
              message.id,
              `Nuovo messaggio da ${senderName}`,
              (message.content || '').toString(),
              {
                type: 'direct',
                senderName,
                avatarUrl: null,
                messagePreview: (message.content || '').toString(),
              }
            )
          } catch {}
        }
      )
      .subscribe((status) => {
        console.log('[ChatGlobalNotifications] direct_messages channel status:', status)
      })

    // Group messages (RLS must allow)
    const groupChannel = supabase
      .channel(`global:chat_messages:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          console.log('[ChatGlobalNotifications] chat_messages INSERT received')
          try {
            const message = payload.new as any
            if (message.user_id === currentUserId) return

            const [{ data: teamData }, { data: groupData }] = await Promise.all([
              supabase
                .from('team')
                .select('user_id, name')
                .eq('user_id', message.user_id)
                .eq('is_active', true)
                .single(),
              supabase
                .from('chat_groups')
                .select('id, name')
                .eq('id', message.group_id)
                .single(),
            ])

            const senderName = teamData?.name || 'Membro'
            const groupNameText = groupData?.name ? ` in ${groupData.name}` : ''
            notifyOnce(
              message.id,
              `Nuovo messaggio da ${senderName}${groupNameText}`,
              (message.content || '').toString(),
              {
                type: 'group',
                senderName,
                groupName: groupData?.name || undefined,
                avatarUrl: null,
                messagePreview: (message.content || '').toString(),
              }
            )
          } catch {}
        }
      )
      .subscribe((status) => {
        console.log('[ChatGlobalNotifications] chat_messages channel status:', status)
      })

    return () => {
      supabase.removeChannel(directChannel)
      supabase.removeChannel(groupChannel)
    }
  }, [currentUserId, notifications, supabase])

  return null
}

export default ChatGlobalNotifications


