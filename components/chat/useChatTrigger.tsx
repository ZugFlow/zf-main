'use client'

import { useEffect } from 'react'
import { useChatSidebar } from './ChatSidebarProvider'

export function useChatTrigger() {
  const { openChat, closeChat, toggleChat, isOpen } = useChatSidebar()

  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + C to toggle chat
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault()
        toggleChat()
      }
      
      // Escape to close chat
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        closeChat()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleChat, closeChat, isOpen])

  // Expose methods for programmatic control
  const triggerChat = () => {
    openChat()
  }

  const hideChat = () => {
    closeChat()
  }

  return {
    triggerChat,
    hideChat,
    toggleChat,
    isOpen
  }
} 