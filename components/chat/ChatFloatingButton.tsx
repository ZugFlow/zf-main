'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Chat } from '@carbon/icons-react'
import { useChatSidebar } from './ChatSidebarProvider'

interface ChatFloatingButtonProps {
  className?: string
  showBadge?: boolean
  badgeCount?: number
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export function ChatFloatingButton({ 
  className = '', 
  showBadge = false, 
  badgeCount = 0,
  position = 'bottom-right'
}: ChatFloatingButtonProps) {
  const { toggleChat, isOpen } = useChatSidebar()

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-40 ${className}`}>
      <Button
        onClick={toggleChat}
        className={`bg-blue-600 dark:bg-slate-700 hover:bg-blue-700 dark:hover:bg-slate-600 text-white shadow-lg rounded-full w-14 h-14 p-0 transition-all duration-200 ${
          isOpen ? 'scale-110 shadow-xl' : ''
        }`}
      >
        <Chat className="h-6 w-6" />
        {showBadge && badgeCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </Badge>
        )}
      </Button>
    </div>
  )
} 