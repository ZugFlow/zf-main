'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { ChatSidebar } from './ChatSidebar'

interface ChatSidebarContextType {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
}

const ChatSidebarContext = createContext<ChatSidebarContextType | undefined>(undefined)

export function useChatSidebar() {
  const context = useContext(ChatSidebarContext)
  if (context === undefined) {
    throw new Error('useChatSidebar must be used within a ChatSidebarProvider')
  }
  return context
}

interface ChatSidebarProviderProps {
  children: ReactNode
}

export function ChatSidebarProvider({ children }: ChatSidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false)

  const openChat = () => setIsOpen(true)
  const closeChat = () => setIsOpen(false)
  const toggleChat = () => setIsOpen(!isOpen)

  return (
    <ChatSidebarContext.Provider value={{ isOpen, openChat, closeChat, toggleChat }}>
      {children}
      <ChatSidebar isOpen={isOpen} onClose={closeChat} />
    </ChatSidebarContext.Provider>
  )
} 