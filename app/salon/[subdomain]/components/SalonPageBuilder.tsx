'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Database } from '@/types/database.types'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Scissors, 
  Users, 
  Award, 
  CheckCircle, 
  Sparkles, 
  Heart, 
  Gift, 
  Instagram, 
  Facebook, 
  MessageCircle,
  Globe,
  Settings,
  Palette,
  Type,
  Image as ImageIcon,
  Layout,
  Upload,
  X,
  Search,
  ExternalLink
} from 'lucide-react'
import OpeningHoursManager from './OpeningHoursManager'
import TitleTemplates from './TitleTemplates'
import FooterTemplates from './FooterTemplates'

const supabase = createClient()

// Helper function to convert font size options to pixel values
const getFontSizeValue = (size: string): string => {
  const sizeMap: { [key: string]: string } = {
    'small': '16px',
    'medium': '20px',
    'large': '24px',
    'xl': '32px',
    '2xl': '40px',
    '3xl': '48px'
  }
  return sizeMap[size] || '24px'
}

// Helper function to convert subtitle font size options to pixel values
const getSubtitleFontSizeValue = (size: string): string => {
  const sizeMap: { [key: string]: string } = {
    'small': '14px',
    'medium': '16px',
    'large': '18px',
    'xl': '20px',
    '2xl': '24px'
  }
  return sizeMap[size] || '16px'
}

// Helper function to convert description font size options to pixel values
const getDescriptionFontSizeValue = (size: string): string => {
  const sizeMap: { [key: string]: string } = {
    'small': '14px',
    'medium': '16px',
    'large': '18px',
    'xl': '20px',
    '2xl': '24px'
  }
  return sizeMap[size] || '16px'
}

// Helper function to convert studio text font size options to pixel values
const getStudioTextFontSizeValue = (size: string): string => {
  const sizeMap: { [key: string]: string } = {
    'small': '12px',
    'medium': '14px',
    'large': '16px'
  }
  return sizeMap[size] || '12px'
}

// Helper function to convert font family options to CSS values
const getFontFamilyValue = (family: string): string => {
  const familyMap: { [key: string]: string } = {
    'default': 'sans-serif',
    'serif': 'serif',
    'sans-serif': 'sans-serif',
    'monospace': 'monospace',
    'cursive': 'cursive',
    'fantasy': 'fantasy'
  }
  return familyMap[family] || 'sans-serif'
}

// Helper function to convert button size options to padding values
const getButtonPadding = (size: string): string => {
  const sizeMap: { [key: string]: string } = {
    'small': '8px 16px',
    'medium': '12px 24px',
    'large': '16px 32px',
    'xl': '20px 40px'
  }
  return sizeMap[size] || '12px 24px'
}

// Helper function to convert button size options to font size values
const getButtonFontSize = (size: string): string => {
  const sizeMap: { [key: string]: string } = {
    'small': '14px',
    'medium': '16px',
    'large': '18px',
    'xl': '20px'
  }
  return sizeMap[size] || '16px'
}

// Helper function to convert button border radius options to CSS values
const getButtonBorderRadius = (radius: string): string => {
  const radiusMap: { [key: string]: string } = {
    'none': '0px',
    'small': '4px',
    'medium': '8px',
    'large': '12px',
    'full': '9999px'
  }
  return radiusMap[radius] || '8px'
}

// Helper function to get font weight class
const getFontWeightClass = (isBold: boolean | null): string => {
  return isBold ? 'font-bold' : 'font-normal'
}

// Helper function to determine text color based on background color
const getContrastTextColor = (backgroundColor: string): string => {
  try {
    // Ensure we have a valid hex color
    let hex = backgroundColor.replace('#', '')
    
    // Handle 3-digit hex colors
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('')
    }
    
    // Validate hex color
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return '#ffffff' // Default to white if invalid
    }
    
    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Calculate relative luminance using WCAG formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    
    // Return black for light backgrounds, white for dark backgrounds
    // Using a threshold of 0.6 for better contrast
    return luminance > 0.6 ? '#000000' : '#ffffff'
  } catch (error) {
    console.error('Error calculating contrast color:', error)
    return '#ffffff' // Default to white on error
  }
}

type SalonWebSettings = Database['public']['Tables']['salon_web_settings']['Row']

interface Service {
  id: number
  name: string
  description: string
  price: string
  originalPrice: string
  duration: string
  icon: any
  popular: boolean
}

interface TeamMember {
  id: number
  name: string
  role: string
  experience: string
  avatar: string
  specialties: string[]
}

interface Testimonial {
  id: number
  name: string
  text: string
  rating: number
  service: string
  date: string
}

interface SalonPageBuilderProps {
  subdomain?: string;
  salonData?: SalonWebSettings; // Add optional salonData prop
}

