'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Type, 
  Palette, 
  Copy, 
  Check,
  Sparkles,
  Star,
  Heart,
  Award,
  Zap,
  Crown,
  Gem,
  Sun,
  Moon,
  Cloud,
  Mountain,
  Waves,
  Leaf,
  Flower,
  Home,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Linkedin
} from 'lucide-react'

interface FooterTemplate {
  id: string
  name: string
  description: string
  category: string
  backgroundColor: string
  textColor: string
  titleColor: string
  subtitleColor: string
  descriptionColor: string
  linkColor: string
  linkHoverColor: string
  borderColor: string
  socialIconColor: string
  socialIconHoverColor: string
  titleFontFamily: string
  subtitleFontFamily: string
  descriptionFontFamily: string
  titleFontSize: string
  subtitleFontSize: string
  descriptionFontSize: string
  titleBold: boolean
  subtitleBold: boolean
  descriptionBold: boolean
  copyrightText: string
  copyrightColor: string
  copyrightFontSize: string
  copyrightFontFamily: string
  showSocialLinks: boolean
  showContactInfo: boolean
  showCopyright: boolean
  layoutStyle: string
  paddingTop: string
  paddingBottom: string
  marginTop: string
  borderTopWidth: string
  borderTopStyle: string
  borderTopColor: string
  borderRadius: string
  shadow: string
  opacity: string
  backdropBlur: string
  gradientEnabled: boolean
  gradientFromColor: string
  gradientToColor: string
  gradientDirection: string
  patternEnabled: boolean
  patternOpacity: string
  patternColor: string
  patternSize: string
  patternType: string
}

