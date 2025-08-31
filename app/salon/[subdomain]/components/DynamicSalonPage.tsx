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
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Scissors, 
  Instagram, 
  Facebook, 
  MessageCircle,
  Globe,
  ImageIcon,
  Sparkles,
  Heart,
  Gift,
  Star
} from 'lucide-react'
import OnlineBookingForm from '@/app/salon/[subdomain]/booking/OnlineBookingForm'
import { useParallaxBackground } from '@/hooks/useParallax'
import { Send, Loader2, CheckCircle, XCircle } from 'lucide-react'

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// Import required modules
import { Navigation, Pagination, Autoplay } from 'swiper/modules'

// Import Leaflet components
import dynamic from 'next/dynamic'

// Dynamically import the Map component to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-2"></div>
        <p className="text-gray-600 text-sm">Caricamento mappa...</p>
      </div>
    </div>
  )
})

const supabase = createClient()

// Helper functions for font styling
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
    case '5xl': return 'text-5xl'
    case '6xl': return 'text-6xl'
    case '7xl': return 'text-7xl'
    case '8xl': return 'text-8xl'
    case '9xl': return 'text-9xl'
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
    case 'sans': return 'font-sans'
    case 'default': return 'font-sans'
    case 'inter': return 'font-sans'
    case 'poppins': return 'font-sans'
    case 'roboto': return 'font-sans'
    case 'open-sans': return 'font-sans'
    case 'lato': return 'font-sans'
    case 'montserrat': return 'font-sans'
    case 'raleway': return 'font-sans'
    case 'nunito': return 'font-sans'
    case 'source-sans-pro': return 'font-sans'
    case 'ubuntu': return 'font-sans'
    case 'playfair-display': return 'font-serif'
    case 'merriweather': return 'font-serif'
    case 'lora': return 'font-serif'
    case 'crimson-text': return 'font-serif'
    case 'georgia': return 'font-serif'
    case 'times-new-roman': return 'font-serif'
    case 'courier-new': return 'font-mono'
    case 'consolas': return 'font-mono'
    case 'monaco': return 'font-mono'
    case 'menlo': return 'font-mono'
    default: return 'font-sans'
  }
}

const getFontWeightClass = (bold: boolean): string => {
  return bold ? 'font-bold' : 'font-normal'
}

// Contact Form Component
interface ContactFormProps {
  salonSubdomain: string;
}

function ContactForm({ salonSubdomain }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.message) {
      setSubmitStatus('error');
      setSubmitMessage('Compila tutti i campi obbligatori');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          salonSubdomain
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setSubmitMessage('Messaggio inviato con successo! Ti risponderemo al più presto.');
        setFormData({ name: '', phone: '', email: '', message: '' });
      } else {
        setSubmitStatus('error');
        setSubmitMessage(result.error || 'Errore nell\'invio del messaggio');
      }
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage('Errore di connessione. Riprova più tardi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-white font-medium">Nome e Cognome *</Label>
          <Input 
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Il tuo nome completo" 
            className="mt-1 bg-white/90 border-0" 
            required
          />
        </div>
        <div>
          <Label htmlFor="phone" className="text-white font-medium">Telefono/WhatsApp *</Label>
          <Input 
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+39 123 456 7890" 
            className="mt-1 bg-white/90 border-0" 
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="email" className="text-white font-medium">Email</Label>
        <Input 
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="la-tua-email@example.com" 
          className="mt-1 bg-white/90 border-0" 
        />
      </div>
      
      <div>
        <Label htmlFor="message" className="text-white font-medium">Messaggio</Label>
        <Textarea 
          id="message"
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          placeholder="Raccontaci le tue esigenze..." 
          className="mt-1 bg-white/90 border-0"
          rows={4}
          required
        />
      </div>

      {/* Status Message */}
      {submitStatus !== 'idle' && (
        <div className={`p-3 rounded-lg flex items-center space-x-2 ${
          submitStatus === 'success' 
            ? 'bg-green-500/20 border border-green-500/30' 
            : 'bg-red-500/20 border border-red-500/30'
        }`}>
          {submitStatus === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
          <span className="text-sm text-white">{submitMessage}</span>
        </div>
      )}
      
      <Button 
        type="submit"
        size="lg" 
        variant="secondary" 
        className="w-full text-lg py-4 bg-white shadow-xl font-bold text-black" 
        disabled={isSubmitting}
        style={{
          borderRadius: '12px',
          borderColor: '#ffffff',
          borderWidth: '0px',
          borderStyle: 'solid',
          backgroundColor: '#ffffff',
          color: '#000000'
        }}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Invio in corso...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Invia Messaggio
          </>
        )}
      </Button>
    </form>
  );
}

