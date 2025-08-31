import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { 
  MoreVertical, 
  Reply, 
  Edit, 
  Trash2, 
  Smile,
  Crown,
  Shield,
  User
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChatMessage } from '@/lib/chat-service'

interface ChatMessageItemProps {
  message: ChatMessage
  currentUserId: string
  userRole?: 'admin' | 'moderator' | 'member'
  onReply?: (message: ChatMessage) => void
  onEdit?: (message: ChatMessage) => void
  onDelete?: (messageId: string) => void
  onReaction?: (messageId: string, emoji: string) => void
}

export function ChatMessageItem({ 
  message, 
  currentUserId, 
  userRole = 'member',
  onReply, 
  onEdit, 
  onDelete, 
  onReaction 
}: ChatMessageItemProps) {
  const [showReactions, setShowReactions] = useState(false)
  
  const isOwner = message.user_id === currentUserId
  const canEdit = isOwner
  const canDelete = isOwner || userRole === 'admin' || userRole === 'moderator'

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getUserDisplayName = () => {
    return message.user?.user_metadata?.full_name || message.user?.email || 'Utente sconosciuto'
  }

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-500" />
      case 'moderator':
        return <Shield className="h-3 w-3 text-blue-500" />
      default:
        return <User className="h-3 w-3 text-gray-400" />
    }
  }

  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🎉']

  const handleEmojiClick = (emoji: string) => {
    onReaction?.(message.id, emoji)
    setShowReactions(false)
  }

  // Controlla se è un messaggio temporaneo (ottimistico)
  const isTemporaryMessage = message.id.startsWith('temp-')

  return (
    <div className={`flex items-start space-x-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${isOwner ? 'ml-8' : ''} ${isTemporaryMessage ? 'opacity-70' : ''} max-w-full`}>
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.user?.user_metadata?.avatar_url} alt={getUserDisplayName()} />
          <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs">
            {getInitials(getUserDisplayName())}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex-1 min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center space-x-2 mb-1 flex-wrap">
          <span className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
            {getUserDisplayName()}
          </span>
          {/* {getRoleIcon(userRole)} */}
          <span className="text-xs text-gray-500 dark:text-slate-400 flex-shrink-0">
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
              locale: it
            })}
          </span>
          {message.is_edited && (
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              modificato
            </Badge>
          )}
        </div>

        {message.reply_to && message.reply_message && (
          <div className="mb-2 p-2 bg-gray-100 dark:bg-slate-700 rounded-md border-l-2 border-blue-500 max-w-full overflow-hidden">
            <div className="text-xs text-gray-600 dark:text-slate-400 truncate">
              Risposta a: <span className="font-medium">{message.reply_message.user?.user_metadata?.full_name || 'Utente'}</span>
            </div>
            <div className="text-xs text-gray-700 dark:text-slate-300 truncate">
              {message.reply_message.content}
            </div>
          </div>
        )}

        <div className="max-w-full overflow-hidden">
          <p className="chat-message-content text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap break-words word-wrap overflow-wrap-anywhere leading-relaxed">
            {message.content}
          </p>
          {isTemporaryMessage && (
            <div className="flex items-center space-x-2 mt-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              <span className="text-xs text-gray-500 dark:text-slate-400">Invio in corso...</span>
            </div>
          )}
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => handleEmojiClick(reaction.emoji)}
              >
                {reaction.emoji}
              </Button>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
            onClick={() => onReply?.(message)}
            disabled={isTemporaryMessage}
          >
            <Reply className="h-3 w-3 mr-1" />
            Rispondi
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
            onClick={() => setShowReactions(!showReactions)}
            disabled={isTemporaryMessage}
          >
            <Smile className="h-3 w-3 mr-1" />
            Emoji
          </Button>

          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-red-500 hover:text-red-700"
              onClick={() => onDelete?.(message.id)}
              disabled={isTemporaryMessage}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Elimina
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                disabled={isTemporaryMessage}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit?.(message)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifica
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete?.(message.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {showReactions && !isTemporaryMessage && (
          <div className="flex flex-wrap gap-1 mt-2 p-2 bg-gray-50 rounded-md">
            {commonEmojis.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-gray-200"
                onClick={() => handleEmojiClick(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