const footerTemplates: FooterTemplate[] = [
  // Modern & Clean
  {
    id: 'modern-clean',
    name: 'Moderno e Pulito',
    description: 'Footer minimalista con design pulito',
    category: 'modern',
    backgroundColor: '#1f2937',
    textColor: '#ffffff',
    titleColor: '#ffffff',
    subtitleColor: '#9ca3af',
    descriptionColor: '#9ca3af',
    linkColor: '#9ca3af',
    linkHoverColor: '#ffffff',
    borderColor: '#374151',
    socialIconColor: '#9ca3af',
    socialIconHoverColor: '#ffffff',
    titleFontFamily: 'default',
    subtitleFontFamily: 'default',
    descriptionFontFamily: 'default',
    titleFontSize: 'large',
    subtitleFontSize: 'medium',
    descriptionFontSize: 'small',
    titleBold: true,
    subtitleBold: false,
    descriptionBold: false,
    copyrightText: '© 2024 {salon_name}. Tutti i diritti riservati.',
    copyrightColor: '#9ca3af',
    copyrightFontSize: 'small',
    copyrightFontFamily: 'default',
    showSocialLinks: true,
    showContactInfo: true,
    showCopyright: true,
    layoutStyle: 'default',
    paddingTop: '48px',
    paddingBottom: '24px',
    marginTop: '0px',
    borderTopWidth: '0px',
    borderTopStyle: 'solid',
    borderTopColor: '#374151',
    borderRadius: '0px',
    shadow: 'none',
    opacity: '1',
    backdropBlur: 'none',
    gradientEnabled: false,
    gradientFromColor: '#1f2937',
    gradientToColor: '#111827',
    gradientDirection: 'to-br',
    patternEnabled: false,
    patternOpacity: '0.05',
    patternColor: '#ffffff',
    patternSize: '20px',
    patternType: 'dots'
  },
  {
    id: 'elegant-dark',
    name: 'Elegante Scuro',
    description: 'Footer elegante con sfondo scuro',
    category: 'elegant',
    backgroundColor: '#0f172a',
    textColor: '#ffffff',
    titleColor: '#ffffff',
    subtitleColor: '#cbd5e1',
    descriptionColor: '#94a3b8',
    linkColor: '#94a3b8',
    linkHoverColor: '#ffffff',
    borderColor: '#334155',
    socialIconColor: '#94a3b8',
    socialIconHoverColor: '#ffffff',
    titleFontFamily: 'serif',
    subtitleFontFamily: 'default',
    descriptionFontFamily: 'default',
    titleFontSize: 'xlarge',
    subtitleFontSize: 'medium',
    descriptionFontSize: 'small',
    titleBold: true,
    subtitleBold: false,
    descriptionBold: false,
    copyrightText: '© 2024 {salon_name}. Tutti i diritti riservati.',
    copyrightColor: '#64748b',
    copyrightFontSize: 'small',
    copyrightFontFamily: 'default',
    showSocialLinks: true,
    showContactInfo: true,
    showCopyright: true,
    layoutStyle: 'default',
    paddingTop: '64px',
    paddingBottom: '32px',
    marginTop: '0px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#334155',
    borderRadius: '0px',
    shadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
    opacity: '1',
    backdropBlur: 'none',
    gradientEnabled: false,
    gradientFromColor: '#0f172a',
    gradientToColor: '#020617',
    gradientDirection: 'to-br',
    patternEnabled: false,
    patternOpacity: '0.05',
    patternColor: '#ffffff',
    patternSize: '20px',
    patternType: 'dots'
  },
  {
    id: 'luxury-gold',
    name: 'Lusso Dorato',
    description: 'Footer lussuoso con accenti dorati',
    category: 'luxury',
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    titleColor: '#d4af37',
    subtitleColor: '#b8860b',
    descriptionColor: '#daa520',
    linkColor: '#daa520',
    linkHoverColor: '#d4af37',
    borderColor: '#d4af37',
    socialIconColor: '#daa520',
    socialIconHoverColor: '#d4af37',
    titleFontFamily: 'serif',
    subtitleFontFamily: 'default',
    descriptionFontFamily: 'default',
    titleFontSize: 'xlarge',
    subtitleFontSize: 'medium',
    descriptionFontSize: 'small',
    titleBold: true,
    subtitleBold: true,
    descriptionBold: false,
    copyrightText: '© 2024 {salon_name}. Tutti i diritti riservati.',
    copyrightColor: '#b8860b',
    copyrightFontSize: 'small',
    copyrightFontFamily: 'default',
    showSocialLinks: true,
    showContactInfo: true,
    showCopyright: true,
    layoutStyle: 'default',
    paddingTop: '64px',
    paddingBottom: '32px',
    marginTop: '0px',
    borderTopWidth: '2px',
    borderTopStyle: 'solid',
    borderTopColor: '#d4af37',
    borderRadius: '0px',
    shadow: '0 -4px 20px -1px rgba(212, 175, 55, 0.2)',
    opacity: '1',
    backdropBlur: 'none',
    gradientEnabled: true,
    gradientFromColor: '#1a1a1a',
    gradientToColor: '#000000',
    gradientDirection: 'to-br',
    patternEnabled: false,
    patternOpacity: '0.05',
    patternColor: '#d4af37',
    patternSize: '20px',
    patternType: 'dots'
  },
  {
    id: 'nature-green',
    name: 'Natura Verde',
    description: 'Footer ispirato alla natura con colori verdi',
    category: 'nature',
    backgroundColor: '#064e3b',
    textColor: '#ffffff',
    titleColor: '#ffffff',
    subtitleColor: '#a7f3d0',
    descriptionColor: '#6ee7b7',
    linkColor: '#6ee7b7',
    linkHoverColor: '#ffffff',
    borderColor: '#047857',
    socialIconColor: '#6ee7b7',
    socialIconHoverColor: '#ffffff',
    titleFontFamily: 'default',
    subtitleFontFamily: 'default',
    descriptionFontFamily: 'default',
    titleFontSize: 'large',
    subtitleFontSize: 'medium',
    descriptionFontSize: 'small',
    titleBold: true,
    subtitleBold: false,
    descriptionBold: false,
    copyrightText: '© 2024 {salon_name}. Tutti i diritti riservati.',
    copyrightColor: '#34d399',
    copyrightFontSize: 'small',
    copyrightFontFamily: 'default',
    showSocialLinks: true,
    showContactInfo: true,
    showCopyright: true,
    layoutStyle: 'default',
    paddingTop: '48px',
    paddingBottom: '24px',
    marginTop: '0px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#047857',
    borderRadius: '0px',
    shadow: 'none',
    opacity: '1',
    backdropBlur: 'none',
    gradientEnabled: true,
    gradientFromColor: '#064e3b',
    gradientToColor: '#022c22',
    gradientDirection: 'to-br',
    patternEnabled: true,
    patternOpacity: '0.1',
    patternColor: '#10b981',
    patternSize: '30px',
    patternType: 'leaves'
  },
  {
    id: 'romantic-pink',
    name: 'Romantico Rosa',
    description: 'Footer romantico con tonalità rosa',
    category: 'romantic',
    backgroundColor: '#831843',
    textColor: '#ffffff',
    titleColor: '#ffffff',
    subtitleColor: '#fce7f3',
    descriptionColor: '#fbcfe8',
    linkColor: '#fbcfe8',
    linkHoverColor: '#ffffff',
    borderColor: '#be185d',
    socialIconColor: '#fbcfe8',
    socialIconHoverColor: '#ffffff',
    titleFontFamily: 'default',
    subtitleFontFamily: 'default',
    descriptionFontFamily: 'default',
    titleFontSize: 'large',
    subtitleFontSize: 'medium',
    descriptionFontSize: 'small',
    titleBold: true,
    subtitleBold: false,
    descriptionBold: false,
    copyrightText: '© 2024 {salon_name}. Tutti i diritti riservati.',
    copyrightColor: '#f9a8d4',
    copyrightFontSize: 'small',
    copyrightFontFamily: 'default',
    showSocialLinks: true,
    showContactInfo: true,
    showCopyright: true,
    layoutStyle: 'default',
    paddingTop: '48px',
    paddingBottom: '24px',
    marginTop: '0px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#be185d',
    borderRadius: '0px',
    shadow: 'none',
    opacity: '1',
    backdropBlur: 'none',
    gradientEnabled: true,
    gradientFromColor: '#831843',
    gradientToColor: '#500724',
    gradientDirection: 'to-br',
    patternEnabled: true,
    patternOpacity: '0.1',
    patternColor: '#ec4899',
    patternSize: '25px',
    patternType: 'hearts'
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blu',
    description: 'Footer professionale e aziendale',
    category: 'corporate',
    backgroundColor: '#1e40af',
    textColor: '#ffffff',
    titleColor: '#ffffff',
    subtitleColor: '#bfdbfe',
    descriptionColor: '#93c5fd',
    linkColor: '#93c5fd',
    linkHoverColor: '#ffffff',
    borderColor: '#3b82f6',
    socialIconColor: '#93c5fd',
    socialIconHoverColor: '#ffffff',
    titleFontFamily: 'default',
    subtitleFontFamily: 'default',
    descriptionFontFamily: 'default',
    titleFontSize: 'large',
    subtitleFontSize: 'medium',
    descriptionFontSize: 'small',
    titleBold: true,
    subtitleBold: false,
    descriptionBold: false,
    copyrightText: '© 2024 {salon_name}. Tutti i diritti riservati.',
    copyrightColor: '#60a5fa',
    copyrightFontSize: 'small',
    copyrightFontFamily: 'default',
    showSocialLinks: true,
    showContactInfo: true,
    showCopyright: true,
    layoutStyle: 'default',
    paddingTop: '48px',
    paddingBottom: '24px',
    marginTop: '0px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#3b82f6',
    borderRadius: '0px',
    shadow: 'none',
    opacity: '1',
    backdropBlur: 'none',
    gradientEnabled: true,
    gradientFromColor: '#1e40af',
    gradientToColor: '#1e3a8a',
    gradientDirection: 'to-br',
    patternEnabled: false,
    patternOpacity: '0.05',
    patternColor: '#ffffff',
    patternSize: '20px',
    patternType: 'dots'
  },
  {
    id: 'minimalist-white',
    name: 'Minimalista Bianco',
    description: 'Footer minimalista con sfondo bianco',
    category: 'minimalist',
    backgroundColor: '#ffffff',
    textColor: '#374151',
    titleColor: '#111827',
    subtitleColor: '#6b7280',
    descriptionColor: '#9ca3af',
    linkColor: '#6b7280',
    linkHoverColor: '#111827',
    borderColor: '#e5e7eb',
    socialIconColor: '#6b7280',
    socialIconHoverColor: '#111827',
    titleFontFamily: 'default',
    subtitleFontFamily: 'default',
    descriptionFontFamily: 'default',
    titleFontSize: 'medium',
    subtitleFontSize: 'small',
    descriptionFontSize: 'small',
    titleBold: true,
    subtitleBold: false,
    descriptionBold: false,
    copyrightText: '© 2024 {salon_name}. Tutti i diritti riservati.',
    copyrightColor: '#9ca3af',
    copyrightFontSize: 'small',
    copyrightFontFamily: 'default',
    showSocialLinks: true,
    showContactInfo: true,
    showCopyright: true,
    layoutStyle: 'default',
    paddingTop: '32px',
    paddingBottom: '16px',
    marginTop: '0px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#e5e7eb',
    borderRadius: '0px',
    shadow: 'none',
    opacity: '1',
    backdropBlur: 'none',
    gradientEnabled: false,
    gradientFromColor: '#ffffff',
    gradientToColor: '#f9fafb',
    gradientDirection: 'to-br',
    patternEnabled: false,
    patternOpacity: '0.05',
    patternColor: '#374151',
    patternSize: '20px',
    patternType: 'dots'
  },
  {
    id: 'tech-futuristic',
    name: 'Futuristico Tech',
    description: 'Footer futuristico con effetti tecnologici',
    category: 'tech',
    backgroundColor: '#0a0a0a',
    textColor: '#ffffff',
    titleColor: '#00d4ff',
    subtitleColor: '#ffffff',
    descriptionColor: '#e0e0e0',
    linkColor: '#e0e0e0',
    linkHoverColor: '#00d4ff',
    borderColor: '#00d4ff',
    socialIconColor: '#e0e0e0',
    socialIconHoverColor: '#00d4ff',
    titleFontFamily: 'mono',
    subtitleFontFamily: 'default',
    descriptionFontFamily: 'default',
    titleFontSize: 'large',
    subtitleFontSize: 'medium',
    descriptionFontSize: 'small',
    titleBold: true,
    subtitleBold: false,
    descriptionBold: false,
    copyrightText: '© 2024 {salon_name}. Tutti i diritti riservati.',
    copyrightColor: '#888888',
    copyrightFontSize: 'small',
    copyrightFontFamily: 'mono',
    showSocialLinks: true,
    showContactInfo: true,
    showCopyright: true,
    layoutStyle: 'default',
    paddingTop: '48px',
    paddingBottom: '24px',
    marginTop: '0px',
    borderTopWidth: '2px',
    borderTopStyle: 'solid',
    borderTopColor: '#00d4ff',
    borderRadius: '0px',
    shadow: '0 -4px 20px -1px rgba(0, 212, 255, 0.3)',
    opacity: '1',
    backdropBlur: 'none',
    gradientEnabled: true,
    gradientFromColor: '#0a0a0a',
    gradientToColor: '#000000',
    gradientDirection: 'to-br',
    patternEnabled: true,
    patternOpacity: '0.1',
    patternColor: '#00d4ff',
    patternSize: '15px',
    patternType: 'grid'
  }
]

