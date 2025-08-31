'use client'

import { ChevronRight } from 'lucide-react'

interface BreadcrumbProps {
  activeTab: string
}

const getTabLabel = (tab: string) => {
  switch (tab) {
    case 'appuntamenti':
      return 'Appuntamenti'
    case 'membri':
      return 'Gestione Team'
    case 'permessi':
      return 'Permessi e Autorizzazioni'
    case 'stati':
      return 'Stati Sistema'
    case 'tasse':
      return 'Gestione Fiscale'
    case 'sicurezza':
      return 'Sicurezza'
    case 'supporto':
      return 'Supporto Tecnico'
    default:
      return 'Impostazioni'
  }
}

export default function SettingsBreadcrumb({ activeTab }: BreadcrumbProps) {
  return null;
}
