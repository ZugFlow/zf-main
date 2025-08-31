'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Chat } from '@carbon/icons-react'
import { ChatSidebar } from './ChatSidebar'

export function ChatSidebarDemo() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-4 right-4 z-40 bg-blue-600 dark:bg-slate-700 hover:bg-blue-700 dark:hover:bg-slate-600 text-white shadow-lg rounded-full w-14 h-14 p-0"
      >
        <Chat className="h-6 w-6" />
      </Button>

      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </>
  )
} 