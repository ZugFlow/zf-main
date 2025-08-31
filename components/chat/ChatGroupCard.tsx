import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { Users, MessageSquare, Crown, Shield } from 'lucide-react'
import { ChatGroup, ChatGroupMember } from '@/lib/chat-service'

interface ChatGroupCardProps {
  group: ChatGroup
  members?: ChatGroupMember[]
  currentUserId: string
  onClick: () => void
}

export function ChatGroupCard({ group, members = [], currentUserId, onClick }: ChatGroupCardProps) {
  const currentUserMember = members.find(m => m.user_id === currentUserId)
  const isAdmin = currentUserMember?.role === 'admin'
  const isModerator = currentUserMember?.role === 'moderator'

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-500" />
      case 'moderator':
        return <Shield className="h-3 w-3 text-blue-500" />
      default:
        return null
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4 border-l-blue-500"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={group.avatar_url} alt={group.name} />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {getInitials(group.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {group.name}
                </h3>
                {group.is_private && (
                  <Badge variant="secondary" className="text-xs">
                    Privato
                  </Badge>
                )}
                {(isAdmin || isModerator) && (
                  <div className="flex items-center">
                    {getRoleIcon(currentUserMember!.role)}
                  </div>
                )}
              </div>
            </div>
            
            {group.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {group.description}
              </p>
            )}
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Users className="h-3 w-3" />
                  <span>{members.length} membri</span>
                </div>
                
                {group.unread_count && group.unread_count > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <MessageSquare className="h-3 w-3" />
                    <span>{group.unread_count} non letti</span>
                  </div>
                )}
              </div>
              
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(group.updated_at), {
                  addSuffix: true,
                  locale: it
                })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