interface SalonWebSettings {
  salon_id: string
  web_enabled: boolean
  web_subdomain: string | null
  web_title: string | null
  web_subtitle: string | null
  web_description: string | null
  web_primary_color: string | null
  web_secondary_color: string | null
  web_title_color: string | null
  web_subtitle_color: string | null
  web_text_color: string | null
  web_salon_name_color: string | null
  web_right_section_enabled: boolean | null
  web_studio_text: string | null
  web_layout_type: string | null
  web_salon_name_font_size: string | null
  web_subtitle_font_size: string | null
  web_title_font_family: string | null
  web_subtitle_font_family: string | null
  web_description_color: string | null
  web_description_font_family: string | null
  web_studio_text_font_size: string | null
  web_description_font_size: string | null
  web_title_bold: boolean | null
  web_subtitle_bold: boolean | null
  web_description_bold: boolean | null
  web_studio_text_bold: boolean | null
  web_button_size: string | null
  web_button_border_radius: string | null
  web_button_color: string | null
  web_button_border_color: string | null
  web_button_border_width: string | null
  web_button_text_color: string | null
  web_button_transparent: boolean | null
  web_button_type: string | null
  web_button_quantity: number | null
  web_button_primary_text: string | null
  web_button_secondary_text: string | null
  web_carousel_enabled: boolean | null
  web_carousel_autoplay: boolean | null
  web_carousel_speed: number | null
  web_carousel_display_mode: string | null
  web_carousel_image_1: string | null
  web_carousel_image_2: string | null
  web_carousel_image_3: string | null
  web_carousel_image_4: string | null
  web_carousel_image_5: string | null
  web_carousel_image_6: string | null
  web_gallery_enabled: boolean | null
  web_gallery_title: string | null
  web_gallery_title_enabled: boolean | null
  web_gallery_subtitle: string | null
  web_gallery_image_1: string | null
  web_gallery_image_2: string | null
  web_gallery_image_3: string | null
  web_gallery_image_4: string | null
  web_gallery_image_5: string | null
  web_gallery_image_6: string | null
  web_gallery_image_7: string | null
  web_gallery_image_8: string | null
  web_gallery_full_width: boolean | null
  web_contact_email: string | null
  web_contact_phone: string | null
  web_address: string | null
  web_social_facebook: string | null
  web_social_instagram: string | null
  web_social_twitter: string | null
  web_gallery_visible: boolean
  web_carousel_visible: boolean
  web_contact_form_enabled: boolean
  web_booking_enabled: boolean
  web_map_visible: boolean
  web_opening_hours_visible: boolean
  web_custom_css: string | null
  web_custom_js: string | null
  web_meta_title: string | null
  web_meta_description: string | null
  web_meta_keywords: string | null
  web_og_image_url: string | null
  web_favicon_url: string | null
  web_logo_url: string | null
  web_profile_photo_url: string | null
  web_theme: string | null
  web_layout_style: string | null
  web_header_style: string | null
  web_footer_style: string | null
  web_animation_enabled: boolean | null
  web_parallax_enabled: boolean | null
  web_parallax_image: string | null
  web_parallax_speed: number | null
  web_parallax_opacity: number | null
  web_parallax_sections: string[] | null
  web_dark_mode_enabled: boolean | null
  web_show_search: boolean | null
  web_show_breadcrumbs: boolean | null
  web_show_social_share: boolean | null
  web_show_back_to_top: boolean | null
  web_show_loading_animation: boolean | null
  web_custom_font: string | null
  web_font_size: string | null
  web_line_height: string | null
  web_spacing: string | null
  web_border_radius: string | null
  web_shadow_style: string | null
  web_transition_speed: string | null
  web_map_badge_text: string | null
  web_map_title: string | null
  web_map_subtitle: string | null
  web_map_opening_hours: string | null
  web_map_call_button_text: string | null
  web_map_button_color: string | null
  web_map_button_text_color: string | null
  web_map_button_border_color: string | null
  web_map_button_border_width: string | null
  web_map_button_border_radius: string | null
  web_map_button_size: string | null
  web_map_button_transparent: boolean | null
  web_hero_button_1_action: string | null
  web_hero_button_2_action: string | null
  web_navbar_logo_url: string | null
  web_navbar_title: string | null
  web_navbar_subtitle: string | null
  web_navbar_studio_text: string | null
  web_navbar_show_phone: boolean | null
  web_navbar_show_booking: boolean | null
  web_navbar_phone_text: string | null
  web_navbar_booking_text: string | null
  web_navbar_phone_action: string | null
  web_navbar_booking_action: string | null
  web_navbar_background_color: string | null
  web_navbar_text_color: string | null
  web_navbar_subtitle_color: string | null
  web_navbar_phone_button_background: string | null
  web_navbar_phone_button_text_color: string | null
  web_navbar_phone_button_border_color: string | null
  web_navbar_booking_button_background: string | null
  web_navbar_booking_button_text_color: string | null
  web_navbar_booking_button_border_color: string | null
  web_booking_section_background_color: string | null
  web_booking_section_card_background: string | null
  web_booking_section_title: string | null
  web_booking_section_subtitle: string | null
  web_booking_section_badge_text: string | null
  web_booking_section_title_color: string | null
  web_booking_section_subtitle_color: string | null
  web_booking_section_badge_background: string | null
  web_booking_section_badge_text_color: string | null
  web_booking_section_card_border_color: string | null
  web_booking_section_card_shadow: string | null
  web_opening_hours_button_text: string | null
  web_opening_hours_button_action: string | null
  web_opening_hours_button_color: string | null
  web_opening_hours_button_text_color: string | null
  web_opening_hours_button_border_color: string | null
  web_opening_hours_button_border_width: string | null
  web_opening_hours_button_border_radius: string | null
  web_opening_hours_button_size: string | null
  web_opening_hours_button_transparent: boolean | null
  // Footer customization fields
  web_footer_background_color: string | null
  web_footer_text_color: string | null
  web_footer_title_color: string | null
  web_footer_subtitle_color: string | null
  web_footer_description_color: string | null
  web_footer_link_color: string | null
  web_footer_link_hover_color: string | null
  web_footer_border_color: string | null
  web_footer_social_icon_color: string | null
  web_footer_social_icon_hover_color: string | null
  web_footer_title_font_family: string | null
  web_footer_subtitle_font_family: string | null
  web_footer_description_font_family: string | null
  web_footer_title_font_size: string | null
  web_footer_subtitle_font_size: string | null
  web_footer_description_font_size: string | null
  web_footer_title_bold: boolean | null
  web_footer_subtitle_bold: boolean | null
  web_footer_description_bold: boolean | null
  web_footer_copyright_text: string | null
  web_footer_copyright_color: string | null
  web_footer_copyright_font_size: string | null
  web_footer_copyright_font_family: string | null
  web_footer_show_social_links: boolean | null
  web_footer_show_contact_info: boolean | null
  web_footer_show_copyright: boolean | null
  web_footer_layout_style: string | null
  web_footer_padding_top: string | null
  web_footer_padding_bottom: string | null
  web_footer_margin_top: string | null
  web_footer_border_top_width: string | null
  web_footer_border_top_style: string | null
  web_footer_border_top_color: string | null
  web_footer_border_radius: string | null
  web_footer_shadow: string | null
  web_footer_opacity: string | null
  web_footer_backdrop_blur: string | null
  web_footer_gradient_enabled: boolean | null
  web_footer_gradient_from_color: string | null
  web_footer_gradient_to_color: string | null
  web_footer_gradient_direction: string | null
  web_footer_pattern_enabled: boolean | null
  web_footer_pattern_opacity: string | null
  web_footer_pattern_color: string | null
  web_footer_pattern_size: string | null
  web_footer_pattern_type: string | null
  created_at: string | null
  updated_at: string | null
}



interface DynamicSalonPageProps {
  subdomain: string
}

