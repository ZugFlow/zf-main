"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

interface UserMenuProps {
  user: User;
}

const UserMenu = ({ user }: UserMenuProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
    if (confirm("Sei sicuro di voler effettuare il logout?")) {
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
      <DropdownMenuTrigger>
        <Image
          alt="avatar"
          src={user.user_metadata?.avatar_url || "/avatar.jpg"} // Avatar dinamico
          width={48}
          height={48}
          className="rounded-full"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white shadow-lg rounded-lg border border-gray-200">
        <DropdownMenuLabel className="text-gray-700 font-semibold">
          {user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 border-gray-300" />
        <Link href="/crm/dashboard" passHref>
          <DropdownMenuItem className="cursor-pointer text-gray-800 hover:bg-gray-100">
            CRM
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem
          onClick={logout}
          disabled={isLoading}
          className="cursor-pointer text-red-600 hover:bg-red-50"
        >
          {isLoading ? 'Uscita...' : 'Logout'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
