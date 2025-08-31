"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/context/theme-provider"

export function ThemeToggle() {
  const { theme, isLoading } = useTheme()

  if (isLoading) {
    return (
      <Button variant="outline" size="icon" disabled>
        <div className="h-[1.2rem] w-[1.2rem] animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
        <span className="sr-only">Caricamento tema</span>
      </Button>
    )
  }

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      case "dark":
        return <Moon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      case "system":
        return <Monitor className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
      default:
        return <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative opacity-50 cursor-not-allowed" disabled>
          {getThemeIcon()}
          <span className="sr-only">Tema - In arrivo presto</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled className="text-center text-gray-500">
          <div className="flex flex-col items-center py-2">
            <div className="text-sm font-medium mb-1">In arrivo presto</div>
            <div className="text-xs text-gray-400">Funzionalità tema personale</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 