export default function DynamicSalonPage({ subdomain }: DynamicSalonPageProps) {
  const [salonData, setSalonData] = useState<SalonWebSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Parallax hook for hero section
  const { elementRef: heroParallaxRef, transform: heroTransform } = useParallaxBackground(
    salonData?.web_parallax_image || '',
    {
      speed: salonData?.web_parallax_speed || 0.5,
      enabled: salonData?.web_parallax_enabled || false
    }
  )

  useEffect(() => {
    setIsVisible(true)
    fetchSalonData()
    
    // Set up real-time subscription for salon web settings updates
    const channel = supabase
      .channel('salon-web-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'salon_web_settings',
          filter: `web_subdomain=eq.${subdomain}`
        },
        (payload) => {
          console.log('Salon web settings updated:', payload.new)
          setSalonData(payload.new as SalonWebSettings)
        }
      )
      .subscribe()

    // Listen for custom template application events
    const handleTemplateApplied = (event: CustomEvent) => {
      console.log('Template applied event received:', event.detail)
      // Force refresh of salon data
      fetchSalonData(true)
    }

    window.addEventListener('salonTemplateApplied', handleTemplateApplied as EventListener)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('salonTemplateApplied', handleTemplateApplied as EventListener)
    }
  }, [subdomain])

  // Handle parallax scroll effect
  useEffect(() => {
    if (!salonData?.web_parallax_enabled) return

    const handleScroll = () => {
      const scrolled = window.pageYOffset
      const parallaxElements = document.querySelectorAll('[data-parallax]')
      
      parallaxElements.forEach((element) => {
        const speed = parseFloat(element.getAttribute('data-speed') || '0.5')
        const yPos = -(scrolled * speed)
        ;(element as HTMLElement).style.transform = `translateY(${yPos}px)`
      })
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [salonData?.web_parallax_enabled])

  const fetchSalonData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsUpdating(true)
      } else {
        setLoading(true)
      }
      
      // Get salon web settings by subdomain
      const { data: webSettings, error: webError } = await supabase
        .from('salon_web_settings')
        .select('*')
        .eq('web_subdomain', subdomain)
        .eq('web_enabled', true)
        .single()

      if (webError) {
        console.error('Error fetching salon data:', webError)
        return
      }

      setSalonData(webSettings)
      
      // Show update indicator briefly
      if (isRefresh) {
        setTimeout(() => setIsUpdating(false), 2000)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      if (!isRefresh) {
        setLoading(false)
      }
    }
  }

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      scissors: Scissors,
      sparkles: Sparkles,
      heart: Heart,
      gift: Gift,
      star: Star,
      clock: Clock
    }
    return icons[iconName] || Scissors
  }

  const getFontSizeClass = (size: string | null) => {
    switch (size) {
      case 'small': return 'text-sm'
      case 'medium': return 'text-base'
      case 'large': return 'text-lg'
      case 'x-large': return 'text-xl'
      case '2xl': return 'text-2xl'
      case '3xl': return 'text-3xl'
      case '4xl': return 'text-4xl'
      case '5xl': return 'text-5xl'
      case '6xl': return 'text-6xl'
      case '7xl': return 'text-7xl'
      case '8xl': return 'text-8xl'
      default: return 'text-xl'
    }
  }

  const getFontFamilyClass = (family: string | null) => {
    switch (family) {
      case 'serif': return 'font-serif'
      case 'sans-serif': return 'font-sans'
      case 'monospace': return 'font-mono'
      case 'cursive': return 'font-cursive'
      case 'fantasy': return 'font-fantasy'
      default: return 'font-sans'
    }
  }

  const getBorderRadiusClass = (radius: string | null) => {
    switch (radius) {
      case 'none': return 'rounded-none'
      case 'small': return 'rounded-sm'
      case 'medium': return 'rounded-md'
      case 'large': return 'rounded-lg'
      case 'full': return 'rounded-full'
      default: return 'rounded-md'
    }
  }

  const getShadowClass = (shadow: string | null) => {
    switch (shadow) {
      case 'none': return 'shadow-none'
      case 'small': return 'shadow-sm'
      case 'medium': return 'shadow-md'
      case 'large': return 'shadow-lg'
      case 'xl': return 'shadow-xl'
      default: return 'shadow-md'
    }
  }

  const getTransitionClass = (speed: string | null) => {
    switch (speed) {
      case 'fast': return 'transition-all duration-150'
      case 'normal': return 'transition-all duration-300'
      case 'slow': return 'transition-all duration-500'
      default: return 'transition-all duration-300'
    }
  }

  const getFontWeightClass = (isBold: boolean | null) => {
    return isBold ? 'font-bold' : 'font-normal'
  }

  // Helper function to convert button size options to padding values
  const getButtonPadding = (size: string | null) => {
    switch (size) {
      case 'small': return '8px 16px'
      case 'medium': return '12px 24px'
      case 'large': return '16px 32px'
      case 'xl': return '20px 40px'
      default: return '12px 24px'
    }
  }

  // Helper function to convert button size options to font size values
  const getButtonFontSize = (size: string | null) => {
    switch (size) {
      case 'small': return '14px'
      case 'medium': return '16px'
      case 'large': return '18px'
      case 'xl': return '20px'
      default: return '16px'
    }
  }

  // Helper function to convert button border radius options to CSS values
  const getButtonBorderRadius = (radius: string | null) => {
    switch (radius) {
      case 'none': return '0px'
      case 'small': return '4px'
      case 'medium': return '8px'
      case 'large': return '12px'
      case 'full': return '9999px'
      default: return '8px'
    }
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

  // Function to handle hero button actions
  const handleHeroButtonAction = (action: string) => {
    switch (action) {
      case 'booking':
        const bookingSection = document.getElementById('booking-section');
        if (bookingSection) {
          bookingSection.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      case 'contact':
        const contactSection = document.getElementById('contact-section');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      case 'phone':
        if (salonData?.web_contact_phone) {
          window.open(`tel:${salonData.web_contact_phone}`, '_self');
        }
        break;
      case 'hours':
        const hoursSection = document.querySelector('[data-section="opening-hours"]');
        if (hoursSection) {
          hoursSection.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      case 'map':
        const mapSection = document.querySelector('[data-section="map"]');
        if (mapSection) {
          mapSection.scrollIntoView({ behavior: 'smooth' });
        }
        break;
      default:
        // Default to booking
        const defaultBookingSection = document.getElementById('booking-section');
        if (defaultBookingSection) {
          defaultBookingSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
  }

  // Function to geocode address using OpenStreetMap Nominatim API
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      }
      return null
    } catch (error) {
      console.error('Error geocoding address:', error)
      return null
    }
  }

  // State for map coordinates
  const [mapCoordinates, setMapCoordinates] = useState<[number, number] | null>(null)
  const [mapLoading, setMapLoading] = useState(false)

  // Geocode address when salon data changes
  useEffect(() => {
    if (salonData?.web_address) {
      setMapLoading(true)
      geocodeAddress(salonData.web_address).then(coords => {
        setMapCoordinates(coords)
        setMapLoading(false)
      })
    }
  }, [salonData?.web_address])

  // Apply custom CSS if provided
  useEffect(() => {
    if (salonData?.web_custom_css) {
      const style = document.createElement('style')
      style.textContent = salonData.web_custom_css
      document.head.appendChild(style)
      return () => {
        document.head.removeChild(style)
      }
    }
  }, [salonData?.web_custom_css])

  // Apply custom JavaScript if provided
  useEffect(() => {
    if (salonData?.web_custom_js) {
      try {
        eval(salonData.web_custom_js)
      } catch (error) {
        console.error('Error executing custom JavaScript:', error)
      }
    }
  }, [salonData?.web_custom_js])

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

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: salonData.web_theme === 'dark' ? '#1a1a1a' : '#fafafa',
        color: salonData.web_text_color || '#333333',
        fontFamily: salonData.web_custom_font === 'serif' ? 'serif' : 
                   salonData.web_custom_font === 'monospace' ? 'monospace' : 'sans-serif',
        fontSize: salonData.web_font_size === 'small' ? '14px' : 
                 salonData.web_font_size === 'large' ? '18px' : '16px',
        lineHeight: salonData.web_line_height === 'tight' ? '1.2' : 
                   salonData.web_line_height === 'relaxed' ? '1.6' : 
                   salonData.web_line_height === 'loose' ? '1.8' : '1.4',
        letterSpacing: salonData.web_spacing === 'tight' ? '-0.025em' : 
                      salonData.web_spacing === 'relaxed' ? '0.025em' : 
                      salonData.web_spacing === 'loose' ? '0.05em' : '0em'
      }}
    >
      {/* Header */}
      <header 
        className="backdrop-blur-sm shadow-lg border-b sticky top-0 z-50"
        style={{ 
          backgroundColor: salonData.web_navbar_background_color || 'rgba(255, 255, 255, 0.95)',
          borderColor: salonData.web_primary_color || '#6366f1' 
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {(salonData.web_navbar_logo_url || salonData.web_logo_url) ? (
                <img 
                  src={salonData.web_navbar_logo_url || salonData.web_logo_url || ''} 
                  alt={salonData.web_navbar_title || salonData.web_title || 'Logo'} 
                  className="w-12 h-12 rounded-xl"
                />
              ) : (
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${salonData.web_primary_color || '#6366f1'}, ${salonData.web_secondary_color || '#8b5cf6'})` 
                  }}
                >
                  <Scissors className="w-7 h-7 text-white" />
                </div>
              )}
              <div>
                <h1 
                  className={`${getFontWeightClass(salonData.web_title_bold)} ${getFontSizeClass(salonData.web_salon_name_font_size)} ${getFontFamilyClass(salonData.web_title_font_family)}`}
                  style={{ color: salonData.web_navbar_text_color || salonData.web_salon_name_color || '#000000' }}
                >
                  {salonData.web_navbar_title || salonData.web_title || 'Il Mio Salone'}
                </h1>
                {(salonData.web_navbar_subtitle || salonData.web_subtitle) && (
                  <p 
                    className={`text-sm ${getFontWeightClass(salonData.web_subtitle_bold)} ${getFontSizeClass(salonData.web_subtitle_font_size)} ${getFontFamilyClass(salonData.web_subtitle_font_family)}`}
                    style={{ color: salonData.web_navbar_subtitle_color || salonData.web_subtitle_color || '#666666' }}
                  >
                    {salonData.web_navbar_subtitle || salonData.web_subtitle}
                  </p>
                )}
                {(salonData.web_navbar_studio_text || salonData.web_studio_text) && (
                  <p 
                    className={`text-xs ${getFontWeightClass(salonData.web_studio_text_bold)} ${getFontSizeClass(salonData.web_studio_text_font_size)}`}
                    style={{ color: salonData.web_navbar_subtitle_color || salonData.web_subtitle_color || '#666666' }}
                  >
                    {salonData.web_navbar_studio_text || salonData.web_studio_text}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Update Indicator and Refresh Button */}
              <div className="flex items-center space-x-2">
                {isUpdating && (
                  <div className="flex items-center space-x-2 text-green-400 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                    <span>Aggiornamento...</span>
                  </div>
                )}
                
                {/* Manual Refresh Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchSalonData(true)}
                  disabled={isUpdating}
                  className="text-gray-400 hover:text-gray-600"
                  title="Aggiorna pagina"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </div>
              
              {(salonData.web_navbar_show_phone ?? true) && salonData.web_contact_phone && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hidden md:flex" 
                  style={{
                    backgroundColor: salonData.web_navbar_phone_button_background || '#ffffff',
                    color: salonData.web_navbar_phone_button_text_color || '#000000',
                    borderRadius: getButtonBorderRadius(salonData.web_button_border_radius || 'medium'),
                    borderColor: salonData.web_navbar_phone_button_border_color || salonData.web_button_border_color || '#d1d5db',
                    borderWidth: salonData.web_button_border_width || '1px',
                    borderStyle: 'solid'
                  }}
                  onClick={() => {
                    const action = salonData.web_navbar_phone_action || 'phone'
                    if (action === 'phone') {
                      window.open(`tel:${salonData.web_contact_phone}`, '_self')
                    } else {
                      handleHeroButtonAction(action)
                    }
                  }}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {salonData.web_navbar_phone_text || salonData.web_contact_phone}
                </Button>
              )}
              {(salonData.web_navbar_show_booking ?? true) && salonData.web_booking_enabled && (
                <Button 
                  size="sm" 
                  className="shadow-lg"
                  style={{ 
                    background: salonData.web_navbar_booking_button_background || (salonData.web_button_transparent ? 'transparent' : `linear-gradient(135deg, ${salonData.web_primary_color || '#6366f1'}, ${salonData.web_secondary_color || '#8b5cf6'})`),
                    borderRadius: getButtonBorderRadius(salonData.web_button_border_radius || 'medium'),
                    borderColor: salonData.web_navbar_booking_button_border_color || salonData.web_button_border_color || (salonData.web_button_transparent ? '#6366f1' : 'transparent'),
                    borderWidth: salonData.web_button_border_width || (salonData.web_button_transparent ? '2px' : '0px'),
                    borderStyle: 'solid',
                    color: salonData.web_navbar_booking_button_text_color || (salonData.web_button_transparent ? (salonData.web_button_text_color || '#6366f1') : '#ffffff')
                  }}
                  onClick={() => {
                    const action = salonData.web_navbar_booking_action || 'booking'
                    handleHeroButtonAction(action)
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {salonData.web_navbar_booking_text || 'Prenota Ora'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative py-24 text-white overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${salonData.web_primary_color || '#6366f1'}, ${salonData.web_secondary_color || '#8b5cf6'})` 
        }}
      >
        {/* Parallax Background */}
        {salonData.web_parallax_enabled && salonData.web_parallax_image && (
          <div
            data-parallax="true"
            data-speed={salonData.web_parallax_speed || 0.5}
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `url(${salonData.web_parallax_image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
              opacity: salonData.web_parallax_opacity || 0.3,
              transition: 'transform 0.1s ease-out'
            }}
          />
        )}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        
        {/* Transparent overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        
        <div className={`container mx-auto px-4 text-center relative z-10 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 
            className={`${getFontWeightClass(salonData.web_title_bold)} mb-6 leading-tight ${getFontSizeClass(salonData.web_salon_name_font_size)} ${getFontFamilyClass(salonData.web_title_font_family)}`}
            style={{ color: salonData.web_title_color || '#ffffff' }}
          >
            {salonData.web_title || 'Il Mio Salone'}
          </h2>
          {salonData.web_subtitle && (
            <p 
              className={`mb-4 max-w-2xl mx-auto leading-relaxed ${getFontWeightClass(salonData.web_subtitle_bold)} ${getFontSizeClass(salonData.web_subtitle_font_size)} ${getFontFamilyClass(salonData.web_subtitle_font_family)}`}
              style={{ color: salonData.web_subtitle_color || '#ffffff' }}
            >
              {salonData.web_subtitle}
            </p>
          )}
          {salonData.web_description && (
            <p 
              className={`mb-8 max-w-3xl mx-auto leading-relaxed ${getFontWeightClass(salonData.web_description_bold)} ${getFontSizeClass(salonData.web_description_font_size)} ${getFontFamilyClass(salonData.web_description_font_family)}`}
              style={{ color: salonData.web_description_color || salonData.web_title_color || '#ffffff' }}
            >
              {salonData.web_description}
            </p>
          )}
          
                     {salonData.web_booking_enabled && (
             <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                                    {Array.from({ length: salonData.web_button_quantity || 2 }).map((_, index) => {
                       const buttonColor = salonData.web_button_color || '#ffffff'
                       const textColor = salonData.web_button_text_color || getContrastTextColor(buttonColor)
                       const isTransparent = salonData.web_button_transparent || false
                       
                       // Get the action for this button
                       const buttonAction = index === 0 
                         ? salonData.web_hero_button_1_action || 'booking'
                         : salonData.web_hero_button_2_action || 'contact'
                       
                       // Get the appropriate icon for the action
                       const getButtonIcon = (action: string) => {
                         switch (action) {
                           case 'booking': return <Calendar className="w-5 h-5 mr-2 inline" />
                           case 'contact': return <MessageCircle className="w-5 h-5 mr-2 inline" />
                           case 'phone': return <Phone className="w-5 h-5 mr-2 inline" />
                           case 'hours': return <Clock className="w-5 h-5 mr-2 inline" />
                           case 'map': return <MapPin className="w-5 h-5 mr-2 inline" />
                           default: return <Calendar className="w-5 h-5 mr-2 inline" />
                         }
                       }
                       
                       // Get the button text based on action
                       const getButtonText = (action: string) => {
                         switch (action) {
                           case 'booking': return salonData.web_button_primary_text || 'Prenota Subito'
                           case 'contact': return salonData.web_button_secondary_text || 'Contattaci'
                           case 'phone': return 'Chiama Ora'
                           case 'hours': return 'I Nostri Orari'
                           case 'map': return 'Dove Siamo'
                           default: return salonData.web_button_primary_text || 'Prenota Subito'
                         }
                       }
                       
                       return (
                          <button
                            key={index}
                            style={{
                              backgroundColor: isTransparent ? 'transparent' : buttonColor,
                              borderColor: salonData.web_button_border_color || (isTransparent ? '#ffffff' : 'transparent'),
                              borderWidth: salonData.web_button_border_width || (isTransparent ? '2px' : '0px'),
                              borderRadius: getButtonBorderRadius(salonData.web_button_border_radius || 'medium'),
                              padding: getButtonPadding(salonData.web_button_size || 'large'),
                              fontSize: getButtonFontSize(salonData.web_button_size || 'large'),
                              color: isTransparent ? (salonData.web_button_text_color || '#ffffff') : textColor,
                              borderStyle: 'solid',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease-in-out',
                              boxShadow: isTransparent ? 'none' : '0 10px 25px rgba(0, 0, 0, 0.1)'
                            }}
                           className="hover:opacity-80 hover:scale-105"
                           onClick={() => handleHeroButtonAction(buttonAction)}
                         >
                           {getButtonIcon(buttonAction)}
                           {getButtonText(buttonAction)}
                         </button>
                       )
                     })}
             </div>
           )}
        </div>
      </section>

      {/* Gallery Section */}
      {salonData.web_carousel_visible && (
        <section className={`py-16 ${salonData.web_gallery_full_width ? 'bg-white' : 'bg-white'}`}>
          <div className={salonData.web_gallery_full_width ? 'w-full' : 'container mx-auto px-4'}>
            {(salonData.web_gallery_title_enabled ?? true) && (
              <div className="text-center mb-12">
                <h3 
                  className={`text-3xl md:text-4xl ${getFontWeightClass(salonData.web_title_bold)} mb-4 ${getFontSizeClass(salonData.web_salon_name_font_size)} ${getFontFamilyClass(salonData.web_title_font_family)}`}
                  style={{ color: salonData.web_title_color || '#1f2937' }}
                >
                  {salonData.web_gallery_title || 'La Nostra Galleria'}
                </h3>
                {salonData.web_gallery_subtitle && (
                  <p 
                    className={`text-lg text-gray-600 max-w-2xl mx-auto ${getFontWeightClass(salonData.web_subtitle_bold)} ${getFontSizeClass(salonData.web_subtitle_font_size)} ${getFontFamilyClass(salonData.web_subtitle_font_family)}`}
                    style={{ color: salonData.web_subtitle_color || '#6b7280' }}
                  >
                    {salonData.web_gallery_subtitle}
                  </p>
                )}
              </div>
            )}
            
             <div className={`relative group ${salonData.web_gallery_full_width ? 'px-4' : ''}`}>
               <Swiper
                 modules={[Navigation, Pagination, Autoplay]}
                 spaceBetween={salonData.web_gallery_full_width ? 8 : 16}
                 slidesPerView={1}
                 navigation={{
                   nextEl: '.swiper-button-next',
                   prevEl: '.swiper-button-prev',
                 }}
                 pagination={{
                   clickable: true,
                   el: '.swiper-pagination',
                 }}
                 autoplay={salonData.web_carousel_autoplay ? {
                   delay: salonData.web_carousel_speed || 3000,
                   disableOnInteraction: false,
                 } : false}
                 breakpoints={{
                   640: {
                     slidesPerView: salonData.web_gallery_full_width ? 3 : 2,
                     spaceBetween: salonData.web_gallery_full_width ? 12 : 20,
                   },
                   768: {
                     slidesPerView: salonData.web_gallery_full_width ? 4 : 3,
                     spaceBetween: salonData.web_gallery_full_width ? 16 : 24,
                   },
                   1024: {
                     slidesPerView: salonData.web_gallery_full_width ? 6 : 4,
                     spaceBetween: salonData.web_gallery_full_width ? 20 : 24,
                   },
                   1280: {
                     slidesPerView: salonData.web_gallery_full_width ? 8 : 4,
                     spaceBetween: salonData.web_gallery_full_width ? 24 : 24,
                   },
                 }}
                 className="gallery-swiper"
                 style={{
                   '--swiper-navigation-color': salonData.web_primary_color || '#6366f1',
                   '--swiper-pagination-color': salonData.web_primary_color || '#6366f1',
                 } as React.CSSProperties}
               >
                 {[
                   salonData.web_gallery_image_1,
                   salonData.web_gallery_image_2,
                   salonData.web_gallery_image_3,
                   salonData.web_gallery_image_4,
                   salonData.web_gallery_image_5,
                   salonData.web_gallery_image_6,
                   salonData.web_gallery_image_7,
                   salonData.web_gallery_image_8
                 ].filter(Boolean).map((imageUrl, index) => (
                   <SwiperSlide key={index}>
                     <div 
                       className={`${salonData.web_gallery_full_width ? 'h-40 md:h-56' : 'h-48 md:h-64'} rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer gallery-item`}
                       style={{ 
                         borderRadius: getBorderRadiusClass(salonData.web_border_radius || 'large'),
                         boxShadow: getShadowClass(salonData.web_shadow_style || 'medium')
                       }}
                       onClick={() => {
                         // Optional: Open image in lightbox or modal
                         if (imageUrl) {
                           window.open(imageUrl, '_blank');
                         }
                       }}
                     >
                       <img
                         src={imageUrl || ''}
                         alt={`Gallery image ${index + 1}`}
                         className="w-full h-full object-cover"
                         loading="lazy"
                       />
                     </div>
                   </SwiperSlide>
                 ))}
               </Swiper>
               
               {/* Custom Navigation Buttons */}
               <div className="swiper-button-prev !w-10 !h-10 !bg-white/80 !backdrop-blur-sm !rounded-full !shadow-lg !opacity-0 group-hover:!opacity-100 !transition-opacity !duration-300 hover:!bg-white hover:!shadow-xl !hidden md:!flex !text-gray-600 hover:!text-gray-800" />
               <div className="swiper-button-next !w-10 !h-10 !bg-white/80 !backdrop-blur-sm !rounded-full !shadow-lg !opacity-0 group-hover:!opacity-100 !transition-opacity !duration-300 hover:!bg-white hover:!shadow-xl !hidden md:!flex !text-gray-600 hover:!text-gray-800" />
               
               {/* Custom Pagination */}
               <div className="swiper-pagination !bottom-0 !mt-6" />
             </div>
          </div>
        </section>
      )}

             

       {/* Booking Section */}
       {salonData.web_booking_enabled && (
         <section 
           id="booking-section" 
           className="py-20"
           style={{ 
             background: salonData.web_booking_section_background_color || 'linear-gradient(135deg, #f0f9ff, #dbeafe)' 
           }}
         >
           <div className="container mx-auto px-4">
             <div className="text-center mb-16">
               <div 
                 className="inline-flex items-center rounded-full px-6 py-2 mb-6"
                 style={{ 
                   backgroundColor: salonData.web_booking_section_badge_background || '#dbeafe' 
                 }}
               >
                 <Calendar className="w-5 h-5 mr-2" style={{ color: salonData.web_booking_section_badge_text_color || '#1d4ed8' }} />
                 <span 
                   className="font-semibold"
                   style={{ color: salonData.web_booking_section_badge_text_color || '#1d4ed8' }}
                 >
                   {salonData.web_booking_section_badge_text || 'PRENOTAZIONE ONLINE'}
                 </span>
               </div>
               <h3 
                 className="text-4xl md:text-5xl font-bold mb-6"
                 style={{ color: salonData.web_booking_section_title_color || '#1f2937' }}
               >
                 {salonData.web_booking_section_title || 'Prenota il Tuo Appuntamento'}
               </h3>
               <p 
                 className="text-xl max-w-2xl mx-auto"
                 style={{ color: salonData.web_booking_section_subtitle_color || '#6b7280' }}
               >
                 {salonData.web_booking_section_subtitle || 'Scegli il servizio, la data e l\'ora che preferisci. La prenotazione è semplice e veloce!'}
               </p>
             </div>
             
             <div className="max-w-4xl mx-auto">
               <Card 
                 className="border-0"
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
                 <CardContent className="p-8">
                   <OnlineBookingForm salonId={salonData.salon_id} />
                 </CardContent>
               </Card>
             </div>
           </div>
         </section>
       )}

      

      {/* Gallery Section */}
      {salonData.web_gallery_visible && (
        <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
          {/* Parallax Background for Gallery */}
          {salonData.web_parallax_enabled && salonData.web_parallax_image && salonData.web_parallax_sections?.includes('gallery') && (
            <div
              data-parallax="true"
              data-speed={(salonData.web_parallax_speed || 0.5) * 0.4}
              className="absolute inset-0 w-full h-full"
              style={{
                backgroundImage: `url(${salonData.web_parallax_image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                opacity: (salonData.web_parallax_opacity || 0.3) * 0.6,
                transition: 'transform 0.1s ease-out'
              }}
            />
          )}
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-blue-100 rounded-full px-6 py-2 mb-6">
                <ImageIcon className="w-5 h-5 mr-2 text-blue-600" />
                <span className="text-blue-600 font-semibold">LA NOSTRA GALLERIA</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                I Nostri Lavori
              </h3>
              {salonData.web_profile_photo_url && (
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <img
                      src={salonData.web_profile_photo_url}
                      alt="Profile Photo"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  </div>
                </div>
              )}
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Scopri la qualità dei nostri servizi attraverso le immagini dei nostri lavori
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Placeholder gallery items - you can replace these with actual gallery data */}
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Immagine {item}</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        borderRadius: getButtonBorderRadius(salonData.web_button_border_radius || 'medium')
                      }}
                    >
                      Visualizza
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {salonData.web_contact_form_enabled && (
        <section 
          id="contact-section"
          className="py-20 text-white relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${salonData.web_primary_color || '#6366f1'}, ${salonData.web_secondary_color || '#8b5cf6'})` 
          }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h3 className="text-4xl md:text-5xl font-bold mb-6">
                  Contattaci
                </h3>
                <p className="text-xl mb-8">
                  Prenota il tuo appuntamento o richiedi informazioni
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Contact Form */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
                  <h4 className="text-2xl font-bold mb-6 text-center">Invia un Messaggio</h4>
                  <ContactForm salonSubdomain={salonData.web_subdomain || ''} />
                </div>
                
                {/* Contact Info */}
                <div className="space-y-6">
                  {salonData.web_contact_phone && (
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="text-xl font-bold mb-2">Telefono</h5>
                        <p className="opacity-90">{salonData.web_contact_phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {salonData.web_contact_email && (
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="text-xl font-bold mb-2">Email</h5>
                        <p className="opacity-90">{salonData.web_contact_email}</p>
                      </div>
                    </div>
                  )}
                  
                  {salonData.web_address && (
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="text-xl font-bold mb-2">Indirizzo</h5>
                        <p className="opacity-90">{salonData.web_address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Opening Hours Section */}
      {(salonData.web_opening_hours_visible ?? true) && (
        <section data-section="opening-hours" className="py-16 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
          {/* Parallax Background for Opening Hours */}
          {salonData.web_parallax_enabled && salonData.web_parallax_image && salonData.web_parallax_sections?.includes('opening_hours') && (
            <div
              data-parallax="true"
              data-speed={(salonData.web_parallax_speed || 0.5) * 0.3}
              className="absolute inset-0 w-full h-full"
              style={{
                backgroundImage: `url(${salonData.web_parallax_image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                opacity: (salonData.web_parallax_opacity || 0.3) * 0.4,
                transition: 'transform 0.1s ease-out'
              }}
            />
          )}
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center bg-blue-100 rounded-full px-6 py-2 mb-6">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                <span className="text-blue-600 font-semibold">ORARI DI APERTURA</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                I Nostri Orari
              </h3>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Trova il momento perfetto per la tua visita
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                     {(salonData.web_map_opening_hours && salonData.web_map_opening_hours.trim() !== '' 
                     ? salonData.web_map_opening_hours.split('\n').filter(line => line.trim())
                     : [
                         'Lunedì: 09:00 - 18:00',
                         'Martedì: 09:00 - 18:00',
                         'Mercoledì: 09:00 - 18:00',
                         'Giovedì: 09:00 - 18:00',
                         'Venerdì: 09:00 - 18:00',
                         'Sabato: 09:00 - 17:00',
                         'Domenica: Chiuso'
                       ]
                   ).map((line, index) => {
                     // Parse the line more robustly
                     const colonIndex = line.indexOf(':')
                     const day = line.substring(0, colonIndex).trim()
                     const time = line.substring(colonIndex + 1).trim()
                     
                                           // Show all lines, including breaks and closed days
                      // Only skip empty lines
                     
                     const isToday = new Date().toLocaleDateString('it-IT', { weekday: 'long' }).toLowerCase().includes(day.toLowerCase())
                     
                     return (
                       <div 
                         key={index} 
                         className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                           isToday 
                             ? 'border-blue-500 bg-blue-50' 
                             : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                         }`}
                       >
                         <div className="flex items-center justify-between mb-2">
                           <h4 className={`font-bold text-lg ${
                             isToday ? 'text-blue-700' : 'text-gray-900'
                           }`}>
                             {day}
                           </h4>
                           {isToday && (
                             <Badge className="bg-blue-600 text-white text-xs">
                               OGGI
                             </Badge>
                           )}
                         </div>
                         <p className={`text-lg font-medium ${
                           isToday ? 'text-blue-600' : 'text-gray-700'
                         }`}>
                           {time}
                         </p>
                       </div>
                     )
                   }).filter(Boolean)}
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <p className="text-gray-600 text-sm mb-4">
                    Gli orari potrebbero variare durante i giorni festivi. Contattaci per confermare.
                  </p>
                  {salonData.web_booking_enabled && (
                    <Button 
                      size="lg"
                      className="shadow-lg"
                      style={{ 
                        background: salonData.web_opening_hours_button_transparent ? 'transparent' : (salonData.web_opening_hours_button_color || `linear-gradient(135deg, ${salonData.web_primary_color || '#6366f1'}, ${salonData.web_secondary_color || '#8b5cf6'})`),
                        borderRadius: getButtonBorderRadius(salonData.web_opening_hours_button_border_radius || 'medium'),
                        borderColor: salonData.web_opening_hours_button_border_color || (salonData.web_opening_hours_button_transparent ? '#6366f1' : 'transparent'),
                        borderWidth: salonData.web_opening_hours_button_border_width || (salonData.web_opening_hours_button_transparent ? '2px' : '0px'),
                        borderStyle: 'solid',
                        color: salonData.web_opening_hours_button_transparent ? (salonData.web_opening_hours_button_text_color || '#6366f1') : (salonData.web_opening_hours_button_text_color || '#ffffff'),
                        padding: getButtonPadding(salonData.web_opening_hours_button_size || 'large'),
                        fontSize: getButtonFontSize(salonData.web_opening_hours_button_size || 'large')
                      }}
                      onClick={() => {
                        const buttonAction = salonData.web_opening_hours_button_action || 'booking'
                        handleHeroButtonAction(buttonAction)
                      }}
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      {salonData.web_opening_hours_button_text || 'Prenota Ora'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Map Section */}
      {salonData.web_map_visible && salonData.web_address && (
        <section data-section="map" className="py-20 bg-white relative overflow-hidden">
          {/* Parallax Background for Map */}
          {salonData.web_parallax_enabled && salonData.web_parallax_image && salonData.web_parallax_sections?.includes('map') && (
            <div
              data-parallax="true"
              data-speed={(salonData.web_parallax_speed || 0.5) * 0.1}
              className="absolute inset-0 w-full h-full"
              style={{
                backgroundImage: `url(${salonData.web_parallax_image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                opacity: (salonData.web_parallax_opacity || 0.3) * 0.2,
                transition: 'transform 0.1s ease-out'
              }}
            />
          )}
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-green-100 rounded-full px-6 py-2 mb-6">
                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                <span className="text-green-600 font-semibold">{salonData.web_map_badge_text || 'DOVE SIAMO'}</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {salonData.web_map_title || 'Vieni a Trovarci'}
              </h3>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {salonData.web_map_subtitle || 'Siamo facilmente raggiungibili. Vieni a trovarci per una consulenza personalizzata!'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                             {/* Map */}
               <div className="relative">
                 <div 
                   className="w-full h-96 rounded-2xl overflow-hidden shadow-2xl"
                   style={{ 
                     borderRadius: getBorderRadiusClass(salonData.web_border_radius || 'large'),
                     boxShadow: getShadowClass(salonData.web_shadow_style || 'large')
                   }}
                 >
                   {mapLoading ? (
                     <div className="w-full h-full flex items-center justify-center bg-gray-100">
                       <div className="text-center">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-2"></div>
                         <p className="text-gray-600 text-sm">Caricamento mappa...</p>
                       </div>
                     </div>
                   ) : mapCoordinates ? (
                     <MapComponent 
                       coordinates={mapCoordinates}
                       title={salonData.web_title || 'Il Mio Salone'}
                       address={salonData.web_address || ''}
                     />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-gray-100">
                       <div className="text-center">
                         <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                         <p className="text-gray-600 text-sm">Indirizzo non trovato</p>
                       </div>
                     </div>
                   )}
                 </div>
                 
                 {/* Map Overlay with Salon Info */}
                 {mapCoordinates && (
                   <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg max-w-xs">
                     <div className="flex items-center space-x-3">
                       <div 
                         className="w-10 h-10 rounded-lg flex items-center justify-center"
                         style={{ 
                           background: `linear-gradient(135deg, ${salonData.web_primary_color || '#6366f1'}, ${salonData.web_secondary_color || '#8b5cf6'})` 
                         }}
                       >
                         <Scissors className="w-5 h-5 text-white" />
                       </div>
                       <div>
                         <h4 className="font-bold text-gray-900 text-sm">
                           {salonData.web_title || 'Il Mio Salone'}
                         </h4>
                         <p className="text-xs text-gray-600">
                           {salonData.web_address}
                         </p>
                       </div>
                     </div>
                   </div>
                 )}
               </div>
              
              {/* Location Info */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${salonData.web_primary_color || '#6366f1'}, ${salonData.web_secondary_color || '#8b5cf6'})` 
                      }}
                    >
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Indirizzo</h4>
                      <p className="text-gray-600 leading-relaxed">{salonData.web_address}</p>
                    </div>
                  </div>
                  

                  
                  {salonData.web_contact_phone && (
                    <div className="flex items-start space-x-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ 
                          background: `linear-gradient(135deg, ${salonData.web_primary_color || '#6366f1'}, ${salonData.web_secondary_color || '#8b5cf6'})` 
                        }}
                      >
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Telefono</h4>
                        <p className="text-gray-600">{salonData.web_contact_phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {salonData.web_contact_email && (
                    <div className="flex items-start space-x-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ 
                          background: `linear-gradient(135deg, ${salonData.web_primary_color || '#6366f1'}, ${salonData.web_secondary_color || '#8b5cf6'})` 
                        }}
                      >
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Email</h4>
                        <p className="text-gray-600">{salonData.web_contact_email}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Call Button */}
                <div className="pt-6">
                  <Button 
                    size="lg" 
                    className="w-full text-lg py-4 shadow-xl font-bold"
                    style={{ 
                      background: salonData.web_map_button_transparent ? 'transparent' : (salonData.web_map_button_color || `linear-gradient(135deg, ${salonData.web_primary_color || '#6366f1'}, ${salonData.web_secondary_color || '#8b5cf6'})`),
                      borderRadius: getButtonBorderRadius(salonData.web_map_button_border_radius || 'medium'),
                      borderColor: salonData.web_map_button_border_color || (salonData.web_map_button_transparent ? '#6366f1' : 'transparent'),
                      borderWidth: salonData.web_map_button_border_width || (salonData.web_map_button_transparent ? '2px' : '0px'),
                      borderStyle: 'solid',
                      color: salonData.web_map_button_transparent ? (salonData.web_map_button_text_color || '#6366f1') : (salonData.web_map_button_text_color || '#ffffff')
                    }}
                    onClick={() => {
                      if (salonData.web_contact_phone) {
                        window.open(`tel:${salonData.web_contact_phone}`, '_self')
                      } else {
                        // Fallback to directions if no phone number available
                        if (mapCoordinates) {
                          const mapsUrl = `https://www.openstreetmap.org/?mlat=${mapCoordinates[0]}&mlon=${mapCoordinates[1]}&zoom=15`
                          window.open(mapsUrl, '_blank')
                        } else {
                          const mapsUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(salonData.web_address || '')}`
                          window.open(mapsUrl, '_blank')
                        }
                      }
                    }}
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    {salonData.web_map_call_button_text || 'Chiama Ora'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer 
        className="relative overflow-hidden"
        style={{ 
          background: salonData.web_footer_gradient_enabled 
            ? `linear-gradient(${salonData.web_footer_gradient_direction || 'to-br'}, ${salonData.web_footer_gradient_from_color || '#1f2937'}, ${salonData.web_footer_gradient_to_color || '#111827'})`
            : (salonData.web_footer_background_color || '#1f2937'),
          color: salonData.web_footer_text_color || '#ffffff',
          paddingTop: salonData.web_footer_padding_top || '48px',
          paddingBottom: salonData.web_footer_padding_bottom || '24px',
          marginTop: salonData.web_footer_margin_top || '0px',
          borderTopWidth: salonData.web_footer_border_top_width || '0px',
          borderTopStyle: (salonData.web_footer_border_top_style || 'solid') as any,
          borderTopColor: salonData.web_footer_border_top_color || '#374151',
          borderRadius: salonData.web_footer_border_radius || '0px',
          boxShadow: salonData.web_footer_shadow || 'none',
          opacity: salonData.web_footer_opacity || '1',
          backdropFilter: salonData.web_footer_backdrop_blur || 'none'
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
        
        <div className="container mx-auto px-4 relative z-10">
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 ${
            salonData.web_footer_layout_style === 'compact' ? 'gap-4' : 
            salonData.web_footer_layout_style === 'wide' ? 'gap-12' : 
            salonData.web_footer_layout_style === 'centered' ? 'text-center' : 'gap-8'
          }`}>
            {/* Brand */}
            <div className={`${salonData.web_footer_layout_style === 'centered' ? 'md:col-span-4' : 'md:col-span-2'}`}>
              <div className={`flex items-center space-x-3 mb-4 ${
                salonData.web_footer_layout_style === 'centered' ? 'justify-center' : ''
              }`}>
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
                      fontFamily: getFontFamilyClass(salonData.web_footer_title_font_family || 'default'),
                      fontSize: getFontSizeClass(salonData.web_footer_title_font_size || 'large'),
                      fontWeight: getFontWeightClass(salonData.web_footer_title_bold ?? true)
                    }}
                  >
                    {salonData.web_title || 'Salone'}
                  </h4>
                  {salonData.web_subtitle && (
                    <p 
                      style={{ 
                        color: salonData.web_footer_subtitle_color || '#9ca3af',
                        fontFamily: getFontFamilyClass(salonData.web_footer_subtitle_font_family || 'default'),
                        fontSize: getFontSizeClass(salonData.web_footer_subtitle_font_size || 'medium'),
                        fontWeight: getFontWeightClass(salonData.web_footer_subtitle_bold ?? false)
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
                    fontFamily: getFontFamilyClass(salonData.web_footer_description_font_family || 'default'),
                    fontSize: getFontSizeClass(salonData.web_footer_description_font_size || 'small'),
                    fontWeight: getFontWeightClass(salonData.web_footer_description_bold ?? false)
                  }}
                  className={`mb-4 max-w-md ${salonData.web_footer_layout_style === 'centered' ? 'mx-auto' : ''}`}
                >
                  {salonData.web_description}
                </p>
              )}
              {(salonData.web_footer_show_social_links ?? true) && (
                <div className={`flex space-x-4 ${salonData.web_footer_layout_style === 'centered' ? 'justify-center' : ''}`}>
                  {salonData.web_social_instagram && (
                    <a 
                      href={salonData.web_social_instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded border flex items-center justify-center transition-colors duration-200 hover:scale-110"
                      style={{ 
                        borderColor: salonData.web_footer_social_icon_color || '#9ca3af',
                        color: salonData.web_footer_social_icon_color || '#9ca3af'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = salonData.web_footer_social_icon_hover_color || '#ffffff'
                        e.currentTarget.style.borderColor = salonData.web_footer_social_icon_hover_color || '#ffffff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = salonData.web_footer_social_icon_color || '#9ca3af'
                        e.currentTarget.style.borderColor = salonData.web_footer_social_icon_color || '#9ca3af'
                      }}
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {salonData.web_social_facebook && (
                    <a 
                      href={salonData.web_social_facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded border flex items-center justify-center transition-colors duration-200 hover:scale-110"
                      style={{ 
                        borderColor: salonData.web_footer_social_icon_color || '#9ca3af',
                        color: salonData.web_footer_social_icon_color || '#9ca3af'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = salonData.web_footer_social_icon_hover_color || '#ffffff'
                        e.currentTarget.style.borderColor = salonData.web_footer_social_icon_hover_color || '#ffffff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = salonData.web_footer_social_icon_color || '#9ca3af'
                        e.currentTarget.style.borderColor = salonData.web_footer_social_icon_color || '#9ca3af'
                      }}
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
            
            {/* Contact Info */}
            {(salonData.web_footer_show_contact_info ?? true) && (
              <div className={salonData.web_footer_layout_style === 'centered' ? 'md:col-span-4' : ''}>
                <h5 
                  style={{ 
                    color: salonData.web_footer_title_color || '#ffffff',
                    fontFamily: getFontFamilyClass(salonData.web_footer_title_font_family || 'default'),
                    fontSize: getFontSizeClass(salonData.web_footer_title_font_size || 'large'),
                    fontWeight: getFontWeightClass(salonData.web_footer_title_bold ?? true)
                  }}
                  className="mb-4"
                >
                  Contatti
                </h5>
                <ul className={`space-y-2 text-sm ${
                  salonData.web_footer_layout_style === 'centered' ? 'flex flex-col items-center' : ''
                }`}>
                  {salonData.web_contact_phone && (
                    <li 
                      className="flex items-center space-x-2 transition-colors duration-200 hover:scale-105"
                      style={{ color: salonData.web_footer_link_color || '#9ca3af' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = salonData.web_footer_link_hover_color || '#ffffff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = salonData.web_footer_link_color || '#9ca3af'
                      }}
                    >
                      <Phone className="w-4 h-4" />
                      <span>{salonData.web_contact_phone}</span>
                    </li>
                  )}
                  {salonData.web_contact_email && (
                    <li 
                      className="flex items-center space-x-2 transition-colors duration-200 hover:scale-105"
                      style={{ color: salonData.web_footer_link_color || '#9ca3af' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = salonData.web_footer_link_hover_color || '#ffffff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = salonData.web_footer_link_color || '#9ca3af'
                      }}
                    >
                      <Mail className="w-4 h-4" />
                      <span>{salonData.web_contact_email}</span>
                    </li>
                  )}
                  {salonData.web_address && (
                    <li 
                      className="flex items-center space-x-2 transition-colors duration-200 hover:scale-105"
                      style={{ color: salonData.web_footer_link_color || '#9ca3af' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = salonData.web_footer_link_hover_color || '#ffffff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = salonData.web_footer_link_color || '#9ca3af'
                      }}
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
                  fontFamily: getFontFamilyClass(salonData.web_footer_copyright_font_family || 'default'),
                  fontSize: getFontSizeClass(salonData.web_footer_copyright_font_size || 'small')
                }}
                className="text-sm"
              >
                {(salonData.web_footer_copyright_text || '© 2024 {salon_name}. Tutti i diritti riservati.').replace('{salon_name}', salonData.web_title || 'Salone')}
              </p>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
