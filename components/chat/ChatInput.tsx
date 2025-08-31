import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Send, X, Paperclip, Smile } from 'lucide-react'
import { ChatMessage } from '@/lib/chat-service'

interface ChatInputProps {
  onSend: (content: string, replyTo?: string) => void
  replyMessage?: ChatMessage
  onCancelReply?: () => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ 
  onSend, 
  replyMessage, 
  onCancelReply, 
  disabled = false,
  placeholder = "Scrivi un messaggio..." 
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [replyMessage])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (message.trim() && !disabled) {
      onSend(message.trim(), replyMessage?.id)
      setMessage('')
      setIsTyping(false)
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    setIsTyping(e.target.value.length > 0)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  const getUserDisplayName = (message: ChatMessage) => {
    return message.user?.user_metadata?.full_name || message.user?.email || 'Utente sconosciuto'
  }

  return (
    <div className="border-t bg-white p-4">
      {replyMessage && (
        <div className="mb-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-600 font-medium mb-1">
                Risposta a {getUserDisplayName(replyMessage)}
              </div>
              <div className="text-sm text-gray-700 line-clamp-2">
                {replyMessage.content}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[40px] max-h-[120px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            rows={1}
          />
        </div>
        
        <div className="flex space-x-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 text-gray-500 hover:text-gray-700"
            disabled={disabled}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 text-gray-500 hover:text-gray-700"
            disabled={disabled}
          >
            <Smile className="h-4 w-4" />
          </Button>
          
          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            className="h-10 w-10 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
      
      {isTyping && (
        <div className="mt-2 text-xs text-gray-500">
          Premi Invio per inviare, Shift + Invio per andare a capo
        </div>
      )}
    </div>
  )
}