export default function SalonPageBuilder({ subdomain = '', salonData: initialSalonData }: SalonPageBuilderProps) {
  const [salonData, setSalonData] = useState<SalonWebSettings | null>(initialSalonData || null);
  const [loading, setLoading] = useState(!initialSalonData);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content')
  const [activeSubSection, setActiveSubSection] = useState('general')
  const [titleStyleTab, setTitleStyleTab] = useState('manual')
  const [footerStyleTab, setFooterStyleTab] = useState('manual')

  // Definizione delle sezioni e sottosezioni
  const sections = {
    activation: {
      label: 'Attivazione Pagina',
      icon: Globe,
      subSections: [
        {
          id: 'page-activation',
          label: 'Attiva Pagina',
          icon: Settings
        }
      ]
    },
    content: {
      label: 'Contenuto',
      icon: Type,
      subSections: [
        {
          id: 'general',
          label: 'Informazioni Generali',
          icon: Settings
        },
        {
          id: 'contacts',
          label: 'Contatti',
          icon: Phone
        },
        {
          id: 'social',
          label: 'Social Media',
          icon: Instagram
        },
        {
          id: 'title-style',
          label: 'Stile Titolo',
          icon: Type
        }
      ]
    },
    design: {
      label: 'Design',
      icon: Palette,
      subSections: [
        { id: 'colors', label: 'Colori', icon: Palette },
        { id: 'typography', label: 'Tipografia', icon: Type }
      ]
    },
    layout: {
      label: 'Layout',
      icon: Layout,
      subSections: [
        { id: 'sections', label: 'Sezioni Visibili', icon: Layout },
        { id: 'parallax', label: 'Effetto Parallax', icon: Sparkles }
      ]
    },
    media: {
      label: 'Media',
      icon: ImageIcon,
      subSections: [
        { id: 'logo', label: 'Logo', icon: ImageIcon },
        { id: 'profile-photo', label: 'Foto Profilo', icon: Upload },
        { id: 'carousel', label: 'Carousel', icon: ImageIcon },
        { id: 'gallery', label: 'Galleria', icon: ImageIcon }
      ]
    },
    advanced: {
      label: 'Avanzato',
      icon: Settings,
      subSections: [
        { id: 'seo', label: 'SEO', icon: Settings },
        { id: 'custom-css', label: 'CSS Personalizzato', icon: Settings },
        { id: 'custom-js', label: 'JavaScript', icon: Settings }
      ]
    }
  }

  useEffect(() => {
    // Only fetch data if we don't have initial salonData
    if (!initialSalonData) {
      fetchSalonData()
    }
  }, [subdomain, initialSalonData])

  const fetchSalonData = async () => {
    try {
      setLoading(true)
      
      // Only fetch by subdomain if we have a valid subdomain and no initial data
      if (subdomain && subdomain.trim() !== '') {
        const { data: webSettings, error } = await supabase
          .from('salon_web_settings')
          .select('*')
          .eq('web_subdomain', subdomain)
          .eq('web_enabled', true)
          .single()

        if (error) {
          console.error('Error fetching salon data:', error)
          return
        }

        setSalonData(webSettings)
      } else {
        console.log('No subdomain provided, using initial salon data')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!salonData) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('salon_web_settings')
        .update(salonData)
        .eq('salon_id', salonData.salon_id)

      if (error) throw error

      // Show success message
      console.log('Settings saved successfully')
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setSaving(false)
    }
  }

  const onTemplateApply = async (templateData: any) => {
    if (!salonData) return
    
    setSaving(true)
    try {
      // Update salon data with template values
      const updatedData = { ...salonData, ...templateData }
      
      const { error } = await supabase
        .from('salon_web_settings')
        .update(updatedData)
        .eq('salon_id', salonData.salon_id)

      if (error) throw error

      // Update local state
      setSalonData(updatedData)
      
      // Show success message
      console.log('Template applied successfully')
    } catch (error) {
      console.error('Error applying template:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (!salonData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pagina non trovata</h3>
            <p className="text-gray-600">
              La pagina web per questo salone non esiste o non è abilitata.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Funzione per gestire il cambio di sezione
  const handleSectionChange = (sectionId: string) => {
    setActiveTab(sectionId)
    // Reset alla prima sottosezione quando si cambia sezione
    const firstSubSection = sections[sectionId as keyof typeof sections]?.subSections[0]?.id
    if (firstSubSection) {
      setActiveSubSection(firstSubSection)
    }
  }

  // Funzione per gestire il cambio di sottosezione
  const handleSubSectionChange = (subSectionId: string) => {
    setActiveSubSection(subSectionId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Builder Pagina Web
                </h1>
                <p className="text-sm text-gray-600">
                  {salonData.web_title || 'Salone'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Save button moved to sidebar */}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Personalizzazione</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-4">
                  {/* Sezioni principali */}
                  <div className="space-y-2">
                    {Object.entries(sections).map(([sectionId, section]) => (
                      <div key={sectionId} className="space-y-1">
                        <button
                          onClick={() => handleSectionChange(sectionId)}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                            activeTab === sectionId
                              ? 'bg-violet-100 text-violet-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <section.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{section.label}</span>
                        </button>
                        
                        {/* Sottosezioni */}
                        {activeTab === sectionId && (
                          <div className="ml-6 space-y-1">
                            {section.subSections.map((subSection) => (
                              <button
                                key={subSection.id}
                                onClick={() => handleSubSectionChange(subSection.id)}
                                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-left transition-colors text-xs ${
                                  activeSubSection === subSection.id
                                    ? 'bg-violet-50 text-violet-600'
                                    : 'text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                <subSection.icon className="w-3 h-3" />
                                <span>{subSection.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </nav>
                
                {/* Save button in sidebar */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-violet-600 hover:bg-violet-700"
                  >
                    {saving ? 'Salvando...' : 'Salva'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header della sezione */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                {(() => {
                  const section = sections[activeTab as keyof typeof sections]
                  const subSection = section?.subSections.find(s => s.id === activeSubSection)
                  const IconComponent = subSection?.icon || section?.icon || Settings
                  return (
                    <>
                      <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {subSection?.label || section?.label || 'Sezione'}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {section?.label} • {subSection?.label}
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Contenuto dinamico basato sulla sottosezione */}
            {(() => {
              const section = sections[activeTab as keyof typeof sections]
              const subSection = section?.subSections.find(s => s.id === activeSubSection)
              
              if (!section || !subSection) {
                return (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Sezione non trovata</h3>
                      <p className="text-gray-600">
                        La sezione richiesta non esiste.
                      </p>
                    </CardContent>
                  </Card>
                )
              }

                            // Renderizza il contenuto basato sulla sezione e sottosezione
              if (activeTab === 'activation') {
                return (
                  <PageActivationTab
                    salonData={salonData}
                    setSalonData={setSalonData}
                    saving={saving}
                    onSave={handleSave}
                  />
                )
              } else if (activeTab === 'content') {
                return (
                  <ContentSubSection
                    subSectionId={activeSubSection}
                    salonData={salonData}
                    setSalonData={setSalonData}
                    titleStyleTab={titleStyleTab}
                    setTitleStyleTab={setTitleStyleTab}
                    footerStyleTab={footerStyleTab}
                    setFooterStyleTab={setFooterStyleTab}
                    saving={saving}
                    onTemplateApply={async (templateData: any) => {
                       // Check if this is a footer template or title template
                       const isFooterTemplate = templateData.backgroundColor !== undefined
                       
                       let updatedSalonData
                       
                       if (isFooterTemplate) {
                         // Footer template
                         updatedSalonData = {
                           ...salonData,
                           web_footer_background_color: templateData.backgroundColor,
                           web_footer_text_color: templateData.textColor,
                           web_footer_title_color: templateData.titleColor,
                           web_footer_subtitle_color: templateData.subtitleColor,
                           web_footer_description_color: templateData.descriptionColor,
                           web_footer_link_color: templateData.linkColor,
                           web_footer_link_hover_color: templateData.linkHoverColor,
                           web_footer_border_color: templateData.borderColor,
                           web_footer_social_icon_color: templateData.socialIconColor,
                           web_footer_social_icon_hover_color: templateData.socialIconHoverColor,
                           web_footer_title_font_family: templateData.titleFontFamily,
                           web_footer_subtitle_font_family: templateData.subtitleFontFamily,
                           web_footer_description_font_family: templateData.descriptionFontFamily,
                           web_footer_title_font_size: templateData.titleFontSize,
                           web_footer_subtitle_font_size: templateData.subtitleFontSize,
                           web_footer_description_font_size: templateData.descriptionFontSize,
                           web_footer_title_bold: templateData.titleBold,
                           web_footer_subtitle_bold: templateData.subtitleBold,
                           web_footer_description_bold: templateData.descriptionBold,
                           web_footer_copyright_text: templateData.copyrightText,
                           web_footer_copyright_color: templateData.copyrightColor,
                           web_footer_copyright_font_size: templateData.copyrightFontSize,
                           web_footer_copyright_font_family: templateData.copyrightFontFamily,
                           web_footer_show_social_links: templateData.showSocialLinks,
                           web_footer_show_contact_info: templateData.showContactInfo,
                           web_footer_show_copyright: templateData.showCopyright,
                           web_footer_layout_style: templateData.layoutStyle,
                           web_footer_padding_top: templateData.paddingTop,
                           web_footer_padding_bottom: templateData.paddingBottom,
                           web_footer_margin_top: templateData.marginTop,
                           web_footer_border_top_width: templateData.borderTopWidth,
                           web_footer_border_top_style: templateData.borderTopStyle,
                           web_footer_border_top_color: templateData.borderTopColor,
                           web_footer_border_radius: templateData.borderRadius,
                           web_footer_shadow: templateData.shadow,
                           web_footer_opacity: templateData.opacity,
                           web_footer_backdrop_blur: templateData.backdropBlur,
                           web_footer_gradient_enabled: templateData.gradientEnabled,
                           web_footer_gradient_from_color: templateData.gradientFromColor,
                           web_footer_gradient_to_color: templateData.gradientToColor,
                           web_footer_gradient_direction: templateData.gradientDirection,
                                                      web_footer_pattern_enabled: templateData.patternEnabled,
                           web_footer_pattern_opacity: templateData.patternOpacity,
                           web_footer_pattern_color: templateData.patternColor,
                           web_footer_pattern_size: templateData.patternSize,
                           web_footer_pattern_type: templateData.patternType
                         }
                       } else {
                         // Title template
                         updatedSalonData = {
                           ...salonData,
                           web_title_color: templateData.titleColor,
                           web_subtitle_color: templateData.subtitleColor,
                           web_title_font_family: templateData.titleFont,
                           web_subtitle_font_family: templateData.subtitleFont,
                           web_salon_name_font_size: templateData.titleSize,
                           web_subtitle_font_size: templateData.subtitleSize,
                           web_title_bold: templateData.effects?.shadow || templateData.effects?.glow || false,
                           web_subtitle_bold: false,
                           web_description_color: templateData.subtitleColor,
                           web_description_font_family: templateData.subtitleFont,
                           web_description_font_size: templateData.subtitleSize,
                           web_description_bold: false,
                           web_studio_text_font_size: 'small',
                           web_studio_text_bold: false
                         }
                       }
                       
                       // Update local state
                       setSalonData(updatedSalonData)
                       
                       // Save to database
                       setSaving(true)
                       try {
                         const { error } = await supabase
                           .from('salon_web_settings')
                           .update(updatedSalonData)
                           .eq('salon_id', salonData.salon_id)

                         if (error) throw error

                         console.log('Template applied and saved successfully')
                         
                         // Emit custom event to notify other components
                         window.dispatchEvent(new CustomEvent('salonTemplateApplied', {
                           detail: { salonId: salonData.salon_id }
                         }))
                         
                         // Show success message to user
                         const toast = document.createElement('div')
                         toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full'
                         toast.innerHTML = `
                           <div class="flex items-center space-x-2">
                             <div class="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                               <svg class="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                 <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                               </svg>
                             </div>
                             <span>Template applicato con successo! La pagina web è stata aggiornata.</span>
                           </div>
                         `
                         document.body.appendChild(toast)
                         
                         setTimeout(() => {
                           toast.classList.remove('translate-x-full')
                         }, 100)
                         
                         setTimeout(() => {
                           toast.classList.add('translate-x-full')
                           setTimeout(() => {
                             document.body.removeChild(toast)
                           }, 300)
                         }, 5000)
                       } catch (error) {
                         console.error('Error saving template:', error)
                         
                         const errorToast = document.createElement('div')
                         errorToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full'
                         errorToast.innerHTML = `
                           <div class="flex items-center space-x-2">
                             <div class="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                               <svg class="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                 <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                               </svg>
                             </div>
                             <span>Errore durante il salvataggio del template. Riprova.</span>
                           </div>
                         `
                         document.body.appendChild(errorToast)
                         
                         setTimeout(() => {
                           errorToast.classList.remove('translate-x-full')
                         }, 100)
                         
                         setTimeout(() => {
                           errorToast.classList.add('translate-x-full')
                           setTimeout(() => {
                             document.body.removeChild(errorToast)
                           }, 300)
                         }, 5000)
                       } finally {
                         setSaving(false)
                       }
                       
                       setTitleStyleTab('manual')
                     }}
                   />
                 )
               }

               // Altre sezioni
               if (activeTab === 'design') {
                 return (
                   <DesignSubSection
                     subSectionId={activeSubSection}
                     salonData={salonData}
                     setSalonData={setSalonData}
                   />
                 )
               }

               if (activeTab === 'layout') {
                 return (
                   <LayoutSubSection
                     subSectionId={activeSubSection}
                     salonData={salonData}
                     setSalonData={setSalonData}
                   />
                 )
               }

               if (activeTab === 'media') {
                 return (
                   <MediaSubSection
                     subSectionId={activeSubSection}
                     salonData={salonData}
                     setSalonData={setSalonData}
                   />
                 )
               }

               if (activeTab === 'advanced') {
                 return (
                   <AdvancedSubSection
                     subSectionId={activeSubSection}
                     salonData={salonData}
                     setSalonData={setSalonData}
                   />
                 )
               }

               return (
                 <Card>
                   <CardContent className="p-8 text-center">
                     <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                     <h3 className="text-lg font-medium text-gray-900 mb-2">Sezione non implementata</h3>
                     <p className="text-gray-600">
                       Questa sezione non è ancora stata implementata.
                     </p>
                   </CardContent>
                 </Card>
               )
             })()}
          </div>
        </div>
      </div>
    </div>
  )
}

// Content SubSection Component
function ContentSubSection({ 
  subSectionId,
  salonData, 
  setSalonData,
  titleStyleTab,
  setTitleStyleTab,
  footerStyleTab,
  setFooterStyleTab,
  saving,
  onTemplateApply
}: { 
  subSectionId: string
  salonData: SalonWebSettings
  setSalonData: React.Dispatch<React.SetStateAction<SalonWebSettings | null>>
  titleStyleTab: string
  setTitleStyleTab: React.Dispatch<React.SetStateAction<string>>
  footerStyleTab: string
  setFooterStyleTab: React.Dispatch<React.SetStateAction<string>>
  saving: boolean
  onTemplateApply: (templateData: any) => Promise<void>
}) {
  // Renderizza il contenuto basato sulla sottosezione
  switch (subSectionId) {
    case 'general':
      return (
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Principali</CardTitle>
            <CardDescription>
              Configura le informazioni principali del tuo salone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="web_title">Nome del Salone *</Label>
              <Input
                id="web_title"
                value={salonData.web_title || ''}
                onChange={(e) => setSalonData({ ...salonData, web_title: e.target.value })}
                placeholder="Es: Salone Bellezza Milano"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="web_subtitle">Sottotitolo</Label>
              <Input
                id="web_subtitle"
                value={salonData.web_subtitle || ''}
                onChange={(e) => setSalonData({ ...salonData, web_subtitle: e.target.value })}
                placeholder="Es: Professional Hair & Beauty Studio"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="web_description">Descrizione</Label>
              <Textarea
                id="web_description"
                value={salonData.web_description || ''}
                onChange={(e) => setSalonData({ ...salonData, web_description: e.target.value })}
                placeholder="Descrizione del tuo salone..."
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="web_studio_text">Testo Studio</Label>
              <Input
                id="web_studio_text"
                value={salonData.web_studio_text || ''}
                onChange={(e) => setSalonData({ ...salonData, web_studio_text: e.target.value })}
                placeholder="Es: STUDIO, SALONE, ecc."
              />
              <p className="text-xs text-gray-500">
                Testo aggiuntivo che apparirà sotto il nome del salone (es. "STUDIO", "SALONE")
              </p>
            </div>
          </CardContent>
        </Card>
      )

    case 'contacts':
      return (
        <Card>
          <CardHeader>
            <CardTitle>Contatti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="web_contact_phone">Telefono</Label>
              <Input
                id="web_contact_phone"
                value={salonData.web_contact_phone || ''}
                onChange={(e) => setSalonData({ ...salonData, web_contact_phone: e.target.value })}
                placeholder="+39 02 1234 5678"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="web_contact_email">Email</Label>
              <Input
                id="web_contact_email"
                type="email"
                value={salonData.web_contact_email || ''}
                onChange={(e) => setSalonData({ ...salonData, web_contact_email: e.target.value })}
                placeholder="info@salone.it"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="web_address">Indirizzo</Label>
              <Textarea
                id="web_address"
                value={salonData.web_address || ''}
                onChange={(e) => setSalonData({ ...salonData, web_address: e.target.value })}
                placeholder="Via Roma 123, 20121 Milano"
                rows={2}
              />
              <p className="text-sm text-gray-600">
                Inserisci l'indirizzo completo (via, numero civico, città, CAP) per un posizionamento preciso sulla mappa
              </p>
            </div>
          </CardContent>
        </Card>
      )

    case 'social':
      return (
        <Card>
          <CardHeader>
            <CardTitle>Social Media</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="web_social_facebook">Facebook</Label>
              <Input
                id="web_social_facebook"
                value={salonData.web_social_facebook || ''}
                onChange={(e) => setSalonData({ ...salonData, web_social_facebook: e.target.value })}
                placeholder="https://facebook.com/salonepage"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="web_social_instagram">Instagram</Label>
              <Input
                id="web_social_instagram"
                value={salonData.web_social_instagram || ''}
                onChange={(e) => setSalonData({ ...salonData, web_social_instagram: e.target.value })}
                placeholder="@salone_instagram"
              />
            </div>
          </CardContent>
        </Card>
      )

    case 'title-style':
      return (
        <Card>
          <CardHeader>
            <CardTitle>Stile Titolo e Sottotitolo</CardTitle>
            <CardDescription>
              Personalizza l'aspetto del titolo e sottotitolo del salone
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setTitleStyleTab('manual')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  titleStyleTab === 'manual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Personalizzazione Manuale
              </button>
              <button
                onClick={() => setTitleStyleTab('templates')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  titleStyleTab === 'templates'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Template Predefiniti
              </button>
            </div>

            {titleStyleTab === 'manual' && (
              <div className="space-y-6">
                {/* Titolo */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Titolo del Salone</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="web_title_color">Colore Titolo</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="web_title_color"
                          type="color"
                          value={salonData.web_title_color || '#1f2937'}
                          onChange={(e) => setSalonData({ ...salonData, web_title_color: e.target.value })}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={salonData.web_title_color || '#1f2937'}
                          onChange={(e) => setSalonData({ ...salonData, web_title_color: e.target.value })}
                          placeholder="#1f2937"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="web_salon_name_font_size">Dimensione Font</Label>
                      <select
                        id="web_salon_name_font_size"
                        value={salonData.web_salon_name_font_size || 'large'}
                        onChange={(e) => setSalonData({ ...salonData, web_salon_name_font_size: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                        <option value="small">Piccolo (16px)</option>
                        <option value="medium">Medio (20px)</option>
                        <option value="large">Grande (24px)</option>
                        <option value="xl">Extra Large (32px)</option>
                        <option value="2xl">2XL (40px)</option>
                        <option value="3xl">3XL (48px)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="web_title_font_family">Font Titolo</Label>
                    <select
                      id="web_title_font_family"
                      value={salonData.web_title_font_family || 'default'}
                      onChange={(e) => setSalonData({ ...salonData, web_title_font_family: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="default">Default (Sans-serif)</option>
                      <option value="serif">Serif</option>
                      <option value="sans-serif">Sans Serif</option>
                      <option value="monospace">Monospace</option>
                      <option value="cursive">Cursive</option>
                      <option value="fantasy">Fantasy</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="web_title_bold"
                        checked={salonData.web_title_bold || false}
                        onChange={(e) => setSalonData({ ...salonData, web_title_bold: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="web_title_bold">Titolo in Grassetto</Label>
                    </div>
                    <p className="text-xs text-gray-500">
                      Rendi il titolo del salone in grassetto
                    </p>
                  </div>
                </div>

                {/* Sottotitolo */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Sottotitolo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="web_subtitle_color">Colore Sottotitolo</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="web_subtitle_color"
                          type="color"
                          value={salonData.web_subtitle_color || '#6b7280'}
                          onChange={(e) => setSalonData({ ...salonData, web_subtitle_color: e.target.value })}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={salonData.web_subtitle_color || '#6b7280'}
                          onChange={(e) => setSalonData({ ...salonData, web_subtitle_color: e.target.value })}
                          placeholder="#6b7280"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="web_subtitle_font_size">Dimensione Font</Label>
                      <select
                        id="web_subtitle_font_size"
                        value={salonData.web_subtitle_font_size || 'medium'}
                        onChange={(e) => setSalonData({ ...salonData, web_subtitle_font_size: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                        <option value="small">Piccolo (14px)</option>
                        <option value="medium">Medio (16px)</option>
                        <option value="large">Grande (18px)</option>
                        <option value="xl">Extra Large (20px)</option>
                        <option value="2xl">2XL (24px)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="web_subtitle_font_family">Font Sottotitolo</Label>
                    <select
                      id="web_subtitle_font_family"
                      value={salonData.web_subtitle_font_family || 'default'}
                      onChange={(e) => setSalonData({ ...salonData, web_subtitle_font_family: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="default">Default (Sans-serif)</option>
                      <option value="serif">Serif</option>
                      <option value="sans-serif">Sans Serif</option>
                      <option value="monospace">Monospace</option>
                      <option value="cursive">Cursive</option>
                      <option value="fantasy">Fantasy</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="web_subtitle_bold"
                        checked={salonData.web_subtitle_bold || false}
                        onChange={(e) => setSalonData({ ...salonData, web_subtitle_bold: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="web_subtitle_bold">Sottotitolo in Grassetto</Label>
                    </div>
                    <p className="text-xs text-gray-500">
                      Rendi il sottotitolo del salone in grassetto
                    </p>
                  </div>
                 </div>

                 {/* Descrizione */}
                 <div className="space-y-4">
                   <h4 className="font-medium text-gray-900">Descrizione</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="web_description_color">Colore Descrizione</Label>
                       <div className="flex items-center space-x-2">
                         <Input
                           id="web_description_color"
                           type="color"
                           value={salonData.web_description_color || '#374151'}
                           onChange={(e) => setSalonData({ ...salonData, web_description_color: e.target.value })}
                           className="w-16 h-10 p-1"
                         />
                         <Input
                           value={salonData.web_description_color || '#374151'}
                           onChange={(e) => setSalonData({ ...salonData, web_description_color: e.target.value })}
                           placeholder="#374151"
                         />
                       </div>
                     </div>
                     
                     <div className="space-y-2">
                       <Label htmlFor="web_description_font_size">Dimensione Font</Label>
                       <select
                         id="web_description_font_size"
                         value={salonData.web_description_font_size || 'medium'}
                         onChange={(e) => setSalonData({ ...salonData, web_description_font_size: e.target.value })}
                         className="w-full p-2 border border-gray-300 rounded-lg"
                       >
                         <option value="small">Piccolo (14px)</option>
                         <option value="medium">Medio (16px)</option>
                         <option value="large">Grande (18px)</option>
                         <option value="xl">Extra Large (20px)</option>
                         <option value="2xl">2XL (24px)</option>
                       </select>
                     </div>
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="web_description_font_family">Font Descrizione</Label>
                     <select
                       id="web_description_font_family"
                       value={salonData.web_description_font_family || 'default'}
                       onChange={(e) => setSalonData({ ...salonData, web_description_font_family: e.target.value })}
                       className="w-full p-2 border border-gray-300 rounded-lg"
                     >
                       <option value="default">Default (Sans-serif)</option>
                       <option value="serif">Serif</option>
                       <option value="sans-serif">Sans Serif</option>
                       <option value="monospace">Monospace</option>
                       <option value="cursive">Cursive</option>
                       <option value="fantasy">Fantasy</option>
                     </select>
                   </div>
                   
                   <div className="space-y-2">
                     <div className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         id="web_description_bold"
                         checked={salonData.web_description_bold || false}
                         onChange={(e) => setSalonData({ ...salonData, web_description_bold: e.target.checked })}
                         className="rounded border-gray-300"
                       />
                       <Label htmlFor="web_description_bold">Descrizione in Grassetto</Label>
                     </div>
                     <p className="text-xs text-gray-500">
                       Rendi la descrizione del salone in grassetto
                     </p>
                   </div>
                 </div>

                 {/* Testo Studio */}
                 <div className="space-y-4">
                   <h4 className="font-medium text-gray-900">Testo Studio</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="web_studio_text_font_size">Dimensione Font</Label>
                       <select
                         id="web_studio_text_font_size"
                         value={salonData.web_studio_text_font_size || 'small'}
                         onChange={(e) => setSalonData({ ...salonData, web_studio_text_font_size: e.target.value })}
                         className="w-full p-2 border border-gray-300 rounded-lg"
                       >
                         <option value="small">Piccolo (12px)</option>
                         <option value="medium">Medio (14px)</option>
                         <option value="large">Grande (16px)</option>
                       </select>
                     </div>
                   </div>
                   
                   <div className="space-y-2">
                     <div className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         id="web_studio_text_bold"
                         checked={salonData.web_studio_text_bold || false}
                         onChange={(e) => setSalonData({ ...salonData, web_studio_text_bold: e.target.checked })}
                         className="rounded border-gray-300"
                       />
                       <Label htmlFor="web_studio_text_bold">Testo Studio in Grassetto</Label>
                     </div>
                     <p className="text-xs text-gray-500">
                       Rendi il testo studio in grassetto
                     </p>
                   </div>
                 </div>

                 {/* Anteprima */}
                 <div className="space-y-2">
                   <Label>Anteprima</Label>
                   <div className="p-4 border border-gray-200 rounded-lg bg-white">
                     <h1 
                       style={{
                         color: salonData.web_title_color || '#1f2937',
                         fontSize: getFontSizeValue(salonData.web_salon_name_font_size || 'large'),
                         fontFamily: getFontFamilyValue(salonData.web_title_font_family || 'default')
                       }}
                       className={`${getFontWeightClass(salonData.web_title_bold)} mb-2`}
                     >
                       {salonData.web_title || 'Nome del Salone'}
                     </h1>
                     <p 
                       style={{
                         color: salonData.web_subtitle_color || '#6b7280',
                         fontSize: getSubtitleFontSizeValue(salonData.web_subtitle_font_size || 'medium'),
                         fontFamily: getFontFamilyValue(salonData.web_subtitle_font_family || 'default')
                       }}
                       className={`${getFontWeightClass(salonData.web_subtitle_bold)} mb-3`}
                     >
                       {salonData.web_subtitle || 'Sottotitolo del Salone'}
                     </p>
                     <p 
                       style={{
                         color: salonData.web_description_color || '#374151',
                         fontSize: getDescriptionFontSizeValue(salonData.web_description_font_size || 'medium'),
                         fontFamily: getFontFamilyValue(salonData.web_description_font_family || 'default')
                       }}
                       className={`${getFontWeightClass(salonData.web_description_bold)} leading-relaxed`}
                     >
                       {salonData.web_description || 'Descrizione del salone che apparirà nella pagina web...'}
                     </p>
                     {salonData.web_studio_text && (
                       <p 
                         style={{
                           color: salonData.web_subtitle_color || '#6b7280',
                           fontSize: getStudioTextFontSizeValue(salonData.web_studio_text_font_size || 'small'),
                           fontFamily: getFontFamilyValue(salonData.web_subtitle_font_family || 'default')
                         }}
                         className={`${getFontWeightClass(salonData.web_studio_text_bold)} text-xs mt-1`}
                       >
                         {salonData.web_studio_text}
                       </p>
                     )}
                   </div>
                 </div>
              </div>
            )}

            {titleStyleTab === 'templates' && (
              <TitleTemplates 
                salonData={salonData}
                saving={saving}
                onTemplateApply={onTemplateApply}
              />
            )}
          </CardContent>
        </Card>
      )

    default:
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sottosezione non implementata</h3>
            <p className="text-gray-600">
              La sottosezione "{subSectionId}" non è ancora stata implementata.
            </p>
          </CardContent>
        </Card>
      )
  }
}

// Content Tab Component (legacy)
function ContentTab({ 
  salonData, 
  setSalonData,
  titleStyleTab,
  setTitleStyleTab,
  footerStyleTab,
  setFooterStyleTab,
  saving,
  onTemplateApply
}: { 
  salonData: SalonWebSettings
  setSalonData: React.Dispatch<React.SetStateAction<SalonWebSettings | null>>
  titleStyleTab: string
  setTitleStyleTab: React.Dispatch<React.SetStateAction<string>>
  footerStyleTab: string
  setFooterStyleTab: React.Dispatch<React.SetStateAction<string>>
  saving: boolean
  onTemplateApply: (templateData: any) => Promise<void>
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Principali</CardTitle>
          <CardDescription>
            Configura le informazioni principali del tuo salone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="web_title">Nome del Salone *</Label>
            <Input
              id="web_title"
              value={salonData.web_title || ''}
              onChange={(e) => setSalonData({ ...salonData, web_title: e.target.value })}
              placeholder="Es: Salone Bellezza Milano"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="web_subtitle">Sottotitolo</Label>
            <Input
              id="web_subtitle"
              value={salonData.web_subtitle || ''}
              onChange={(e) => setSalonData({ ...salonData, web_subtitle: e.target.value })}
              placeholder="Es: Professional Hair & Beauty Studio"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="web_description">Descrizione</Label>
            <Textarea
              id="web_description"
              value={salonData.web_description || ''}
              onChange={(e) => setSalonData({ ...salonData, web_description: e.target.value })}
              placeholder="Descrizione del tuo salone..."
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="web_studio_text">Testo Studio</Label>
            <Input
              id="web_studio_text"
              value={salonData.web_studio_text || ''}
              onChange={(e) => setSalonData({ ...salonData, web_studio_text: e.target.value })}
              placeholder="Es: STUDIO, SALONE, ecc."
            />
            <p className="text-xs text-gray-500">
              Testo aggiuntivo che apparirà sotto il nome del salone (es. "STUDIO", "SALONE")
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contatti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="web_contact_phone">Telefono</Label>
            <Input
              id="web_contact_phone"
              value={salonData.web_contact_phone || ''}
              onChange={(e) => setSalonData({ ...salonData, web_contact_phone: e.target.value })}
              placeholder="+39 02 1234 5678"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="web_contact_email">Email</Label>
            <Input
              id="web_contact_email"
              type="email"
              value={salonData.web_contact_email || ''}
              onChange={(e) => setSalonData({ ...salonData, web_contact_email: e.target.value })}
              placeholder="info@salone.it"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="web_address">Indirizzo</Label>
            <Textarea
              id="web_address"
              value={salonData.web_address || ''}
              onChange={(e) => setSalonData({ ...salonData, web_address: e.target.value })}
              placeholder="Via Roma 123, 20121 Milano"
              rows={2}
            />
            <p className="text-sm text-gray-600">
              Inserisci l'indirizzo completo (via, numero civico, città, CAP) per un posizionamento preciso sulla mappa
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="web_social_facebook">Facebook</Label>
            <Input
              id="web_social_facebook"
              value={salonData.web_social_facebook || ''}
              onChange={(e) => setSalonData({ ...salonData, web_social_facebook: e.target.value })}
              placeholder="https://facebook.com/salonepage"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="web_social_instagram">Instagram</Label>
            <Input
              id="web_social_instagram"
              value={salonData.web_social_instagram || ''}
              onChange={(e) => setSalonData({ ...salonData, web_social_instagram: e.target.value })}
              placeholder="@salone_instagram"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stile Titolo e Sottotitolo</CardTitle>
          <CardDescription>
            Personalizza l'aspetto del titolo e sottotitolo del salone
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setTitleStyleTab('manual')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                titleStyleTab === 'manual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Personalizzazione Manuale
            </button>
            <button
              onClick={() => setTitleStyleTab('templates')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                titleStyleTab === 'templates'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Template Predefiniti
            </button>
          </div>

          {titleStyleTab === 'manual' && (
            <div className="space-y-6">
              {/* Titolo */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Titolo del Salone</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="web_title_color">Colore Titolo</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="web_title_color"
                        type="color"
                        value={salonData.web_title_color || '#1f2937'}
                        onChange={(e) => setSalonData({ ...salonData, web_title_color: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={salonData.web_title_color || '#1f2937'}
                        onChange={(e) => setSalonData({ ...salonData, web_title_color: e.target.value })}
                        placeholder="#1f2937"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="web_salon_name_font_size">Dimensione Font</Label>
                    <select
                      id="web_salon_name_font_size"
                      value={salonData.web_salon_name_font_size || 'large'}
                      onChange={(e) => setSalonData({ ...salonData, web_salon_name_font_size: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="small">Piccolo (16px)</option>
                      <option value="medium">Medio (20px)</option>
                      <option value="large">Grande (24px)</option>
                      <option value="xl">Extra Large (32px)</option>
                      <option value="2xl">2XL (40px)</option>
                      <option value="3xl">3XL (48px)</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="web_title_font_family">Font Titolo</Label>
                  <select
                    id="web_title_font_family"
                    value={salonData.web_title_font_family || 'default'}
                    onChange={(e) => setSalonData({ ...salonData, web_title_font_family: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="default">Default (Sans-serif)</option>
                    <option value="serif">Serif</option>
                    <option value="sans-serif">Sans Serif</option>
                    <option value="monospace">Monospace</option>
                    <option value="cursive">Cursive</option>
                    <option value="fantasy">Fantasy</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="web_title_bold"
                      checked={salonData.web_title_bold || false}
                      onChange={(e) => setSalonData({ ...salonData, web_title_bold: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="web_title_bold">Titolo in Grassetto</Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Rendi il titolo del salone in grassetto
                  </p>
                </div>
              </div>

              {/* Sottotitolo */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Sottotitolo</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="web_subtitle_color">Colore Sottotitolo</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="web_subtitle_color"
                        type="color"
                        value={salonData.web_subtitle_color || '#6b7280'}
                        onChange={(e) => setSalonData({ ...salonData, web_subtitle_color: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={salonData.web_subtitle_color || '#6b7280'}
                        onChange={(e) => setSalonData({ ...salonData, web_subtitle_color: e.target.value })}
                        placeholder="#6b7280"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="web_subtitle_font_size">Dimensione Font</Label>
                    <select
                      id="web_subtitle_font_size"
                      value={salonData.web_subtitle_font_size || 'medium'}
                      onChange={(e) => setSalonData({ ...salonData, web_subtitle_font_size: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="small">Piccolo (14px)</option>
                      <option value="medium">Medio (16px)</option>
                      <option value="large">Grande (18px)</option>
                      <option value="xl">Extra Large (20px)</option>
                      <option value="2xl">2XL (24px)</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="web_subtitle_font_family">Font Sottotitolo</Label>
                  <select
                    id="web_subtitle_font_family"
                    value={salonData.web_subtitle_font_family || 'default'}
                    onChange={(e) => setSalonData({ ...salonData, web_subtitle_font_family: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="default">Default (Sans-serif)</option>
                    <option value="serif">Serif</option>
                    <option value="sans-serif">Sans Serif</option>
                    <option value="monospace">Monospace</option>
                    <option value="cursive">Cursive</option>
                    <option value="fantasy">Fantasy</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="web_subtitle_bold"
                      checked={salonData.web_subtitle_bold || false}
                      onChange={(e) => setSalonData({ ...salonData, web_subtitle_bold: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="web_subtitle_bold">Sottotitolo in Grassetto</Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Rendi il sottotitolo del salone in grassetto
                  </p>
                </div>
               </div>

               {/* Descrizione */}
               <div className="space-y-4">
                 <h4 className="font-medium text-gray-900">Descrizione</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="web_description_color">Colore Descrizione</Label>
                     <div className="flex items-center space-x-2">
                       <Input
                         id="web_description_color"
                         type="color"
                         value={salonData.web_description_color || '#374151'}
                         onChange={(e) => setSalonData({ ...salonData, web_description_color: e.target.value })}
                         className="w-16 h-10 p-1"
                       />
                       <Input
                         value={salonData.web_description_color || '#374151'}
                         onChange={(e) => setSalonData({ ...salonData, web_description_color: e.target.value })}
                         placeholder="#374151"
                       />
                     </div>
                   </div>
                   
                   <div className="space-y-2">
                     <Label htmlFor="web_description_font_size">Dimensione Font</Label>
                     <select
                       id="web_description_font_size"
                       value={salonData.web_description_font_size || 'medium'}
                       onChange={(e) => setSalonData({ ...salonData, web_description_font_size: e.target.value })}
                       className="w-full p-2 border border-gray-300 rounded-lg"
                     >
                       <option value="small">Piccolo (14px)</option>
                       <option value="medium">Medio (16px)</option>
                       <option value="large">Grande (18px)</option>
                       <option value="xl">Extra Large (20px)</option>
                       <option value="2xl">2XL (24px)</option>
                     </select>
                   </div>
                 </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="web_description_font_family">Font Descrizione</Label>
                   <select
                     id="web_description_font_family"
                     value={salonData.web_description_font_family || 'default'}
                     onChange={(e) => setSalonData({ ...salonData, web_description_font_family: e.target.value })}
                     className="w-full p-2 border border-gray-300 rounded-lg"
                   >
                     <option value="default">Default (Sans-serif)</option>
                     <option value="serif">Serif</option>
                     <option value="sans-serif">Sans Serif</option>
                     <option value="monospace">Monospace</option>
                     <option value="cursive">Cursive</option>
                     <option value="fantasy">Fantasy</option>
                   </select>
                 </div>
                 
                 <div className="space-y-2">
                   <div className="flex items-center space-x-2">
                     <input
                       type="checkbox"
                       id="web_description_bold"
                       checked={salonData.web_description_bold || false}
                       onChange={(e) => setSalonData({ ...salonData, web_description_bold: e.target.checked })}
                       className="rounded border-gray-300"
                     />
                     <Label htmlFor="web_description_bold">Descrizione in Grassetto</Label>
                   </div>
                   <p className="text-xs text-gray-500">
                     Rendi la descrizione del salone in grassetto
                   </p>
                 </div>
               </div>

               {/* Testo Studio */}
               <div className="space-y-4">
                 <h4 className="font-medium text-gray-900">Testo Studio</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="web_studio_text_font_size">Dimensione Font</Label>
                     <select
                       id="web_studio_text_font_size"
                       value={salonData.web_studio_text_font_size || 'small'}
                       onChange={(e) => setSalonData({ ...salonData, web_studio_text_font_size: e.target.value })}
                       className="w-full p-2 border border-gray-300 rounded-lg"
                     >
                       <option value="small">Piccolo (12px)</option>
                       <option value="medium">Medio (14px)</option>
                       <option value="large">Grande (16px)</option>
                     </select>
                   </div>
                 </div>
                 
                 <div className="space-y-2">
                   <div className="flex items-center space-x-2">
                     <input
                       type="checkbox"
                       id="web_studio_text_bold"
                       checked={salonData.web_studio_text_bold || false}
                       onChange={(e) => setSalonData({ ...salonData, web_studio_text_bold: e.target.checked })}
                       className="rounded border-gray-300"
                     />
                     <Label htmlFor="web_studio_text_bold">Testo Studio in Grassetto</Label>
                   </div>
                   <p className="text-xs text-gray-500">
                     Rendi il testo studio in grassetto
                   </p>
                 </div>
               </div>

               {/* Anteprima */}
               <div className="space-y-2">
                 <Label>Anteprima</Label>
                 <div className="p-4 border border-gray-200 rounded-lg bg-white">
                   <h1 
                     style={{
                       color: salonData.web_title_color || '#1f2937',
                       fontSize: getFontSizeValue(salonData.web_salon_name_font_size || 'large'),
                       fontFamily: getFontFamilyValue(salonData.web_title_font_family || 'default')
                     }}
                     className={`${getFontWeightClass(salonData.web_title_bold)} mb-2`}
                   >
                     {salonData.web_title || 'Nome del Salone'}
                   </h1>
                   <p 
                     style={{
                       color: salonData.web_subtitle_color || '#6b7280',
                       fontSize: getSubtitleFontSizeValue(salonData.web_subtitle_font_size || 'medium'),
                       fontFamily: getFontFamilyValue(salonData.web_subtitle_font_family || 'default')
                     }}
                     className={`${getFontWeightClass(salonData.web_subtitle_bold)} mb-3`}
                   >
                     {salonData.web_subtitle || 'Sottotitolo del Salone'}
                   </p>
                   <p 
                     style={{
                       color: salonData.web_description_color || '#374151',
                       fontSize: getDescriptionFontSizeValue(salonData.web_description_font_size || 'medium'),
                       fontFamily: getFontFamilyValue(salonData.web_description_font_family || 'default')
                     }}
                     className={`${getFontWeightClass(salonData.web_description_bold)} leading-relaxed`}
                   >
                     {salonData.web_description || 'Descrizione del salone che apparirà nella pagina web...'}
                   </p>
                   {salonData.web_studio_text && (
                     <p 
                       style={{
                         color: salonData.web_subtitle_color || '#6b7280',
                         fontSize: getStudioTextFontSizeValue(salonData.web_studio_text_font_size || 'small'),
                         fontFamily: getFontFamilyValue(salonData.web_subtitle_font_family || 'default')
                       }}
                       className={`${getFontWeightClass(salonData.web_studio_text_bold)} text-xs mt-1`}
                     >
                       {salonData.web_studio_text}
                     </p>
                   )}
                 </div>
               </div>
            </div>
          )}

          {titleStyleTab === 'templates' && (
            <TitleTemplates 
              salonData={salonData}
              saving={saving}
              onTemplateApply={onTemplateApply}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sezione Mappa</CardTitle>
          <CardDescription>
            Personalizza i testi e lo stile del pulsante della sezione mappa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="web_map_badge_text">Testo Badge</Label>
              <Input
                id="web_map_badge_text"
                value={salonData.web_map_badge_text || 'DOVE SIAMO'}
                onChange={(e) => setSalonData({ ...salonData, web_map_badge_text: e.target.value })}
                placeholder="DOVE SIAMO"
              />
              <p className="text-xs text-gray-500">
                Testo che appare nel badge colorato sopra il titolo della sezione mappa
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="web_map_title">Titolo Sezione Mappa</Label>
              <Input
                id="web_map_title"
                value={salonData.web_map_title || 'Vieni a Trovarci'}
                onChange={(e) => setSalonData({ ...salonData, web_map_title: e.target.value })}
                placeholder="Vieni a Trovarci"
              />
              <p className="text-xs text-gray-500">
                Titolo principale della sezione mappa
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="web_map_subtitle">Sottotitolo Sezione Mappa</Label>
              <Textarea
                id="web_map_subtitle"
                value={salonData.web_map_subtitle || 'Siamo facilmente raggiungibili. Vieni a trovarci per una consulenza personalizzata!'}
                onChange={(e) => setSalonData({ ...salonData, web_map_subtitle: e.target.value })}
                placeholder="Siamo facilmente raggiungibili. Vieni a trovarci per una consulenza personalizzata!"
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Descrizione che appare sotto il titolo della sezione mappa
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="web_map_call_button_text">Testo Pulsante Chiama Ora</Label>
              <Input
                id="web_map_call_button_text"
                value={salonData.web_map_call_button_text || 'Chiama Ora'}
                onChange={(e) => setSalonData({ ...salonData, web_map_call_button_text: e.target.value })}
                placeholder="Chiama Ora"
              />
              <p className="text-xs text-gray-500">
                Testo del pulsante che apre il telefono per chiamare il salone
              </p>
            </div>
          </div>

          {/* Map Button Styling */}
          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-900 mb-4">Stile Pulsante Mappa</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Pulsante Trasparente</Label>
                  <p className="text-sm text-gray-600">Rendi il pulsante trasparente con solo il contorno</p>
                </div>
                <Switch
                  checked={salonData.web_map_button_transparent || false}
                  onCheckedChange={(checked) => setSalonData({ ...salonData, web_map_button_transparent: checked })}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="web_map_button_size">Dimensione</Label>
                  <select
                    id="web_map_button_size"
                    value={salonData.web_map_button_size || 'medium'}
                    onChange={(e) => setSalonData({ ...salonData, web_map_button_size: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="small">Piccolo</option>
                    <option value="medium">Medio</option>
                    <option value="large">Grande</option>
                    <option value="xl">Extra Large</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="web_map_button_border_radius">Arrotondamento</Label>
                  <select
                    id="web_map_button_border_radius"
                    value={salonData.web_map_button_border_radius || 'medium'}
                    onChange={(e) => setSalonData({ ...salonData, web_map_button_border_radius: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="none">Nessuno</option>
                    <option value="small">Piccolo</option>
                    <option value="medium">Medio</option>
                    <option value="large">Grande</option>
                    <option value="full">Completo</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="web_map_button_color">Colore di Sfondo</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="web_map_button_color"
                      type="color"
                      value={salonData.web_map_button_color || '#6366f1'}
                      onChange={(e) => setSalonData({ ...salonData, web_map_button_color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={salonData.web_map_button_color || '#6366f1'}
                      onChange={(e) => setSalonData({ ...salonData, web_map_button_color: e.target.value })}
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="web_map_button_text_color">Colore Testo</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="web_map_button_text_color"
                      type="color"
                      value={salonData.web_map_button_text_color || '#ffffff'}
                      onChange={(e) => setSalonData({ ...salonData, web_map_button_text_color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={salonData.web_map_button_text_color || '#ffffff'}
                      onChange={(e) => setSalonData({ ...salonData, web_map_button_text_color: e.target.value })}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="web_map_button_border_color">Colore Contorno</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="web_map_button_border_color"
                      type="color"
                      value={salonData.web_map_button_border_color || '#6366f1'}
                      onChange={(e) => setSalonData({ ...salonData, web_map_button_border_color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={salonData.web_map_button_border_color || '#6366f1'}
                      onChange={(e) => setSalonData({ ...salonData, web_map_button_border_color: e.target.value })}
                      placeholder="#6366f1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="web_map_button_border_width">Spessore Contorno</Label>
                  <select
                    id="web_map_button_border_width"
                    value={salonData.web_map_button_border_width || '1px'}
                    onChange={(e) => setSalonData({ ...salonData, web_map_button_border_width: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="0px">Nessun contorno</option>
                    <option value="1px">Sottile (1px)</option>
                    <option value="2px">Medio (2px)</option>
                    <option value="3px">Spesso (3px)</option>
                    <option value="4px">Molto spesso (4px)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Map Button Preview */}
            <div className="space-y-2 mt-6">
              <Label>Anteprima Pulsante Mappa</Label>
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <div className="flex justify-center">
                  <button
                    style={{
                      backgroundColor: salonData.web_map_button_transparent ? 'transparent' : (salonData.web_map_button_color || '#6366f1'),
                      borderColor: salonData.web_map_button_border_color || (salonData.web_map_button_transparent ? '#6366f1' : '#6366f1'),
                      borderWidth: salonData.web_map_button_border_width || (salonData.web_map_button_transparent ? '2px' : '1px'),
                      borderRadius: getButtonBorderRadius(salonData.web_map_button_border_radius || 'medium'),
                      padding: getButtonPadding(salonData.web_map_button_size || 'medium'),
                      fontSize: getButtonFontSize(salonData.web_map_button_size || 'medium'),
                      color: salonData.web_map_button_transparent ? (salonData.web_map_button_text_color || '#6366f1') : (salonData.web_map_button_text_color || '#ffffff'),
                      borderStyle: 'solid',
                      fontWeight: '600'
                    }}
                    className="font-medium transition-all duration-200 hover:opacity-80"
                  >
                    <Phone className="w-5 h-5 mr-2 inline" />
                    {salonData.web_map_call_button_text || 'Chiama Ora'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orari di Apertura */}
      <Card>
        <CardHeader>
          <CardTitle>Orari di Apertura</CardTitle>
          <CardDescription>
            Configura gli orari di apertura del salone per ogni giorno della settimana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OpeningHoursManager 
            salonId={salonData.salon_id}
            onHoursChange={(hours) => {
              // Update the web_map_opening_hours field when hours change
              const formattedHours = hours
                .filter(hour => hour.isOpen)
                .map(hour => {
                  let timeText = `${hour.startTime} - ${hour.endTime}`
                  if (hour.isBreakTime) {
                    timeText += `\n  Pausa: ${hour.breakStartTime} - ${hour.breakEndTime}`
                  }
                  return `${hour.day}: ${timeText}`
                })
                .join('\n')
              
              setSalonData({ ...salonData, web_map_opening_hours: formattedHours })
            }}
          />
        </CardContent>
      </Card>

      {/* Personalizzazione Pulsante Orari di Apertura */}
      <Card>
        <CardHeader>
          <CardTitle>Pulsante Sezione Orari</CardTitle>
          <CardDescription>
            Personalizza l'aspetto e il comportamento del pulsante nella sezione orari di apertura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Testo e Azione Pulsante */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Testo e Azione Pulsante</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="web_opening_hours_button_text">Testo Pulsante</Label>
                <Input
                  id="web_opening_hours_button_text"
                  value={salonData.web_opening_hours_button_text || 'Prenota Ora'}
                  onChange={(e) => setSalonData({ ...salonData, web_opening_hours_button_text: e.target.value })}
                  placeholder="Prenota Ora"
                />
                <p className="text-xs text-gray-500">
                  Testo che appare sul pulsante nella sezione orari di apertura
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_opening_hours_button_action">Azione Pulsante</Label>
                <select
                  id="web_opening_hours_button_action"
                  value={salonData.web_opening_hours_button_action || 'booking'}
                  onChange={(e) => setSalonData({ ...salonData, web_opening_hours_button_action: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="booking">Prenotazione</option>
                  <option value="contact">Contatti</option>
                  <option value="phone">Telefono</option>
                  <option value="hours">Orari</option>
                  <option value="map">Mappa</option>
                </select>
                <p className="text-xs text-gray-500">
                  Azione che viene eseguita quando si clicca sul pulsante
                </p>
              </div>
            </div>
          </div>

          {/* Stile Pulsante */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-gray-900">Stile Pulsante</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_opening_hours_button_color">Colore Sfondo</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_opening_hours_button_color"
                    type="color"
                    value={salonData.web_opening_hours_button_color || '#6366f1'}
                    onChange={(e) => setSalonData({ ...salonData, web_opening_hours_button_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_opening_hours_button_color || '#6366f1'}
                    onChange={(e) => setSalonData({ ...salonData, web_opening_hours_button_color: e.target.value })}
                    placeholder="#6366f1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_opening_hours_button_text_color">Colore Testo</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_opening_hours_button_text_color"
                    type="color"
                    value={salonData.web_opening_hours_button_text_color || '#ffffff'}
                    onChange={(e) => setSalonData({ ...salonData, web_opening_hours_button_text_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_opening_hours_button_text_color || '#ffffff'}
                    onChange={(e) => setSalonData({ ...salonData, web_opening_hours_button_text_color: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_opening_hours_button_border_color">Colore Bordo</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_opening_hours_button_border_color"
                    type="color"
                    value={salonData.web_opening_hours_button_border_color || '#6366f1'}
                    onChange={(e) => setSalonData({ ...salonData, web_opening_hours_button_border_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_opening_hours_button_border_color || '#6366f1'}
                    onChange={(e) => setSalonData({ ...salonData, web_opening_hours_button_border_color: e.target.value })}
                    placeholder="#6366f1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_opening_hours_button_border_width">Spessore Bordo</Label>
                <select
                  id="web_opening_hours_button_border_width"
                  value={salonData.web_opening_hours_button_border_width || '0px'}
                  onChange={(e) => setSalonData({ ...salonData, web_opening_hours_button_border_width: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="0px">Nessun bordo</option>
                  <option value="1px">Sottile</option>
                  <option value="2px">Normale</option>
                  <option value="3px">Spesso</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_opening_hours_button_border_radius">Raggio Bordi</Label>
                <select
                  id="web_opening_hours_button_border_radius"
                  value={salonData.web_opening_hours_button_border_radius || 'medium'}
                  onChange={(e) => setSalonData({ ...salonData, web_opening_hours_button_border_radius: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="none">Nessun raggio</option>
                  <option value="small">Piccolo</option>
                  <option value="medium">Medio</option>
                  <option value="large">Grande</option>
                  <option value="full">Completamente arrotondato</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_opening_hours_button_size">Dimensione</Label>
                <select
                  id="web_opening_hours_button_size"
                  value={salonData.web_opening_hours_button_size || 'large'}
                  onChange={(e) => setSalonData({ ...salonData, web_opening_hours_button_size: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="small">Piccola</option>
                  <option value="medium">Media</option>
                  <option value="large">Grande</option>
                  <option value="xl">Extra Large</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="web_opening_hours_button_transparent"
                    checked={salonData.web_opening_hours_button_transparent || false}
                    onChange={(e) => setSalonData({ ...salonData, web_opening_hours_button_transparent: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="web_opening_hours_button_transparent">Sfondo Trasparente</Label>
                </div>
                <p className="text-xs text-gray-500">
                  Rende lo sfondo del pulsante trasparente, mostrando solo il bordo
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sezione Prenotazione</CardTitle>
          <CardDescription>
            Personalizza l'aspetto e il contenuto della sezione prenotazione
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Testi Sezione Prenotazione */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Testi Sezione Prenotazione</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="web_booking_section_badge_text">Testo Badge</Label>
                <Input
                  id="web_booking_section_badge_text"
                  value={salonData.web_booking_section_badge_text || 'PRENOTAZIONE ONLINE'}
                  onChange={(e) => setSalonData({ ...salonData, web_booking_section_badge_text: e.target.value })}
                  placeholder="PRENOTAZIONE ONLINE"
                />
                <p className="text-xs text-gray-500">
                  Testo che appare nel badge colorato sopra il titolo della sezione prenotazione
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_booking_section_title">Titolo Sezione Prenotazione</Label>
                <Input
                  id="web_booking_section_title"
                  value={salonData.web_booking_section_title || 'Prenota il Tuo Appuntamento'}
                  onChange={(e) => setSalonData({ ...salonData, web_booking_section_title: e.target.value })}
                  placeholder="Prenota il Tuo Appuntamento"
                />
                <p className="text-xs text-gray-500">
                  Titolo principale della sezione prenotazione
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_booking_section_subtitle">Sottotitolo Sezione Prenotazione</Label>
                <Textarea
                  id="web_booking_section_subtitle"
                  value={salonData.web_booking_section_subtitle || 'Scegli il servizio, la data e l\'ora che preferisci. La prenotazione è semplice e veloce!'}
                  onChange={(e) => setSalonData({ ...salonData, web_booking_section_subtitle: e.target.value })}
                  placeholder="Scegli il servizio, la data e l'ora che preferisci. La prenotazione è semplice e veloce!"
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  Descrizione che appare sotto il titolo della sezione prenotazione
                </p>
              </div>
            </div>
          </div>

          {/* Colori Sezione Prenotazione */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-gray-900">Colori Sezione Prenotazione</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_booking_section_background_color">Colore Sfondo Sezione</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_booking_section_background_color"
                    type="color"
                    value={salonData.web_booking_section_background_color || '#f0f9ff'}
                    onChange={(e) => setSalonData({ ...salonData, web_booking_section_background_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_booking_section_background_color || '#f0f9ff'}
                    onChange={(e) => setSalonData({ ...salonData, web_booking_section_background_color: e.target.value })}
                    placeholder="#f0f9ff"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_booking_section_card_background">Colore Sfondo Card</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_booking_section_card_background"
                    type="color"
                    value={salonData.web_booking_section_card_background || '#ffffff'}
                    onChange={(e) => setSalonData({ ...salonData, web_booking_section_card_background: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_booking_section_card_background || '#ffffff'}
                    onChange={(e) => setSalonData({ ...salonData, web_booking_section_card_background: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_booking_section_title_color">Colore Titolo</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_booking_section_title_color"
                    type="color"
                    value={salonData.web_booking_section_title_color || '#1f2937'}
                    onChange={(e) => setSalonData({ ...salonData, web_booking_section_title_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_booking_section_title_color || '#1f2937'}
                    onChange={(e) => setSalonData({ ...salonData, web_booking_section_title_color: e.target.value })}
                    placeholder="#1f2937"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_booking_section_subtitle_color">Colore Sottotitolo</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_booking_section_subtitle_color"
                    type="color"
                    value={salonData.web_booking_section_subtitle_color || '#6b7280'}
                    onChange={(e) => setSalonData({ ...salonData, web_booking_section_subtitle_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_booking_section_subtitle_color || '#6b7280'}
                    onChange={(e) => setSalonData({ ...salonData, web_booking_section_subtitle_color: e.target.value })}
                    placeholder="#6b7280"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_booking_section_badge_background">Colore Sfondo Badge</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_booking_section_badge_background"
                    type="color"
                    value={salonData.web_booking_section_badge_background || '#dbeafe'}
                    onChange={(e) => setSalonData({ ...salonData, web_booking_section_badge_background: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_booking_section_badge_background || '#dbeafe'}
                    onChange={(e) => setSalonData({ ...salonData, web_booking_section_badge_background: e.target.value })}
                    placeholder="#dbeafe"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_booking_section_badge_text_color">Colore Testo Badge</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_booking_section_badge_text_color"
                    type="color"
                    value={salonData.web_booking_section_badge_text_color || '#1d4ed8'}
                    onChange={(e) => setSalonData({ ...salonData, web_booking_section_badge_text_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_booking_section_badge_text_color || '#1d4ed8'}
                    onChange={(e) => setSalonData({ ...salonData, web_booking_section_badge_text_color: e.target.value })}
                    placeholder="#1d4ed8"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_booking_section_card_border_color">Colore Bordo Card</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_booking_section_card_border_color"
                    type="color"
                    value={salonData.web_booking_section_card_border_color || '#e5e7eb'}
                    onChange={(e) => setSalonData({ ...salonData, web_booking_section_card_border_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_booking_section_card_border_color || '#e5e7eb'}
                    onChange={(e) => setSalonData({ ...salonData, web_booking_section_card_border_color: e.target.value })}
                    placeholder="#e5e7eb"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_booking_section_card_shadow">Stile Ombra Card</Label>
                <select
                  id="web_booking_section_card_shadow"
                  value={salonData.web_booking_section_card_shadow || 'shadow-2xl'}
                  onChange={(e) => setSalonData({ ...salonData, web_booking_section_card_shadow: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="shadow-sm">Piccola</option>
                  <option value="shadow-md">Media</option>
                  <option value="shadow-lg">Grande</option>
                  <option value="shadow-xl">Extra Large</option>
                  <option value="shadow-2xl">2XL</option>
                </select>
              </div>
            </div>
          </div>

          {/* Anteprima Sezione Prenotazione */}
          <div className="space-y-2 border-t pt-4">
            <Label>Anteprima Sezione Prenotazione</Label>
            <div 
              className="p-4 border border-gray-200 rounded-lg"
              style={{ backgroundColor: salonData.web_booking_section_background_color || '#f0f9ff' }}
            >
              <div className="text-center mb-4">
                <div 
                  className="inline-flex items-center rounded-full px-4 py-1 mb-2"
                  style={{ backgroundColor: salonData.web_booking_section_badge_background || '#dbeafe' }}
                >
                  <Calendar className="w-4 h-4 mr-1" style={{ color: salonData.web_booking_section_badge_text_color || '#1d4ed8' }} />
                  <span 
                    className="text-xs font-semibold"
                    style={{ color: salonData.web_booking_section_badge_text_color || '#1d4ed8' }}
                  >
                    {salonData.web_booking_section_badge_text || 'PRENOTAZIONE ONLINE'}
                  </span>
                </div>
                <h4 
                  className="text-lg font-bold mb-2"
                  style={{ color: salonData.web_booking_section_title_color || '#1f2937' }}
                >
                  {salonData.web_booking_section_title || 'Prenota il Tuo Appuntamento'}
                </h4>
                <p 
                  className="text-sm"
                  style={{ color: salonData.web_booking_section_subtitle_color || '#6b7280' }}
                >
                  {salonData.web_booking_section_subtitle || 'Scegli il servizio, la data e l\'ora che preferisci. La prenotazione è semplice e veloce!'}
                </p>
              </div>
              <div 
                className="p-3 rounded-lg border"
                style={{ 
                  backgroundColor: salonData.web_booking_section_card_background || '#ffffff',
                  borderColor: salonData.web_booking_section_card_border_color || '#e5e7eb',
                  boxShadow: salonData.web_booking_section_card_shadow === 'shadow-2xl' ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' :
                             salonData.web_booking_section_card_shadow === 'shadow-xl' ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' :
                             salonData.web_booking_section_card_shadow === 'shadow-lg' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' :
                             salonData.web_booking_section_card_shadow === 'shadow-md' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' :
                             salonData.web_booking_section_card_shadow === 'shadow-sm' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
              >
                <div className="text-center text-gray-500 text-sm">
                  Form di prenotazione
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personalizzazione Navbar</CardTitle>
          <CardDescription>
            Personalizza l'aspetto e il contenuto della barra di navigazione
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Navbar */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Logo Navbar</h4>
            <div className="space-y-2">
              <Label htmlFor="web_navbar_logo_url">URL Logo Navbar</Label>
              <Input
                id="web_navbar_logo_url"
                value={salonData.web_navbar_logo_url || ''}
                onChange={(e) => setSalonData({ ...salonData, web_navbar_logo_url: e.target.value })}
                placeholder="https://example.com/navbar-logo.png"
              />
              <p className="text-xs text-gray-500">
                URL del logo specifico per la navbar. Se vuoto, userà il logo principale.
              </p>
            </div>
          </div>

          {/* Testi Navbar */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Testi Navbar</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="web_navbar_title">Titolo Navbar</Label>
                <Input
                  id="web_navbar_title"
                  value={salonData.web_navbar_title || ''}
                  onChange={(e) => setSalonData({ ...salonData, web_navbar_title: e.target.value })}
                  placeholder="Titolo specifico per la navbar"
                />
                <p className="text-xs text-gray-500">
                  Titolo specifico per la navbar. Se vuoto, userà il titolo principale.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_navbar_subtitle">Sottotitolo Navbar</Label>
                <Input
                  id="web_navbar_subtitle"
                  value={salonData.web_navbar_subtitle || ''}
                  onChange={(e) => setSalonData({ ...salonData, web_navbar_subtitle: e.target.value })}
                  placeholder="Sottotitolo specifico per la navbar"
                />
                <p className="text-xs text-gray-500">
                  Sottotitolo specifico per la navbar. Se vuoto, userà il sottotitolo principale.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_navbar_studio_text">Testo Studio Navbar</Label>
                <Input
                  id="web_navbar_studio_text"
                  value={salonData.web_navbar_studio_text || ''}
                  onChange={(e) => setSalonData({ ...salonData, web_navbar_studio_text: e.target.value })}
                  placeholder="Testo studio specifico per la navbar"
                />
                <p className="text-xs text-gray-500">
                  Testo studio specifico per la navbar. Se vuoto, userà il testo studio principale.
                </p>
              </div>
            </div>
          </div>

          {/* Pulsanti Navbar */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Pulsanti Navbar</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostra Pulsante Telefono</Label>
                  <p className="text-sm text-gray-600">Mostra il pulsante telefono nella navbar</p>
                </div>
                <Switch
                  checked={salonData.web_navbar_show_phone ?? true}
                  onCheckedChange={(checked) => setSalonData({ ...salonData, web_navbar_show_phone: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mostra Pulsante Prenotazione</Label>
                  <p className="text-sm text-gray-600">Mostra il pulsante prenotazione nella navbar</p>
                </div>
                <Switch
                  checked={salonData.web_navbar_show_booking ?? true}
                  onCheckedChange={(checked) => setSalonData({ ...salonData, web_navbar_show_booking: checked })}
                />
              </div>
            </div>

            {/* Configurazione Pulsante Telefono */}
            <div className="space-y-4 border-t pt-4">
              <h5 className="font-medium text-gray-900">Pulsante Telefono</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="web_navbar_phone_text">Testo Pulsante Telefono</Label>
                  <Input
                    id="web_navbar_phone_text"
                    value={salonData.web_navbar_phone_text || ''}
                    onChange={(e) => setSalonData({ ...salonData, web_navbar_phone_text: e.target.value })}
                    placeholder="Chiama Ora"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="web_navbar_phone_action">Azione Pulsante Telefono</Label>
                  <select
                    id="web_navbar_phone_action"
                    value={salonData.web_navbar_phone_action || 'phone'}
                    onChange={(e) => setSalonData({ ...salonData, web_navbar_phone_action: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="phone">Chiama Ora</option>
                    <option value="contact">Contattaci</option>
                    <option value="hours">I Nostri Orari</option>
                    <option value="map">Mappa</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Configurazione Pulsante Prenotazione */}
            <div className="space-y-4 border-t pt-4">
              <h5 className="font-medium text-gray-900">Pulsante Prenotazione</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="web_navbar_booking_text">Testo Pulsante Prenotazione</Label>
                  <Input
                    id="web_navbar_booking_text"
                    value={salonData.web_navbar_booking_text || ''}
                    onChange={(e) => setSalonData({ ...salonData, web_navbar_booking_text: e.target.value })}
                    placeholder="Prenota Ora"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="web_navbar_booking_action">Azione Pulsante Prenotazione</Label>
                  <select
                    id="web_navbar_booking_action"
                    value={salonData.web_navbar_booking_action || 'booking'}
                    onChange={(e) => setSalonData({ ...salonData, web_navbar_booking_action: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="booking">Prenotazione Appuntamento</option>
                    <option value="contact">Contattaci</option>
                    <option value="hours">I Nostri Orari</option>
                    <option value="map">Mappa</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Colori Navbar */}
            <div className="space-y-4 border-t pt-4">
              <h5 className="font-medium text-gray-900">Colori Navbar</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="web_navbar_background_color">Colore Sfondo Navbar</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="web_navbar_background_color"
                      type="color"
                      value={salonData.web_navbar_background_color || '#ffffff'}
                      onChange={(e) => setSalonData({ ...salonData, web_navbar_background_color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={salonData.web_navbar_background_color || '#ffffff'}
                      onChange={(e) => setSalonData({ ...salonData, web_navbar_background_color: e.target.value })}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="web_navbar_text_color">Colore Testo Titolo</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="web_navbar_text_color"
                      type="color"
                      value={salonData.web_navbar_text_color || '#000000'}
                      onChange={(e) => setSalonData({ ...salonData, web_navbar_text_color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={salonData.web_navbar_text_color || '#000000'}
                      onChange={(e) => setSalonData({ ...salonData, web_navbar_text_color: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_navbar_subtitle_color">Colore Testo Sottotitolo</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_navbar_subtitle_color"
                    type="color"
                    value={salonData.web_navbar_subtitle_color || '#666666'}
                    onChange={(e) => setSalonData({ ...salonData, web_navbar_subtitle_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_navbar_subtitle_color || '#666666'}
                    onChange={(e) => setSalonData({ ...salonData, web_navbar_subtitle_color: e.target.value })}
                    placeholder="#666666"
                  />
                </div>
              </div>
            </div>

            {/* Colori Pulsanti Navbar */}
            <div className="space-y-4 border-t pt-4">
              <h5 className="font-medium text-gray-900">Colori Pulsanti Navbar</h5>
              
              {/* Pulsante Telefono */}
              <div className="space-y-4">
                <h6 className="font-medium text-gray-700">Pulsante Telefono</h6>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="web_navbar_phone_button_background">Colore Sfondo</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="web_navbar_phone_button_background"
                        type="color"
                        value={salonData.web_navbar_phone_button_background || '#ffffff'}
                        onChange={(e) => setSalonData({ ...salonData, web_navbar_phone_button_background: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={salonData.web_navbar_phone_button_background || '#ffffff'}
                        onChange={(e) => setSalonData({ ...salonData, web_navbar_phone_button_background: e.target.value })}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="web_navbar_phone_button_text_color">Colore Testo</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="web_navbar_phone_button_text_color"
                        type="color"
                        value={salonData.web_navbar_phone_button_text_color || '#000000'}
                        onChange={(e) => setSalonData({ ...salonData, web_navbar_phone_button_text_color: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={salonData.web_navbar_phone_button_text_color || '#000000'}
                        onChange={(e) => setSalonData({ ...salonData, web_navbar_phone_button_text_color: e.target.value })}
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="web_navbar_phone_button_border_color">Colore Contorno</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="web_navbar_phone_button_border_color"
                        type="color"
                        value={salonData.web_navbar_phone_button_border_color || '#d1d5db'}
                        onChange={(e) => setSalonData({ ...salonData, web_navbar_phone_button_border_color: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={salonData.web_navbar_phone_button_border_color || '#d1d5db'}
                        onChange={(e) => setSalonData({ ...salonData, web_navbar_phone_button_border_color: e.target.value })}
                        placeholder="#d1d5db"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Pulsante Prenotazione */}
              <div className="space-y-4">
                <h6 className="font-medium text-gray-700">Pulsante Prenotazione</h6>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="web_navbar_booking_button_background">Colore Sfondo</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="web_navbar_booking_button_background"
                        type="color"
                        value={salonData.web_navbar_booking_button_background || '#6366f1'}
                        onChange={(e) => setSalonData({ ...salonData, web_navbar_booking_button_background: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={salonData.web_navbar_booking_button_background || '#6366f1'}
                        onChange={(e) => setSalonData({ ...salonData, web_navbar_booking_button_background: e.target.value })}
                        placeholder="#6366f1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="web_navbar_booking_button_text_color">Colore Testo</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="web_navbar_booking_button_text_color"
                        type="color"
                        value={salonData.web_navbar_booking_button_text_color || '#ffffff'}
                        onChange={(e) => setSalonData({ ...salonData, web_navbar_booking_button_text_color: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={salonData.web_navbar_booking_button_text_color || '#ffffff'}
                        onChange={(e) => setSalonData({ ...salonData, web_navbar_booking_button_text_color: e.target.value })}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="web_navbar_booking_button_border_color">Colore Contorno</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="web_navbar_booking_button_border_color"
                        type="color"
                        value={salonData.web_navbar_booking_button_border_color || '#6366f1'}
                        onChange={(e) => setSalonData({ ...salonData, web_navbar_booking_button_border_color: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={salonData.web_navbar_booking_button_border_color || '#6366f1'}
                        onChange={(e) => setSalonData({ ...salonData, web_navbar_booking_button_border_color: e.target.value })}
                        placeholder="#6366f1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Anteprima Navbar */}
            <div className="space-y-2 border-t pt-4">
              <Label>Anteprima Navbar</Label>
              <div 
                className="p-4 border border-gray-200 rounded-lg"
                style={{ backgroundColor: salonData.web_navbar_background_color || '#ffffff' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {(salonData.web_navbar_logo_url || salonData.web_logo_url) ? (
                      <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                        <span className="text-xs text-gray-500">Logo</span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Scissors className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 
                        className="font-bold text-lg"
                        style={{ color: salonData.web_navbar_text_color || '#000000' }}
                      >
                        {salonData.web_navbar_title || salonData.web_title || 'Nome Salone'}
                      </h3>
                      {(salonData.web_navbar_subtitle || salonData.web_subtitle) && (
                        <p 
                          className="text-sm"
                          style={{ color: salonData.web_navbar_subtitle_color || '#666666' }}
                        >
                          {salonData.web_navbar_subtitle || salonData.web_subtitle}
                        </p>
                      )}
                      {(salonData.web_navbar_studio_text || salonData.web_studio_text) && (
                        <p 
                          className="text-xs"
                          style={{ color: salonData.web_navbar_subtitle_color || '#666666' }}
                        >
                          {salonData.web_navbar_studio_text || salonData.web_studio_text}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(salonData.web_navbar_show_phone ?? true) && (
                      <div 
                        className="px-3 py-1 rounded text-sm"
                        style={{
                          backgroundColor: salonData.web_navbar_phone_button_background || '#ffffff',
                          color: salonData.web_navbar_phone_button_text_color || '#000000',
                          borderColor: salonData.web_navbar_phone_button_border_color || '#d1d5db',
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                      >
                        {salonData.web_navbar_phone_text || 'Chiama'}
                      </div>
                    )}
                    {(salonData.web_navbar_show_booking ?? true) && (
                      <div 
                        className="px-3 py-1 rounded text-sm"
                        style={{
                          backgroundColor: salonData.web_navbar_booking_button_background || '#6366f1',
                          color: salonData.web_navbar_booking_button_text_color || '#ffffff',
                          borderColor: salonData.web_navbar_booking_button_border_color || '#6366f1',
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }}
                      >
                        {salonData.web_navbar_booking_text || 'Prenota'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personalizzazione Footer</CardTitle>
          <CardDescription>
            Personalizza completamente l'aspetto e il contenuto del footer della pagina web
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setFooterStyleTab('manual')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                footerStyleTab === 'manual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Personalizzazione Manuale
            </button>
            <button
              onClick={() => setFooterStyleTab('templates')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                footerStyleTab === 'templates'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Template Predefiniti
            </button>
          </div>

          {footerStyleTab === 'manual' && (
            <div className="space-y-6">
          {/* Footer Content */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Contenuto Footer</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="web_footer_copyright_text">Testo Copyright</Label>
                <Input
                  id="web_footer_copyright_text"
                  value={salonData.web_footer_copyright_text || '© 2024 {salon_name}. Tutti i diritti riservati.'}
                  onChange={(e) => setSalonData({ ...salonData, web_footer_copyright_text: e.target.value })}
                  placeholder="© 2024 {salon_name}. Tutti i diritti riservati."
                />
                <p className="text-xs text-gray-500">
                  Usa {'{salon_name}'} come placeholder per il nome del salone
                </p>
              </div>
            </div>

            {/* Footer Visibility */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-700">Elementi Visibili</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="web_footer_show_social_links"
                    checked={salonData.web_footer_show_social_links ?? true}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_show_social_links: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="web_footer_show_social_links">Mostra Social Links</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="web_footer_show_contact_info"
                    checked={salonData.web_footer_show_contact_info ?? true}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_show_contact_info: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="web_footer_show_contact_info">Mostra Info Contatti</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="web_footer_show_copyright"
                    checked={salonData.web_footer_show_copyright ?? true}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_show_copyright: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="web_footer_show_copyright">Mostra Copyright</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Colors */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-gray-900">Colori Footer</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_footer_background_color">Colore Sfondo</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_footer_background_color"
                    type="color"
                    value={salonData.web_footer_background_color || '#1f2937'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_background_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_footer_background_color || '#1f2937'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_background_color: e.target.value })}
                    placeholder="#1f2937"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_footer_text_color">Colore Testo Principale</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_footer_text_color"
                    type="color"
                    value={salonData.web_footer_text_color || '#ffffff'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_text_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_footer_text_color || '#ffffff'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_text_color: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_footer_title_color">Colore Titoli</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_footer_title_color"
                    type="color"
                    value={salonData.web_footer_title_color || '#ffffff'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_title_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_footer_title_color || '#ffffff'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_title_color: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_footer_subtitle_color">Colore Sottotitoli</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_footer_subtitle_color"
                    type="color"
                    value={salonData.web_footer_subtitle_color || '#9ca3af'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_subtitle_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_footer_subtitle_color || '#9ca3af'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_subtitle_color: e.target.value })}
                    placeholder="#9ca3af"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_footer_description_color">Colore Descrizioni</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_footer_description_color"
                    type="color"
                    value={salonData.web_footer_description_color || '#9ca3af'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_description_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_footer_description_color || '#9ca3af'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_description_color: e.target.value })}
                    placeholder="#9ca3af"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_footer_link_color">Colore Link</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_footer_link_color"
                    type="color"
                    value={salonData.web_footer_link_color || '#9ca3af'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_link_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_footer_link_color || '#9ca3af'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_link_color: e.target.value })}
                    placeholder="#9ca3af"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_footer_link_hover_color">Colore Link Hover</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_footer_link_hover_color"
                    type="color"
                    value={salonData.web_footer_link_hover_color || '#ffffff'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_link_hover_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_footer_link_hover_color || '#ffffff'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_link_hover_color: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_footer_border_color">Colore Bordi</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_footer_border_color"
                    type="color"
                    value={salonData.web_footer_border_color || '#374151'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_border_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_footer_border_color || '#374151'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_border_color: e.target.value })}
                    placeholder="#374151"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_footer_social_icon_color">Colore Icone Social</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_footer_social_icon_color"
                    type="color"
                    value={salonData.web_footer_social_icon_color || '#9ca3af'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_social_icon_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_footer_social_icon_color || '#9ca3af'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_social_icon_color: e.target.value })}
                    placeholder="#9ca3af"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_footer_social_icon_hover_color">Colore Icone Social Hover</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_footer_social_icon_hover_color"
                    type="color"
                    value={salonData.web_footer_social_icon_hover_color || '#ffffff'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_social_icon_hover_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_footer_social_icon_hover_color || '#ffffff'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_social_icon_hover_color: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_footer_copyright_color">Colore Copyright</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_footer_copyright_color"
                    type="color"
                    value={salonData.web_footer_copyright_color || '#9ca3af'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_copyright_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_footer_copyright_color || '#9ca3af'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_copyright_color: e.target.value })}
                    placeholder="#9ca3af"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Typography */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-gray-900">Tipografia Footer</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_footer_title_font_family">Font Titoli</Label>
                <select
                  id="web_footer_title_font_family"
                  value={salonData.web_footer_title_font_family || 'default'}
                  onChange={(e) => setSalonData({ ...salonData, web_footer_title_font_family: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="default">Default (Sans-serif)</option>
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="cursive">Cursive</option>
                  <option value="fantasy">Fantasy</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_footer_title_font_size">Dimensione Titoli</Label>
                <select
                  id="web_footer_title_font_size"
                  value={salonData.web_footer_title_font_size || 'large'}
                  onChange={(e) => setSalonData({ ...salonData, web_footer_title_font_size: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="small">Piccolo (14px)</option>
                  <option value="medium">Medio (16px)</option>
                  <option value="large">Grande (18px)</option>
                  <option value="xl">Extra Large (20px)</option>
                  <option value="2xl">2XL (24px)</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_footer_subtitle_font_family">Font Sottotitoli</Label>
                <select
                  id="web_footer_subtitle_font_family"
                  value={salonData.web_footer_subtitle_font_family || 'default'}
                  onChange={(e) => setSalonData({ ...salonData, web_footer_subtitle_font_family: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="default">Default (Sans-serif)</option>
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="cursive">Cursive</option>
                  <option value="fantasy">Fantasy</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_footer_subtitle_font_size">Dimensione Sottotitoli</Label>
                <select
                  id="web_footer_subtitle_font_size"
                  value={salonData.web_footer_subtitle_font_size || 'medium'}
                  onChange={(e) => setSalonData({ ...salonData, web_footer_subtitle_font_size: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="small">Piccolo (12px)</option>
                  <option value="medium">Medio (14px)</option>
                  <option value="large">Grande (16px)</option>
                  <option value="xl">Extra Large (18px)</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_footer_description_font_family">Font Descrizioni</Label>
                <select
                  id="web_footer_description_font_family"
                  value={salonData.web_footer_description_font_family || 'default'}
                  onChange={(e) => setSalonData({ ...salonData, web_footer_description_font_family: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="default">Default (Sans-serif)</option>
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="cursive">Cursive</option>
                  <option value="fantasy">Fantasy</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_footer_description_font_size">Dimensione Descrizioni</Label>
                <select
                  id="web_footer_description_font_size"
                  value={salonData.web_footer_description_font_size || 'small'}
                  onChange={(e) => setSalonData({ ...salonData, web_footer_description_font_size: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="small">Piccolo (12px)</option>
                  <option value="medium">Medio (14px)</option>
                  <option value="large">Grande (16px)</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="web_footer_title_bold"
                    checked={salonData.web_footer_title_bold ?? true}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_title_bold: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="web_footer_title_bold">Titoli in Grassetto</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="web_footer_subtitle_bold"
                    checked={salonData.web_footer_subtitle_bold ?? false}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_subtitle_bold: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="web_footer_subtitle_bold">Sottotitoli in Grassetto</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="web_footer_description_bold"
                    checked={salonData.web_footer_description_bold ?? false}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_description_bold: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="web_footer_description_bold">Descrizioni in Grassetto</Label>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_footer_copyright_font_family">Font Copyright</Label>
                <select
                  id="web_footer_copyright_font_family"
                  value={salonData.web_footer_copyright_font_family || 'default'}
                  onChange={(e) => setSalonData({ ...salonData, web_footer_copyright_font_family: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="default">Default (Sans-serif)</option>
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="cursive">Cursive</option>
                  <option value="fantasy">Fantasy</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_footer_copyright_font_size">Dimensione Copyright</Label>
                <select
                  id="web_footer_copyright_font_size"
                  value={salonData.web_footer_copyright_font_size || 'small'}
                  onChange={(e) => setSalonData({ ...salonData, web_footer_copyright_font_size: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="small">Piccolo (12px)</option>
                  <option value="medium">Medio (14px)</option>
                  <option value="large">Grande (16px)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Layout & Spacing */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-gray-900">Layout e Spaziatura</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_footer_layout_style">Stile Layout</Label>
                <select
                  id="web_footer_layout_style"
                  value={salonData.web_footer_layout_style || 'default'}
                  onChange={(e) => setSalonData({ ...salonData, web_footer_layout_style: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="default">Default</option>
                  <option value="compact">Compatto</option>
                  <option value="wide">Largo</option>
                  <option value="centered">Centrato</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_footer_padding_top">Padding Superiore</Label>
                <select
                  id="web_footer_padding_top"
                  value={salonData.web_footer_padding_top || '48px'}
                  onChange={(e) => setSalonData({ ...salonData, web_footer_padding_top: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="24px">Piccolo (24px)</option>
                  <option value="32px">Medio (32px)</option>
                  <option value="48px">Grande (48px)</option>
                  <option value="64px">Extra Large (64px)</option>
                  <option value="80px">2XL (80px)</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_footer_padding_bottom">Padding Inferiore</Label>
                <select
                  id="web_footer_padding_bottom"
                  value={salonData.web_footer_padding_bottom || '24px'}
                  onChange={(e) => setSalonData({ ...salonData, web_footer_padding_bottom: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="16px">Piccolo (16px)</option>
                  <option value="24px">Medio (24px)</option>
                  <option value="32px">Grande (32px)</option>
                  <option value="48px">Extra Large (48px)</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_footer_border_top_width">Spessore Bordo Superiore</Label>
                <select
                  id="web_footer_border_top_width"
                  value={salonData.web_footer_border_top_width || '0px'}
                  onChange={(e) => setSalonData({ ...salonData, web_footer_border_top_width: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="0px">Nessun bordo</option>
                  <option value="1px">Sottile (1px)</option>
                  <option value="2px">Normale (2px)</option>
                  <option value="3px">Spesso (3px)</option>
                  <option value="4px">Molto spesso (4px)</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_footer_border_top_color">Colore Bordo Superiore</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_footer_border_top_color"
                    type="color"
                    value={salonData.web_footer_border_top_color || '#374151'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_border_top_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_footer_border_top_color || '#374151'}
                    onChange={(e) => setSalonData({ ...salonData, web_footer_border_top_color: e.target.value })}
                    placeholder="#374151"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_footer_border_radius">Raggio Bordi</Label>
                <select
                  id="web_footer_border_radius"
                  value={salonData.web_footer_border_radius || '0px'}
                  onChange={(e) => setSalonData({ ...salonData, web_footer_border_radius: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="0px">Nessun raggio</option>
                  <option value="4px">Piccolo (4px)</option>
                  <option value="8px">Medio (8px)</option>
                  <option value="12px">Grande (12px)</option>
                  <option value="16px">Extra Large (16px)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Background Effects */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-gray-900">Effetti Sfondo</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Gradiente Sfondo</Label>
                  <p className="text-sm text-gray-600">Abilita un gradiente di sfondo per il footer</p>
                </div>
                <Switch
                  checked={salonData.web_footer_gradient_enabled || false}
                  onCheckedChange={(checked) => setSalonData({ ...salonData, web_footer_gradient_enabled: checked })}
                />
              </div>
              
              {salonData.web_footer_gradient_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="web_footer_gradient_from_color">Colore Inizio Gradiente</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="web_footer_gradient_from_color"
                        type="color"
                        value={salonData.web_footer_gradient_from_color || '#1f2937'}
                        onChange={(e) => setSalonData({ ...salonData, web_footer_gradient_from_color: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={salonData.web_footer_gradient_from_color || '#1f2937'}
                        onChange={(e) => setSalonData({ ...salonData, web_footer_gradient_from_color: e.target.value })}
                        placeholder="#1f2937"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="web_footer_gradient_to_color">Colore Fine Gradiente</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="web_footer_gradient_to_color"
                        type="color"
                        value={salonData.web_footer_gradient_to_color || '#111827'}
                        onChange={(e) => setSalonData({ ...salonData, web_footer_gradient_to_color: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={salonData.web_footer_gradient_to_color || '#111827'}
                        onChange={(e) => setSalonData({ ...salonData, web_footer_gradient_to_color: e.target.value })}
                        placeholder="#111827"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="web_footer_gradient_direction">Direzione Gradiente</Label>
                    <select
                      id="web_footer_gradient_direction"
                      value={salonData.web_footer_gradient_direction || 'to-br'}
                      onChange={(e) => setSalonData({ ...salonData, web_footer_gradient_direction: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="to-r">Orizzontale</option>
                      <option value="to-b">Verticale</option>
                      <option value="to-br">Diagonale</option>
                      <option value="to-bl">Diagonale Inversa</option>
                      <option value="to-tr">Diagonale Superiore</option>
                      <option value="to-tl">Diagonale Superiore Inversa</option>
                    </select>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Pattern Sfondo</Label>
                  <p className="text-sm text-gray-600">Abilita un pattern di sfondo per il footer</p>
                </div>
                <Switch
                  checked={salonData.web_footer_pattern_enabled || false}
                  onCheckedChange={(checked) => setSalonData({ ...salonData, web_footer_pattern_enabled: checked })}
                />
              </div>
              
              {salonData.web_footer_pattern_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="web_footer_pattern_color">Colore Pattern</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="web_footer_pattern_color"
                        type="color"
                        value={salonData.web_footer_pattern_color || '#ffffff'}
                        onChange={(e) => setSalonData({ ...salonData, web_footer_pattern_color: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={salonData.web_footer_pattern_color || '#ffffff'}
                        onChange={(e) => setSalonData({ ...salonData, web_footer_pattern_color: e.target.value })}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="web_footer_pattern_opacity">Opacità Pattern</Label>
                    <select
                      id="web_footer_pattern_opacity"
                      value={salonData.web_footer_pattern_opacity || '0.05'}
                      onChange={(e) => setSalonData({ ...salonData, web_footer_pattern_opacity: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="0.02">Molto Sottile (0.02)</option>
                      <option value="0.05">Sottile (0.05)</option>
                      <option value="0.1">Normale (0.1)</option>
                      <option value="0.15">Visibile (0.15)</option>
                      <option value="0.2">Opaco (0.2)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Preview */}
          <div className="space-y-2 border-t pt-4">
            <Label>Anteprima Footer</Label>
            <div 
              className="p-4 border border-gray-200 rounded-lg"
              style={{ 
                backgroundColor: salonData.web_footer_gradient_enabled 
                  ? `linear-gradient(${salonData.web_footer_gradient_direction || 'to-br'}, ${salonData.web_footer_gradient_from_color || '#1f2937'}, ${salonData.web_footer_gradient_to_color || '#111827'})`
                  : (salonData.web_footer_background_color || '#1f2937'),
                color: salonData.web_footer_text_color || '#ffffff',
                paddingTop: salonData.web_footer_padding_top || '48px',
                paddingBottom: salonData.web_footer_padding_bottom || '24px',
                borderTopWidth: salonData.web_footer_border_top_width || '0px',
                borderTopStyle: (salonData.web_footer_border_top_style || 'solid') as any,
                borderTopColor: salonData.web_footer_border_top_color || '#374151',
                borderRadius: salonData.web_footer_border_radius || '0px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Pattern Background */}
              {salonData.web_footer_pattern_enabled && (
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: "radial-gradient(circle, rgba(255, 255, 255, 0.8) 1px, transparent 1px)",
                    backgroundSize: `${salonData.web_footer_pattern_size || '20px'} ${salonData.web_footer_pattern_size || '20px'}`,
                    opacity: salonData.web_footer_pattern_opacity || '0.05'
                  }}
                />
              )}
              
              <div className="relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                  {/* Brand */}
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-3 mb-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ 
                          background: `linear-gradient(135deg, ${salonData.web_primary_color || '#6366f1'}, ${salonData.web_secondary_color || '#8b5cf6'})` 
                        }}
                      >
                        <Scissors className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 
                          style={{ 
                            color: salonData.web_footer_title_color || '#ffffff',
                            fontFamily: getFontFamilyValue(salonData.web_footer_title_font_family || 'default'),
                            fontSize: getFontSizeValue(salonData.web_footer_title_font_size || 'large'),
                            fontWeight: salonData.web_footer_title_bold ? 'bold' : 'normal'
                          }}
                        >
                          {salonData.web_title || 'Salone'}
                        </h4>
                        {salonData.web_subtitle && (
                          <p 
                            style={{ 
                              color: salonData.web_footer_subtitle_color || '#9ca3af',
                              fontFamily: getFontFamilyValue(salonData.web_footer_subtitle_font_family || 'default'),
                              fontSize: getSubtitleFontSizeValue(salonData.web_footer_subtitle_font_size || 'medium'),
                              fontWeight: salonData.web_footer_subtitle_bold ? 'bold' : 'normal'
                            }}
                          >
                            {salonData.web_subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    {salonData.web_description && (
                      <p 
                        style={{ 
                          color: salonData.web_footer_description_color || '#9ca3af',
                          fontFamily: getFontFamilyValue(salonData.web_footer_description_font_family || 'default'),
                          fontSize: getDescriptionFontSizeValue(salonData.web_footer_description_font_size || 'small'),
                          fontWeight: salonData.web_footer_description_bold ? 'bold' : 'normal'
                        }}
                        className="mb-4 max-w-md"
                      >
                        {salonData.web_description}
                      </p>
                    )}
                    {(salonData.web_footer_show_social_links ?? true) && (
                      <div className="flex space-x-4">
                        {salonData.web_social_instagram && (
                          <div 
                            className="w-8 h-8 rounded border flex items-center justify-center"
                            style={{ 
                              borderColor: salonData.web_footer_social_icon_color || '#9ca3af',
                              color: salonData.web_footer_social_icon_color || '#9ca3af'
                            }}
                          >
                            <Instagram className="w-4 h-4" />
                          </div>
                        )}
                        {salonData.web_social_facebook && (
                          <div 
                            className="w-8 h-8 rounded border flex items-center justify-center"
                            style={{ 
                              borderColor: salonData.web_footer_social_icon_color || '#9ca3af',
                              color: salonData.web_footer_social_icon_color || '#9ca3af'
                            }}
                          >
                            <Facebook className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Contact Info */}
                  {(salonData.web_footer_show_contact_info ?? true) && (
                    <div>
                      <h5 
                        style={{ 
                          color: salonData.web_footer_title_color || '#ffffff',
                          fontFamily: getFontFamilyValue(salonData.web_footer_title_font_family || 'default'),
                          fontSize: getFontSizeValue(salonData.web_footer_title_font_size || 'large'),
                          fontWeight: salonData.web_footer_title_bold ? 'bold' : 'normal'
                        }}
                        className="mb-4"
                      >
                        Contatti
                      </h5>
                      <ul className="space-y-2 text-sm">
                        {salonData.web_contact_phone && (
                          <li 
                            className="flex items-center space-x-2"
                            style={{ color: salonData.web_footer_link_color || '#9ca3af' }}
                          >
                            <Phone className="w-4 h-4" />
                            <span>{salonData.web_contact_phone}</span>
                          </li>
                        )}
                        {salonData.web_contact_email && (
                          <li 
                            className="flex items-center space-x-2"
                            style={{ color: salonData.web_footer_link_color || '#9ca3af' }}
                          >
                            <Mail className="w-4 h-4" />
                            <span>{salonData.web_contact_email}</span>
                          </li>
                        )}
                        {salonData.web_address && (
                          <li 
                            className="flex items-center space-x-2"
                            style={{ color: salonData.web_footer_link_color || '#9ca3af' }}
                          >
                            <MapPin className="w-4 h-4" />
                            <span>{salonData.web_address}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                
                {(salonData.web_footer_show_copyright ?? true) && (
                  <div 
                    className="border-t pt-8 flex flex-col md:flex-row justify-between items-center"
                    style={{ borderColor: salonData.web_footer_border_color || '#374151' }}
                  >
                    <p 
                      style={{ 
                        color: salonData.web_footer_copyright_color || '#9ca3af',
                        fontFamily: getFontFamilyValue(salonData.web_footer_copyright_font_family || 'default'),
                        fontSize: getStudioTextFontSizeValue(salonData.web_footer_copyright_font_size || 'small')
                      }}
                      className="text-sm"
                    >
                      {(salonData.web_footer_copyright_text || '© 2024 {salon_name}. Tutti i diritti riservati.').replace('{salon_name}', salonData.web_title || 'Salone')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
            </div>
          )}

          {footerStyleTab === 'templates' && (
            <FooterTemplates 
              salonData={salonData}
              saving={saving}
              onTemplateApply={onTemplateApply}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stile Pulsanti</CardTitle>
          <CardDescription>
            Personalizza l'aspetto e il comportamento dei pulsanti nella pagina web
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configurazione Pulsanti */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Configurazione Pulsanti</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_button_type">Tipo di Pulsanti</Label>
                <select
                  id="web_button_type"
                  value={salonData.web_button_type || 'primary-secondary'}
                  onChange={(e) => setSalonData({ ...salonData, web_button_type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                                   <option value="single">Pulsante Singolo</option>
                 <option value="primary-secondary">Primario + Secondario</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_button_quantity">Numero di Pulsanti</Label>
                <select
                  id="web_button_quantity"
                  value={salonData.web_button_quantity || 2}
                  onChange={(e) => setSalonData({ ...salonData, web_button_quantity: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                                   <option value={1}>1 Pulsante</option>
                 <option value={2}>2 Pulsanti</option>
                </select>
              </div>
            </div>
          </div>

          {/* Testo Pulsanti */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Testo Pulsanti</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_button_primary_text">Testo Pulsante Primario</Label>
                <Input
                  id="web_button_primary_text"
                  value={salonData.web_button_primary_text || 'Prenota Ora'}
                  onChange={(e) => setSalonData({ ...salonData, web_button_primary_text: e.target.value })}
                  placeholder="Prenota Ora"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_button_secondary_text">Testo Pulsante Secondario</Label>
                <Input
                  id="web_button_secondary_text"
                  value={salonData.web_button_secondary_text || 'Contattaci'}
                  onChange={(e) => setSalonData({ ...salonData, web_button_secondary_text: e.target.value })}
                  placeholder="Contattaci"
                />
              </div>
            </div>
          </div>

          {/* Stile Pulsanti */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Stile Pulsanti</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_button_size">Dimensione</Label>
                <select
                  id="web_button_size"
                  value={salonData.web_button_size || 'medium'}
                  onChange={(e) => setSalonData({ ...salonData, web_button_size: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="small">Piccolo</option>
                  <option value="medium">Medio</option>
                  <option value="large">Grande</option>
                  <option value="xl">Extra Large</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_button_border_radius">Arrotondamento</Label>
                <select
                  id="web_button_border_radius"
                  value={salonData.web_button_border_radius || 'medium'}
                  onChange={(e) => setSalonData({ ...salonData, web_button_border_radius: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="none">Nessuno</option>
                  <option value="small">Piccolo</option>
                  <option value="medium">Medio</option>
                  <option value="large">Grande</option>
                  <option value="full">Completo</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Pulsanti Trasparenti</Label>
                  <p className="text-sm text-gray-600">Rendi i pulsanti trasparenti con solo il contorno</p>
                </div>
                <Switch
                  checked={salonData.web_button_transparent || false}
                  onCheckedChange={(checked) => setSalonData({ ...salonData, web_button_transparent: checked })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_button_color">Colore di Sfondo</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_button_color"
                    type="color"
                    value={salonData.web_button_color || '#6366f1'}
                    onChange={(e) => setSalonData({ ...salonData, web_button_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_button_color || '#6366f1'}
                    onChange={(e) => setSalonData({ ...salonData, web_button_color: e.target.value })}
                    placeholder="#6366f1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_button_border_color">Colore Contorno</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_button_border_color"
                    type="color"
                    value={salonData.web_button_border_color || '#6366f1'}
                    onChange={(e) => setSalonData({ ...salonData, web_button_border_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={salonData.web_button_border_color || '#6366f1'}
                    onChange={(e) => setSalonData({ ...salonData, web_button_border_color: e.target.value })}
                    placeholder="#6366f1"
                  />
                </div>
              </div>
            </div>
            
                         <div className="space-y-2">
               <Label htmlFor="web_button_border_width">Spessore Contorno</Label>
               <select
                 id="web_button_border_width"
                 value={salonData.web_button_border_width || '1px'}
                 onChange={(e) => setSalonData({ ...salonData, web_button_border_width: e.target.value })}
                 className="w-full p-2 border border-gray-300 rounded-lg"
               >
                 <option value="0px">Nessun contorno</option>
                 <option value="1px">Sottile (1px)</option>
                 <option value="2px">Medio (2px)</option>
                 <option value="3px">Spesso (3px)</option>
                 <option value="4px">Molto spesso (4px)</option>
               </select>
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="web_button_text_color">Colore Testo</Label>
               <div className="flex items-center space-x-2">
                 <Input
                   id="web_button_text_color"
                   type="color"
                   value={salonData.web_button_text_color || '#ffffff'}
                   onChange={(e) => setSalonData({ ...salonData, web_button_text_color: e.target.value })}
                   className="w-16 h-10 p-1"
                 />
                 <Input
                   value={salonData.web_button_text_color || '#ffffff'}
                   onChange={(e) => setSalonData({ ...salonData, web_button_text_color: e.target.value })}
                   placeholder="#ffffff"
                 />
               </div>
             </div>
          </div>

          {/* Configurazione Azioni Pulsanti */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Azioni Pulsanti Hero</h4>
            <p className="text-sm text-gray-600">
              Scegli cosa devono fare i pulsanti quando vengono cliccati
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="web_hero_button_1_action">Azione Pulsante 1</Label>
                <select
                  id="web_hero_button_1_action"
                  value={salonData.web_hero_button_1_action || 'booking'}
                  onChange={(e) => setSalonData({ ...salonData, web_hero_button_1_action: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="booking">Prenotazione Appuntamento</option>
                  <option value="contact">Contattaci</option>
                  <option value="phone">Chiama Ora</option>
                  <option value="hours">I Nostri Orari</option>
                  <option value="map">Mappa</option>
                </select>
                <p className="text-xs text-gray-500">
                  {salonData.web_hero_button_1_action === 'phone' && salonData.web_contact_phone 
                    ? `Chiamerà: ${salonData.web_contact_phone}`
                    : salonData.web_hero_button_1_action === 'phone' && !salonData.web_contact_phone
                    ? 'Attenzione: Nessun numero di telefono configurato'
                    : `Scrollerà alla sezione: ${salonData.web_hero_button_1_action === 'booking' ? 'Prenotazione' : 
                       salonData.web_hero_button_1_action === 'contact' ? 'Contatti' :
                       salonData.web_hero_button_1_action === 'hours' ? 'Orari di Apertura' : 'Mappa'}`
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_hero_button_2_action">Azione Pulsante 2</Label>
                <select
                  id="web_hero_button_2_action"
                  value={salonData.web_hero_button_2_action || 'contact'}
                  onChange={(e) => setSalonData({ ...salonData, web_hero_button_2_action: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="booking">Prenotazione Appuntamento</option>
                  <option value="contact">Contattaci</option>
                  <option value="phone">Chiama Ora</option>
                  <option value="hours">I Nostri Orari</option>
                  <option value="map">Mappa</option>
                </select>
                <p className="text-xs text-gray-500">
                  {salonData.web_hero_button_2_action === 'phone' && salonData.web_contact_phone 
                    ? `Chiamerà: ${salonData.web_contact_phone}`
                    : salonData.web_hero_button_2_action === 'phone' && !salonData.web_contact_phone
                    ? 'Attenzione: Nessun numero di telefono configurato'
                    : `Scrollerà alla sezione: ${salonData.web_hero_button_2_action === 'booking' ? 'Prenotazione' : 
                       salonData.web_hero_button_2_action === 'contact' ? 'Contatti' :
                       salonData.web_hero_button_2_action === 'hours' ? 'Orari di Apertura' : 'Mappa'}`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Anteprima Pulsanti */}
          <div className="space-y-2">
            <Label>Anteprima Pulsanti</Label>
            <div className="p-4 border border-gray-200 rounded-lg bg-white">
              <div className="flex flex-wrap gap-4">
                {Array.from({ length: salonData.web_button_quantity || 2 }).map((_, index) => {
                  const buttonColor = salonData.web_button_color || '#6366f1'
                  const textColor = salonData.web_button_text_color || getContrastTextColor(buttonColor)
                  const isTransparent = salonData.web_button_transparent || false
                  
                  return (
                    <button
                      key={index}
                      style={{
                        backgroundColor: isTransparent ? 'transparent' : buttonColor,
                        borderColor: salonData.web_button_border_color || (isTransparent ? '#6366f1' : '#6366f1'),
                        borderWidth: salonData.web_button_border_width || (isTransparent ? '2px' : '1px'),
                        borderRadius: getButtonBorderRadius(salonData.web_button_border_radius || 'medium'),
                        padding: getButtonPadding(salonData.web_button_size || 'medium'),
                        fontSize: getButtonFontSize(salonData.web_button_size || 'medium'),
                        color: isTransparent ? (salonData.web_button_text_color || '#6366f1') : textColor,
                        borderStyle: 'solid'
                      }}
                      className="font-medium transition-all duration-200 hover:opacity-80"
                    >
                      {index === 0 
                        ? (salonData.web_button_primary_text || 'Prenota Ora')
                        : index === 1 
                          ? (salonData.web_button_secondary_text || 'Contattaci')
                          : `Pulsante ${index + 1}`
                      }
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 text-xs text-gray-500">
                <p><strong>Pulsante 1:</strong> {salonData.web_hero_button_1_action === 'booking' ? 'Prenotazione Appuntamento' : 
                   salonData.web_hero_button_1_action === 'contact' ? 'Contattaci' :
                   salonData.web_hero_button_1_action === 'phone' ? 'Chiama Ora' :
                   salonData.web_hero_button_1_action === 'hours' ? 'I Nostri Orari' : 'Mappa'}</p>
                <p><strong>Pulsante 2:</strong> {salonData.web_hero_button_2_action === 'booking' ? 'Prenotazione Appuntamento' : 
                   salonData.web_hero_button_2_action === 'contact' ? 'Contattaci' :
                   salonData.web_hero_button_2_action === 'phone' ? 'Chiama Ora' :
                   salonData.web_hero_button_2_action === 'hours' ? 'I Nostri Orari' : 'Mappa'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Design SubSection Component
function DesignSubSection({ 
  subSectionId,
  salonData, 
  setSalonData 
}: { 
  subSectionId: string
  salonData: SalonWebSettings
  setSalonData: (data: SalonWebSettings) => void 
}) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Design - {subSectionId}</h3>
        <p className="text-gray-600">
          Questa sezione sarà implementata prossimamente.
        </p>
      </CardContent>
    </Card>
  )
}

// Layout SubSection Component
function LayoutSubSection({ 
  subSectionId,
  salonData, 
  setSalonData 
}: { 
  subSectionId: string
  salonData: SalonWebSettings
  setSalonData: (data: SalonWebSettings) => void 
}) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Layout className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Layout - {subSectionId}</h3>
        <p className="text-gray-600">
          Questa sezione sarà implementata prossimamente.
        </p>
      </CardContent>
    </Card>
  )
}

// Media SubSection Component
function MediaSubSection({ 
  subSectionId,
  salonData, 
  setSalonData 
}: { 
  subSectionId: string
  salonData: SalonWebSettings
  setSalonData: (data: SalonWebSettings) => void 
}) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Media - {subSectionId}</h3>
        <p className="text-gray-600">
          Questa sezione sarà implementata prossimamente.
        </p>
      </CardContent>
    </Card>
  )
}

// Advanced SubSection Component
function AdvancedSubSection({ 
  subSectionId,
  salonData, 
  setSalonData 
}: { 
  subSectionId: string
  salonData: SalonWebSettings
  setSalonData: (data: SalonWebSettings) => void 
}) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Avanzato - {subSectionId}</h3>
        <p className="text-gray-600">
          Questa sezione sarà implementata prossimamente.
        </p>
      </CardContent>
    </Card>
  )
}

// Design Tab Component
function DesignTab({ 
  salonData, 
  setSalonData 
}: { 
  salonData: SalonWebSettings
  setSalonData: (data: SalonWebSettings) => void 
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Colori</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="web_primary_color">Colore Primario</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="web_primary_color"
                  type="color"
                  value={salonData.web_primary_color || '#6366f1'}
                  onChange={(e) => setSalonData({ ...salonData, web_primary_color: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={salonData.web_primary_color || '#6366f1'}
                  onChange={(e) => setSalonData({ ...salonData, web_primary_color: e.target.value })}
                  placeholder="#6366f1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="web_secondary_color">Colore Secondario</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="web_secondary_color"
                  type="color"
                  value={salonData.web_secondary_color || '#8b5cf6'}
                  onChange={(e) => setSalonData({ ...salonData, web_secondary_color: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={salonData.web_secondary_color || '#8b5cf6'}
                  onChange={(e) => setSalonData({ ...salonData, web_secondary_color: e.target.value })}
                  placeholder="#8b5cf6"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipografia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="web_custom_font">Font Personalizzato</Label>
              <select
                id="web_custom_font"
                value={salonData.web_custom_font || 'default'}
                onChange={(e) => setSalonData({ ...salonData, web_custom_font: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="default">Default</option>
                <option value="serif">Serif</option>
                <option value="sans-serif">Sans Serif</option>
                <option value="monospace">Monospace</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="web_font_size">Dimensione Font</Label>
              <select
                id="web_font_size"
                value={salonData.web_font_size || 'medium'}
                onChange={(e) => setSalonData({ ...salonData, web_font_size: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="small">Piccolo</option>
                <option value="medium">Medio</option>
                <option value="large">Grande</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="web_line_height">Altezza Riga</Label>
              <select
                id="web_line_height"
                value={salonData.web_line_height || 'normal'}
                onChange={(e) => setSalonData({ ...salonData, web_line_height: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="tight">Compatto</option>
                <option value="normal">Normale</option>
                <option value="relaxed">Rilassato</option>
                <option value="loose">Spazioso</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="web_spacing">Spaziatura</Label>
              <select
                id="web_spacing"
                value={salonData.web_spacing || 'normal'}
                onChange={(e) => setSalonData({ ...salonData, web_spacing: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="tight">Compatta</option>
                <option value="normal">Normale</option>
                <option value="relaxed">Rilassata</option>
                <option value="loose">Spaziosa</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="web_border_radius">Raggio Bordi</Label>
              <select
                id="web_border_radius"
                value={salonData.web_border_radius || 'medium'}
                onChange={(e) => setSalonData({ ...salonData, web_border_radius: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="none">Nessuno</option>
                <option value="small">Piccolo</option>
                <option value="medium">Medio</option>
                <option value="large">Grande</option>
                <option value="full">Completo</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="web_shadow_style">Stile Ombra</Label>
              <select
                id="web_shadow_style"
                value={salonData.web_shadow_style || 'medium'}
                onChange={(e) => setSalonData({ ...salonData, web_shadow_style: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="none">Nessuna</option>
                <option value="small">Piccola</option>
                <option value="medium">Media</option>
                <option value="large">Grande</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="web_transition_speed">Velocità Transizioni</Label>
            <select
              id="web_transition_speed"
              value={salonData.web_transition_speed || 'normal'}
              onChange={(e) => setSalonData({ ...salonData, web_transition_speed: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="fast">Veloce</option>
              <option value="normal">Normale</option>
              <option value="slow">Lenta</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Layout Tab Component
function LayoutTab({ 
  salonData, 
  setSalonData 
}: { 
  salonData: SalonWebSettings
  setSalonData: (data: SalonWebSettings) => void 
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sezioni Visibili</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Galleria</Label>
              <p className="text-sm text-gray-600">Mostra la galleria fotografica</p>
            </div>
            <Switch
              checked={salonData.web_gallery_visible}
              onCheckedChange={(checked) => setSalonData({ ...salonData, web_gallery_visible: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Carousel</Label>
              <p className="text-sm text-gray-600">Mostra il carousel di immagini</p>
            </div>
            <Switch
              checked={salonData.web_carousel_visible ?? true}
              onCheckedChange={(checked) => setSalonData({ ...salonData, web_carousel_visible: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Form Contatto</Label>
              <p className="text-sm text-gray-600">Mostra il form di contatto</p>
            </div>
            <Switch
              checked={salonData.web_contact_form_enabled}
              onCheckedChange={(checked) => setSalonData({ ...salonData, web_contact_form_enabled: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Prenotazioni</Label>
              <p className="text-sm text-gray-600">Abilita le prenotazioni online</p>
            </div>
            <Switch
              checked={salonData.web_booking_enabled}
              onCheckedChange={(checked) => setSalonData({ ...salonData, web_booking_enabled: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Mappa</Label>
              <p className="text-sm text-gray-600">Mostra la sezione mappa con la posizione del salone</p>
            </div>
            <Switch
              checked={salonData.web_map_visible ?? false}
              onCheckedChange={(checked) => setSalonData({ ...salonData, web_map_visible: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Orari di Apertura</Label>
              <p className="text-sm text-gray-600">Mostra la sezione orari di apertura prima della mappa</p>
            </div>
            <Switch
              checked={salonData.web_opening_hours_visible ?? true}
              onCheckedChange={(checked) => setSalonData({ ...salonData, web_opening_hours_visible: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Effetto Parallax</CardTitle>
          <CardDescription>
            Configura l'effetto parallax per creare profondità visiva
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Abilita Parallax</Label>
              <p className="text-sm text-gray-600">Attiva l'effetto parallax con immagini di sfondo</p>
            </div>
            <Switch
              checked={salonData.web_parallax_enabled || false}
              onCheckedChange={(checked) => setSalonData({ ...salonData, web_parallax_enabled: checked })}
            />
          </div>
          
          {salonData.web_parallax_enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="web_parallax_image">Immagine di Sfondo Parallax</Label>
                <Input
                  id="web_parallax_image"
                  value={salonData.web_parallax_image || ''}
                  onChange={(e) => setSalonData({ ...salonData, web_parallax_image: e.target.value })}
                  placeholder="https://example.com/parallax-background.jpg"
                />
                <p className="text-xs text-gray-500">
                  Inserisci l'URL di un'immagine di alta qualità per l'effetto parallax
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="web_parallax_speed">Velocità Parallax</Label>
                  <select
                    id="web_parallax_speed"
                    value={salonData.web_parallax_speed || 0.5}
                    onChange={(e) => setSalonData({ ...salonData, web_parallax_speed: parseFloat(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value={0.1}>Molto Lenta (0.1)</option>
                    <option value={0.3}>Lenta (0.3)</option>
                    <option value={0.5}>Normale (0.5)</option>
                    <option value={0.7}>Veloce (0.7)</option>
                    <option value={0.9}>Molto Veloce (0.9)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="web_parallax_opacity">Opacità Immagine</Label>
                  <select
                    id="web_parallax_opacity"
                    value={salonData.web_parallax_opacity || 0.3}
                    onChange={(e) => setSalonData({ ...salonData, web_parallax_opacity: parseFloat(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value={0.1}>Molto Trasparente (0.1)</option>
                    <option value={0.2}>Trasparente (0.2)</option>
                    <option value={0.3}>Normale (0.3)</option>
                    <option value={0.5}>Visibile (0.5)</option>
                    <option value={0.7}>Opaco (0.7)</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Sezioni con Parallax</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['hero', 'services', 'team', 'gallery', 'map'].map((section) => (
                    <div key={section} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`parallax-${section}`}
                        checked={salonData.web_parallax_sections?.includes(section) || false}
                        onChange={(e) => {
                          const currentSections = salonData.web_parallax_sections || []
                          const newSections = e.target.checked
                            ? [...currentSections, section]
                            : currentSections.filter(s => s !== section)
                          setSalonData({ ...salonData, web_parallax_sections: newSections })
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`parallax-${section}`} className="text-sm capitalize">
                        {section === 'hero' ? 'Hero' : 
                         section === 'services' ? 'Servizi' :
                         section === 'team' ? 'Team' : 
                         section === 'gallery' ? 'Galleria' : 'Mappa'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Preview */}
              <div className="space-y-2">
                <Label>Anteprima Effetto</Label>
                <div className="p-4 border border-gray-200 rounded-lg bg-white">
                  <div className="relative h-32 overflow-hidden rounded-lg">
                    {salonData.web_parallax_image ? (
                      <div
                        className="absolute inset-0 w-full h-full"
                        style={{
                          backgroundImage: `url(${salonData.web_parallax_image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          opacity: salonData.web_parallax_opacity || 0.3
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">Nessuna immagine selezionata</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <span className="text-white font-medium">Anteprima Parallax</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    L'effetto parallax creerà profondità visiva durante lo scroll
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>


    </div>
  )
}

// Media Tab Component
function MediaTab({ 
  salonData, 
  setSalonData 
}: { 
  salonData: SalonWebSettings
  setSalonData: (data: SalonWebSettings) => void 
}) {
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false)

  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !salonData) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setUploadingProfilePhoto(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `profile-photo-${salonData.salon_id}-${Date.now()}.${fileExt}`
      const filePath = `salon-profiles/${salonData.salon_id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('salon-assets')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('salon-assets')
        .getPublicUrl(filePath)

      // Update salon data
      setSalonData({ ...salonData, web_profile_photo_url: publicUrl })
    } catch (error) {
      console.error('Error uploading profile photo:', error)
      alert('Error uploading image. Please try again.')
    } finally {
      setUploadingProfilePhoto(false)
    }
  }

  const removeProfilePhoto = () => {
    setSalonData({ ...salonData, web_profile_photo_url: null })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="web_logo_url">URL Logo</Label>
            <Input
              id="web_logo_url"
              value={salonData.web_logo_url || ''}
              onChange={(e) => setSalonData({ ...salonData, web_logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Foto Profilo</CardTitle>
          <CardDescription>
            Aggiungi una foto profilo che apparirà sotto il titolo nella galleria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {salonData.web_profile_photo_url ? (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={salonData.web_profile_photo_url}
                  alt="Profile Photo"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={removeProfilePhoto}
                  className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Foto profilo caricata. Clicca sulla X per rimuoverla.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Carica una foto profilo
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Formati supportati: JPG, PNG, GIF. Dimensione massima: 5MB
                </p>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('profile-photo-upload')?.click()}
                  disabled={uploadingProfilePhoto}
                >
                  {uploadingProfilePhoto ? 'Caricamento...' : 'Seleziona Immagine'}
                </Button>
                <input
                  id="profile-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carousel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {salonData.web_carousel_visible && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Autoplay</Label>
                  <p className="text-sm text-gray-600">Cambia automaticamente le immagini</p>
                </div>
                <Switch
                  checked={salonData.web_carousel_autoplay || true}
                  onCheckedChange={(checked) => setSalonData({ ...salonData, web_carousel_autoplay: checked })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="web_carousel_speed">Velocità (ms)</Label>
                <Input
                  id="web_carousel_speed"
                  type="number"
                  value={salonData.web_carousel_speed || 3000}
                  onChange={(e) => setSalonData({ ...salonData, web_carousel_speed: parseInt(e.target.value) || 3000 })}
                  min="1000"
                  max="10000"
                  step="500"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Galleria Orizzontale</CardTitle>
          <CardDescription>
            Configura la galleria di foto che apparirà sotto la sezione hero
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          
          <div className="flex items-center justify-between">
            <div>
              <Label>Galleria a Larghezza Completa</Label>
              <p className="text-sm text-gray-600">Estendi la galleria a tutta la larghezza dello schermo</p>
            </div>
            <Switch
              checked={salonData.web_gallery_full_width || false}
              onCheckedChange={(checked) => setSalonData({ ...salonData, web_gallery_full_width: checked })}
            />
          </div>
      
          {salonData.web_carousel_visible && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mostra Titolo Galleria</Label>
                    <p className="text-sm text-gray-600">Abilita o disabilita il testo del titolo</p>
                  </div>
                  <Switch
                    checked={salonData.web_gallery_title_enabled ?? true}
                    onCheckedChange={(checked) => setSalonData({ ...salonData, web_gallery_title_enabled: checked })}
                  />
                </div>
                  
                  {(salonData.web_gallery_title_enabled ?? true) && (
                    <div className="space-y-2">
                      <Label htmlFor="web_gallery_title">Titolo Galleria</Label>
                      <Input
                        id="web_gallery_title"
                        value={salonData.web_gallery_title || 'La Nostra Galleria'}
                        onChange={(e) => setSalonData({ ...salonData, web_gallery_title: e.target.value })}
                        placeholder="La Nostra Galleria"
                      />
                    </div>
                  )}
                  
                  
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Immagini Galleria</h4>
                  <p className="text-sm text-gray-600">
                    Aggiungi fino a 8 immagini per la galleria orizzontale. Le immagini devono essere URL valide.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                      <div key={index} className="space-y-2">
                        <Label htmlFor={`web_gallery_image_${index}`}>Immagine {index}</Label>
                        <Input
                          id={`web_gallery_image_${index}`}
                          value={salonData[`web_gallery_image_${index}` as keyof SalonWebSettings] as string || ''}
                          onChange={(e) => setSalonData({ 
                            ...salonData, 
                            [`web_gallery_image_${index}`]: e.target.value 
                          })}
                          placeholder={`https://example.com/image${index}.jpg`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Preview Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Anteprima Layout</h4>
                  <div className="p-4 border border-gray-200 rounded-lg bg-white">
                    <div className={`${salonData.web_gallery_full_width ? 'w-full' : 'max-w-4xl mx-auto'}`}>
                      <div className="text-center mb-4">
                        <h5 className="font-medium text-gray-900">Galleria {salonData.web_gallery_full_width ? 'a Larghezza Completa' : 'Contenuta'}</h5>
                        <p className="text-sm text-gray-600">
                          {salonData.web_gallery_full_width 
                            ? 'La galleria si estenderà a tutta la larghezza dello schermo con più immagini visibili'
                            : 'La galleria sarà contenuta nel layout principale con meno immagini visibili'
                          }
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((index) => (
                          <div 
                            key={index}
                            className={`${salonData.web_gallery_full_width ? 'h-16' : 'h-20'} bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center`}
                          >
                            <span className="text-xs text-gray-500">Img {index}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

// Page Activation Component
function PageActivationTab({ 
  salonData, 
  setSalonData,
  saving,
  onSave
}: { 
  salonData: SalonWebSettings
  setSalonData: (data: SalonWebSettings) => void
  saving: boolean
  onSave: () => void
}) {
  const [generatingSubdomain, setGeneratingSubdomain] = useState(false)

  const generateSubdomain = async () => {
    setGeneratingSubdomain(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.rpc('enable_salon_web_page', {
        p_user_id: user.id,
        p_salon_id: salonData.salon_id,
        p_web_title: salonData.web_title,
        p_web_description: salonData.web_description
      })

      if (error) {
        console.error('Error generating subdomain:', error)
        return
      }

      if (data?.success && data?.subdomain) {
        setSalonData({
          ...salonData,
          web_enabled: true,
          web_subdomain: data.subdomain
        })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setGeneratingSubdomain(false)
    }
  }

  const disablePage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.rpc('disable_salon_web_page', {
        p_user_id: user.id,
        p_salon_id: salonData.salon_id
      })

      if (error) {
        console.error('Error disabling page:', error)
        return
      }

      if (data?.success) {
        setSalonData({
          ...salonData,
          web_enabled: false
        })
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stato Pagina Web</CardTitle>
          <CardDescription>
            Attiva o disattiva la tua pagina web e gestisci il subdomain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Page Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${salonData.web_enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {salonData.web_enabled ? 'Pagina Attiva' : 'Pagina Inattiva'}
                </h3>
                <p className="text-sm text-gray-600">
                  {salonData.web_enabled 
                    ? 'La tua pagina web è accessibile online'
                    : 'La tua pagina web non è ancora attiva'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={salonData.web_enabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  generateSubdomain()
                } else {
                  disablePage()
                }
              }}
              disabled={generatingSubdomain}
            />
          </div>

          {/* Subdomain Section */}
          {salonData.web_enabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="web_subdomain">Subdomain della Pagina</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="web_subdomain"
                    value={salonData.web_subdomain || ''}
                    onChange={(e) => setSalonData({ ...salonData, web_subdomain: e.target.value })}
                    placeholder="nome-salone"
                    className="flex-1"
                  />
                  <span className="text-gray-500">.zugflow.com</span>
                </div>
                <p className="text-xs text-gray-500">
                  Il subdomain è generato automaticamente dal nome del salone
                </p>
              </div>

              {/* Page URL */}
              {salonData.web_subdomain && (
                <div className="space-y-2">
                  <Label>URL della Pagina</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={`https://${salonData.web_subdomain}.zugflow.com`}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      onClick={() => window.open(`https://${salonData.web_subdomain}.zugflow.com`, '_blank')}
                      variant="outline"
                      size="sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Regenerate Subdomain */}
              <div className="space-y-2">
                <Button
                  onClick={generateSubdomain}
                  disabled={generatingSubdomain}
                  variant="outline"
                  className="w-full"
                >
                  {generatingSubdomain ? 'Generando...' : 'Rigenera Subdomain'}
                </Button>
                <p className="text-xs text-gray-500">
                  Genera un nuovo subdomain se quello attuale non ti piace
                </p>
              </div>
            </div>
          )}

          {/* Requirements */}
          {!salonData.web_enabled && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Per attivare la pagina web:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Inserisci il nome del salone nelle Informazioni Generali</li>
                <li>• Aggiungi una descrizione del salone</li>
                <li>• Configura almeno i contatti principali</li>
                <li>• Clicca su "Attiva Pagina" quando sei pronto</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Advanced Tab Component
function AdvancedTab({ 
  salonData, 
  setSalonData 
}: { 
  salonData: SalonWebSettings
  setSalonData: (data: SalonWebSettings) => void 
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="web_meta_title">Meta Title</Label>
            <Input
              id="web_meta_title"
              value={salonData.web_meta_title || ''}
              onChange={(e) => setSalonData({ ...salonData, web_meta_title: e.target.value })}
              placeholder="Titolo per i motori di ricerca"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="web_meta_description">Meta Description</Label>
            <Textarea
              id="web_meta_description"
              value={salonData.web_meta_description || ''}
              onChange={(e) => setSalonData({ ...salonData, web_meta_description: e.target.value })}
              placeholder="Descrizione per i motori di ricerca"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="web_meta_keywords">Meta Keywords</Label>
            <Input
              id="web_meta_keywords"
              value={salonData.web_meta_keywords || ''}
              onChange={(e) => setSalonData({ ...salonData, web_meta_keywords: e.target.value })}
              placeholder="parrucchiere, bellezza, milano"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSS Personalizzato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="web_custom_css">CSS</Label>
            <Textarea
              id="web_custom_css"
              value={salonData.web_custom_css || ''}
              onChange={(e) => setSalonData({ ...salonData, web_custom_css: e.target.value })}
              placeholder="/* Il tuo CSS personalizzato */"
              rows={8}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>JavaScript Personalizzato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="web_custom_js">JavaScript</Label>
            <Textarea
              id="web_custom_js"
              value={salonData.web_custom_js || ''}
              onChange={(e) => setSalonData({ ...salonData, web_custom_js: e.target.value })}
              placeholder="// Il tuo JavaScript personalizzato"
              rows={8}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