const fontOptions = [
  { value: 'default', label: 'Default (Sans-serif)' },
  { value: 'serif', label: 'Serif' },
  { value: 'mono', label: 'Monospace' },
  { value: 'inter', label: 'Inter' },
  { value: 'poppins', label: 'Poppins' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'open-sans', label: 'Open Sans' },
  { value: 'lato', label: 'Lato' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'raleway', label: 'Raleway' }
]

const sizeOptions = [
  { value: 'xs', label: 'Extra Small' },
  { value: 'sm', label: 'Small' },
  { value: 'base', label: 'Base' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra Large' },
  { value: '2xl', label: '2XL' },
  { value: '3xl', label: '3XL' },
  { value: '4xl', label: '4XL' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'XLarge' },
  { value: 'xxlarge', label: 'XXLarge' }
]

const gradientOptions = [
  { value: 'to-t', label: 'Verso l\'alto' },
  { value: 'to-tr', label: 'Verso l\'alto-destra' },
  { value: 'to-r', label: 'Verso destra' },
  { value: 'to-br', label: 'Verso il basso-destra' },
  { value: 'to-b', label: 'Verso il basso' },
  { value: 'to-bl', label: 'Verso il basso-sinistra' },
  { value: 'to-l', label: 'Verso sinistra' },
  { value: 'to-tl', label: 'Verso l\'alto-sinistra' }
]

const patternOptions = [
  { value: 'dots', label: 'Punti' },
  { value: 'lines', label: 'Linee' },
  { value: 'grid', label: 'Griglia' },
  { value: 'circles', label: 'Cerchi' },
  { value: 'squares', label: 'Quadrati' },
  { value: 'triangles', label: 'Triangoli' },
  { value: 'hearts', label: 'Cuori' },
  { value: 'stars', label: 'Stelle' },
  { value: 'leaves', label: 'Foglie' },
  { value: 'waves', label: 'Onde' }
]

interface FooterTemplatesProps {
  salonData: any
  onTemplateApply: (templateData: any) => void
  saving?: boolean
}

export default function FooterTemplates({ salonData, onTemplateApply, saving = false }: FooterTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<FooterTemplate>(footerTemplates[0])
  const [customCopyrightText, setCustomCopyrightText] = useState(selectedTemplate?.copyrightText || '© 2024 {salon_name}. Tutti i diritti riservati.')
  const [copied, setCopied] = useState<string | null>(null)

  const getFontSizeClass = (size: string): string => {
    switch (size) {
      case 'xs': return 'text-xs'
      case 'sm': return 'text-sm'
      case 'base': return 'text-base'
      case 'lg': return 'text-lg'
      case 'xl': return 'text-xl'
      case '2xl': return 'text-2xl'
      case '3xl': return 'text-3xl'
      case '4xl': return 'text-4xl'
      case 'small': return 'text-sm'
      case 'medium': return 'text-base'
      case 'large': return 'text-lg'
      case 'xlarge': return 'text-xl'
      case 'xxlarge': return 'text-2xl'
      default: return 'text-base'
    }
  }

  const getFontFamilyClass = (family: string): string => {
    switch (family) {
      case 'serif': return 'font-serif'
      case 'mono': return 'font-mono'
      case 'default': return 'font-sans'
      default: return 'font-sans'
    }
  }

  const getFontWeightClass = (bold: boolean): string => {
    return bold ? 'font-bold' : 'font-normal'
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const renderTemplate = (template: FooterTemplate) => {
    if (!template) {
      return <div>Template non disponibile</div>
    }
    
    const backgroundStyle = template.gradientEnabled
      ? `linear-gradient(${template.gradientDirection || 'to-br'}, ${template.gradientFromColor || '#1f2937'}, ${template.gradientToColor || '#111827'})`
      : template.backgroundColor

    return (
      <div 
        className="p-6 rounded-lg"
        style={{
          background: backgroundStyle,
          color: template.textColor,
          paddingTop: template.paddingTop,
          paddingBottom: template.paddingBottom,
          borderTopWidth: template.borderTopWidth,
          borderTopStyle: template.borderTopStyle as any,
          borderTopColor: template.borderTopColor,
          borderRadius: template.borderRadius,
          boxShadow: template.shadow !== 'none' ? template.shadow : undefined,
          opacity: template.opacity,
          backdropFilter: template.backdropBlur !== 'none' ? `blur(${template.backdropBlur})` : undefined,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {template.patternEnabled && (
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle, ${template.patternColor} 1px, transparent 1px)`,
              backgroundSize: template.patternSize
            }}
          />
        )}
        
        <div className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact Info */}
            {template.showContactInfo && (
              <div>
                <h3 
                  className={`${getFontSizeClass(template.titleFontSize)} ${getFontFamilyClass(template.titleFontFamily)} ${getFontWeightClass(template.titleBold)} mb-4`}
                  style={{ color: template.titleColor }}
                >
                  Contattaci
                </h3>
                <div className="space-y-2">
                  <p 
                    className={`${getFontSizeClass(template.descriptionFontSize)} ${getFontFamilyClass(template.descriptionFontFamily)} ${getFontWeightClass(template.descriptionBold)}`}
                    style={{ color: template.descriptionColor }}
                  >
                    <MapPin className="inline w-4 h-4 mr-2" />
                    Via Roma 123, Milano
                  </p>
                  <p 
                    className={`${getFontSizeClass(template.descriptionFontSize)} ${getFontFamilyClass(template.descriptionFontFamily)} ${getFontWeightClass(template.descriptionBold)}`}
                    style={{ color: template.descriptionColor }}
                  >
                    <Phone className="inline w-4 h-4 mr-2" />
                    +39 02 1234567
                  </p>
                  <p 
                    className={`${getFontSizeClass(template.descriptionFontSize)} ${getFontFamilyClass(template.descriptionFontFamily)} ${getFontWeightClass(template.descriptionBold)}`}
                    style={{ color: template.descriptionColor }}
                  >
                    <Mail className="inline w-4 h-4 mr-2" />
                    info@salone.com
                  </p>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div>
              <h3 
                className={`${getFontSizeClass(template.titleFontSize)} ${getFontFamilyClass(template.titleFontFamily)} ${getFontWeightClass(template.titleBold)} mb-4`}
                style={{ color: template.titleColor }}
              >
                Link Rapidi
              </h3>
              <div className="space-y-2">
                <a 
                  href="#" 
                  className={`${getFontSizeClass(template.descriptionFontSize)} ${getFontFamilyClass(template.descriptionFontFamily)} ${getFontWeightClass(template.descriptionBold)} block hover:underline`}
                  style={{ 
                    color: template.linkColor
                  }}
                >
                  Servizi
                </a>
                <a 
                  href="#" 
                  className={`${getFontSizeClass(template.descriptionFontSize)} ${getFontFamilyClass(template.descriptionFontFamily)} ${getFontWeightClass(template.descriptionBold)} block hover:underline`}
                  style={{ 
                    color: template.linkColor
                  }}
                >
                  Prenotazioni
                </a>
                <a 
                  href="#" 
                  className={`${getFontSizeClass(template.descriptionFontSize)} ${getFontFamilyClass(template.descriptionFontFamily)} ${getFontWeightClass(template.descriptionBold)} block hover:underline`}
                  style={{ 
                    color: template.linkColor
                  }}
                >
                  Contatti
                </a>
              </div>
            </div>

            {/* Social Links */}
            {template.showSocialLinks && (
              <div>
                <h3 
                  className={`${getFontSizeClass(template.titleFontSize)} ${getFontFamilyClass(template.titleFontFamily)} ${getFontWeightClass(template.titleBold)} mb-4`}
                  style={{ color: template.titleColor }}
                >
                  Seguici
                </h3>
                <div className="flex space-x-4">
                  <a href="#" style={{ color: template.socialIconColor }}>
                    <Facebook className="w-6 h-6 hover:scale-110 transition-transform" />
                  </a>
                  <a href="#" style={{ color: template.socialIconColor }}>
                    <Instagram className="w-6 h-6 hover:scale-110 transition-transform" />
                  </a>
                  <a href="#" style={{ color: template.socialIconColor }}>
                    <Twitter className="w-6 h-6 hover:scale-110 transition-transform" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Copyright */}
          {template.showCopyright && (
            <div className="mt-8 pt-4 border-t" style={{ borderColor: template.borderColor }}>
              <p 
                className={`${getFontSizeClass(template.copyrightFontSize)} ${getFontFamilyClass(template.copyrightFontFamily)} text-center`}
                style={{ color: template.copyrightColor }}
              >
                {customCopyrightText.replace('{salon_name}', 'Salone Bellezza Milano')}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Template Footer
          </CardTitle>
          <CardDescription>
            Scegli tra diversi template predefiniti per il footer con stili, colori e layout diversi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-4">
            <Label>Seleziona Template</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {footerTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate.id === template.id 
                      ? 'ring-2 ring-violet-500 bg-violet-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedTemplate(template)
                    setCustomCopyrightText(template.copyrightText)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">{template.name}</h3>
                      <p className="text-xs text-gray-600">{template.description}</p>
                      <div className="text-xs text-gray-500 capitalize">{template.category}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Customization */}
          <div className="space-y-4">
            <Label>Personalizzazione</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="custom-copyright">Testo Copyright Personalizzato</Label>
                <Input
                  id="custom-copyright"
                  value={customCopyrightText}
                  onChange={(e) => setCustomCopyrightText(e.target.value)}
                  placeholder="© 2024 {salon_name}. Tutti i diritti riservati."
                />
                <p className="text-xs text-gray-500">
                  Usa {'{salon_name}'} come placeholder per il nome del salone
                </p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Anteprima</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(selectedTemplate), 'template')}
                >
                  {copied === 'template' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copia Template
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    if (selectedTemplate && onTemplateApply) {
                      const templateData = {
                        ...selectedTemplate,
                        copyrightText: customCopyrightText
                      }
                      onTemplateApply(templateData)
                    }
                  }}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Applicazione...
                    </>
                  ) : (
                    'Applica Template'
                  )}
                </Button>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {renderTemplate(selectedTemplate)}
            </div>
          </div>

          {/* Template Categories */}
          <div className="space-y-4">
            <Label>Categorie Template</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {Array.from(new Set(footerTemplates.map(t => t.category))).map((category) => {
                const getCategoryIcon = (cat: string) => {
                  switch (cat) {
                    case 'modern': return <Sparkles className="w-3 h-3 mr-1" />
                    case 'elegant': return <Crown className="w-3 h-3 mr-1" />
                    case 'luxury': return <Star className="w-3 h-3 mr-1" />
                    case 'nature': return <Leaf className="w-3 h-3 mr-1" />
                    case 'romantic': return <Heart className="w-3 h-3 mr-1" />
                    case 'corporate': return <Award className="w-3 h-3 mr-1" />
                    case 'minimalist': return <Type className="w-3 h-3 mr-1" />
                    case 'tech': return <Zap className="w-3 h-3 mr-1" />
                    default: return null
                  }
                }

                return (
                  <Button
                    key={category}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const categoryTemplate = footerTemplates.find(t => t.category === category)
                      if (categoryTemplate) {
                        setSelectedTemplate(categoryTemplate)
                        setCustomCopyrightText(categoryTemplate.copyrightText)
                      }
                    }}
                  >
                    {getCategoryIcon(category)}
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
