'use client'

import React, { useState } from 'react'
import { ChatGroupsModal } from '@/components/chat/ChatGroupsModal'

export default function ChatPage() {
  const [showChat, setShowChat] = useState(true)

  return (
    <div className="h-full flex flex-col">
      <ChatGroupsModal 
        open={showChat} 
        onOpenChange={setShowChat} 
      />
    </div>
  )
} 