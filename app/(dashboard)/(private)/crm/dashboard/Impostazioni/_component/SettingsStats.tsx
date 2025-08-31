"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Users, Settings, Shield, TrendingUp, Mail } from "lucide-react"

interface StatItem {
  label: string
  value: string
  icon: any
  color: string
}

interface SettingsStatsProps {
  activeTab: string
}

const getStatsForTab = (tab: string): StatItem[] => {
  switch (tab) {
    case "appuntamenti":
      return []
    case "membri":
      return []
    case "permessi":
      return []
    case "stati":
      return []
    case "tasse":
      return []
    case "sicurezza":
      return []
    case "email":
      return []
    case "supporto":
      return []
    default:
      return []
  }
}

export default function SettingsStats({ activeTab }: SettingsStatsProps) {
  const stats = getStatsForTab(activeTab)

  if (stats.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <Card key={index} className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
