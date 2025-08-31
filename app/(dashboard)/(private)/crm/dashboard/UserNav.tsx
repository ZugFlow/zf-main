'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User } from "lucide-react"
import { useLocalization } from "@/hooks/useLocalization"

interface UserNavProps {
  toggleImpostazioni: () => void;
  isInSettings: boolean;
  toggleProfile: () => void;
  isInProfile: boolean;
}

export function UserNav({ toggleImpostazioni, isInSettings, toggleProfile, isInProfile }: UserNavProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLocalization();

  useEffect(() => {
    const fetchUserInfo = async () => {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;
      // Set email
      if (user.email) {
        setUserEmail(user.email);
      }
      // Fetch member name from profiles (manager) or team (collaborator)
      let name = '';
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (!profileError && profileData?.full_name) {
        name = profileData.full_name;
      } else {
        const { data: teamData, error: teamError } = await supabase
          .from('team')
          .select('name')
          .eq('user_id', user.id)
          .single();
        if (!teamError && teamData?.name) {
          name = teamData.name;
        }
      }
      if (name) {
        setUserName(name);
      }
    };
    fetchUserInfo();
  }, []);

  const handleSettingsClick = () => {
    toggleImpostazioni();
    // Non modificare activeIcon qui, verrà impostato dalla navbar
  };

  const logout = async () => {
    if (confirm(t('usernav.confirm_logout'))) {
      setIsLoading(true);
      const supabaseClient = createClient();
      
      // Redirect immediato
      if (pathname && pathname.includes('/crm')) {
        router.push('/');
      }
      
      // Logout in background
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        console.error("Error during logout:", error.message);
      }
      router.refresh();
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/default.png" alt="User avatar" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName || t('usernav.user')}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail || t('usernav.loading')}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem 
            onClick={toggleProfile}
            className={isInProfile ? 
              "bg-purple-50 text-purple-700 font-medium hover:bg-purple-100" : 
              "hover:bg-purple-50 hover:text-purple-700"}
          >
            <User className={`mr-2 h-4 w-4 ${isInProfile ? 'text-purple-600' : ''}`} />
            <span className="relative">
              {t('usernav.profile')}
              {isInProfile && 
                <span className="absolute inset-0 bg-purple-100/50 rounded-sm -z-10"></span>
              }
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleSettingsClick}
            className={isInSettings ? 
              "bg-purple-50 text-purple-700 font-medium hover:bg-purple-100" : 
              "hover:bg-purple-50 hover:text-purple-700"}
          >
            <Settings className={`mr-2 h-4 w-4 ${isInSettings ? 'text-purple-600' : ''}`} />
            <span className="relative">
              {t('usernav.advanced_settings')}
              {isInSettings && 
                <span className="absolute inset-0 bg-purple-100/50 rounded-sm -z-10"></span>
              }
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={logout} 
          disabled={isLoading}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoading ? t('usernav.logging_out') : t('usernav.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}