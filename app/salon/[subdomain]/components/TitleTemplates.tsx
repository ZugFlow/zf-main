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
  Flower
} from 'lucide-react'

interface TitleTemplate {
  id: string
  name: string
  description: string
  category: string
  title: string
  subtitle: string
  titleFont: string
  subtitleFont: string
  titleSize: string
  subtitleSize: string
  titleColor: string
  subtitleColor: string
  backgroundColor: string
  backgroundImage?: string
  gradient?: string
  badge?: {
    text: string
    color: string
    backgroundColor: string
  }
  icon?: any
  spacing: string
  alignment: string
  effects: {
    shadow: boolean
    glow: boolean
    border: boolean
    borderColor: string
    borderWidth: string
  }
}

const titleTemplates: TitleTemplate[] = [
  // Modern & Clean
  {
    id: 'modern-clean',
    name: 'Moderno e Pulito',
    description: 'Design minimalista con tipografia pulita',
    category: 'modern',
    title: 'Salone Bellezza Milano',
    subtitle: 'Professional Hair & Beauty Studio',
    titleFont: 'Inter',
    subtitleFont: 'Inter',
    titleSize: '3xl',
    subtitleSize: 'lg',
    titleColor: '#1f2937',
    subtitleColor: '#6b7280',
    backgroundColor: '#ffffff',
    spacing: 'tight',
    alignment: 'center',
    effects: {
      shadow: false,
      glow: false,
      border: false,
      borderColor: '#e5e7eb',
      borderWidth: '1px'
    }
  },
  {
    id: 'elegant-serif',
    name: 'Elegante Serif',
    description: 'Tipografia serif elegante e raffinata',
    category: 'elegant',
    title: 'Salone Bellezza Milano',
    subtitle: 'Professional Hair & Beauty Studio',
    titleFont: 'Playfair Display',
    subtitleFont: 'Inter',
    titleSize: '4xl',
    subtitleSize: 'lg',
    titleColor: '#1f2937',
    subtitleColor: '#6b7280',
    backgroundColor: '#fafafa',
    spacing: 'normal',
    alignment: 'center',
    effects: {
      shadow: true,
      glow: false,
      border: true,
      borderColor: '#e5e7eb',
      borderWidth: '1px'
    }
  },
  {
    id: 'bold-impact',
    name: 'Impatto Audace',
    description: 'Titolo grande e audace per massimo impatto',
    category: 'bold',
    title: 'SALONE BELLEZZA MILANO',
    subtitle: 'Professional Hair & Beauty Studio',
    titleFont: 'Inter',
    subtitleFont: 'Inter',
    titleSize: '5xl',
    subtitleSize: 'xl',
    titleColor: '#000000',
    subtitleColor: '#4b5563',
    backgroundColor: '#ffffff',
    spacing: 'tight',
    alignment: 'center',
    effects: {
      shadow: true,
      glow: false,
      border: false,
      borderColor: '#000000',
      borderWidth: '2px'
    }
  },
  {
    id: 'gradient-modern',
    name: 'Gradiente Moderno',
    description: 'Design moderno con gradiente colorato',
    category: 'modern',
    title: 'Salone Bellezza Milano',
    subtitle: 'Professional Hair & Beauty Studio',
    titleFont: 'Inter',
    subtitleFont: 'Inter',
    titleSize: '3xl',
    subtitleSize: 'lg',
    titleColor: '#ffffff',
    subtitleColor: '#e5e7eb',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    spacing: 'normal',
    alignment: 'center',
    effects: {
      shadow: true,
      glow: false,
      border: false,
      borderColor: '#667eea',
      borderWidth: '1px'
    }
  },
  {
    id: 'vintage-charm',
    name: 'Fascino Vintage',
    description: 'Stile vintage con tipografia classica',
    category: 'vintage',
    title: 'Salone Bellezza Milano',
    subtitle: 'Professional Hair & Beauty Studio',
    titleFont: 'Crimson Text',
    subtitleFont: 'Crimson Text',
    titleSize: '4xl',
    subtitleSize: 'lg',
    titleColor: '#8b4513',
    subtitleColor: '#a0522d',
    backgroundColor: '#fef7e6',
    spacing: 'normal',
    alignment: 'center',
    effects: {
      shadow: false,
      glow: false,
      border: true,
      borderColor: '#d4a574',
      borderWidth: '2px'
    }
  },
  {
    id: 'luxury-gold',
    name: 'Lusso Dorato',
    description: 'Design lussuoso con accenti dorati',
    category: 'luxury',
    title: 'Salone Bellezza Milano',
    subtitle: 'Professional Hair & Beauty Studio',
    titleFont: 'Playfair Display',
    subtitleFont: 'Inter',
    titleSize: '4xl',
    subtitleSize: 'lg',
    titleColor: '#d4af37',
    subtitleColor: '#b8860b',
    backgroundColor: '#1a1a1a',
    spacing: 'normal',
    alignment: 'center',
    effects: {
      shadow: true,
      glow: true,
      border: true,
      borderColor: '#d4af37',
      borderWidth: '1px'
    }
  },
  {
    id: 'nature-inspired',
    name: 'Ispirato alla Natura',
    description: 'Design organico con colori naturali',
    category: 'nature',
    title: 'Salone Bellezza Milano',
    subtitle: 'Professional Hair & Beauty Studio',
    titleFont: 'Inter',
    subtitleFont: 'Inter',
    titleSize: '3xl',
    subtitleSize: 'lg',
    titleColor: '#2d5016',
    subtitleColor: '#4a7c59',
    backgroundColor: '#f0f9f4',
    spacing: 'normal',
    alignment: 'center',
    effects: {
      shadow: false,
      glow: false,
      border: true,
      borderColor: '#4a7c59',
      borderWidth: '1px'
    }
  },
  {
    id: 'tech-futuristic',
    name: 'Futuristico Tech',
    description: 'Design futuristico con effetti tecnologici',
    category: 'tech',
    title: 'SALONE BELLEZZA MILANO',
    subtitle: 'Professional Hair & Beauty Studio',
    titleFont: 'Inter',
    subtitleFont: 'Inter',
    titleSize: '4xl',
    subtitleSize: 'lg',
    titleColor: '#00d4ff',
    subtitleColor: '#ffffff',
    backgroundColor: '#0a0a0a',
    spacing: 'tight',
    alignment: 'center',
    effects: {
      shadow: true,
      glow: true,
      border: true,
      borderColor: '#00d4ff',
      borderWidth: '1px'
    }
  },
  {
    id: 'romantic-pink',
    name: 'Romantico Rosa',
    description: 'Design romantico con tonalità rosa',
    category: 'romantic',
    title: 'Salone Bellezza Milano',
    subtitle: 'Professional Hair & Beauty Studio',
    titleFont: 'Dancing Script',
    subtitleFont: 'Inter',
    titleSize: '4xl',
    subtitleSize: 'lg',
    titleColor: '#ec4899',
    subtitleColor: '#be185d',
    backgroundColor: '#fdf2f8',
    spacing: 'normal',
    alignment: 'center',
    effects: {
      shadow: false,
      glow: false,
      border: true,
      borderColor: '#f9a8d4',
      borderWidth: '1px'
    }
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blu',
    description: 'Design professionale e aziendale',
    category: 'corporate',
    title: 'Salone Bellezza Milano',
    subtitle: 'Professional Hair & Beauty Studio',
    titleFont: 'Inter',
    subtitleFont: 'Inter',
    titleSize: '3xl',
    subtitleSize: 'lg',
    titleColor: '#1e40af',
    subtitleColor: '#3b82f6',
    backgroundColor: '#eff6ff',
    spacing: 'normal',
    alignment: 'left',
    effects: {
      shadow: false,
      glow: false,
      border: false,
      borderColor: '#3b82f6',
      borderWidth: '1px'
    }
  },
  {
    id: 'artistic-creative',
    name: 'Artistico Creativo',
    description: 'Design artistico e creativo',
    category: 'artistic',
    title: 'Salone Bellezza Milano',
    subtitle: 'Professional Hair & Beauty Studio',
    titleFont: 'Permanent Marker',
    subtitleFont: 'Inter',
    titleSize: '4xl',
    subtitleSize: 'lg',
    titleColor: '#7c3aed',
    subtitleColor: '#8b5cf6',
    backgroundColor: '#faf5ff',
    spacing: 'normal',
    alignment: 'center',
    effects: {
      shadow: true,
      glow: false,
      border: true,
      borderColor: '#c4b5fd',
      borderWidth: '2px'
    }
  },
  {
    id: 'minimalist-white',
    name: 'Minimalista Bianco',
    description: 'Design minimalista con molto spazio bianco',
    category: 'minimalist',
    title: 'Salone Bellezza Milano',
    subtitle: 'Professional Hair & Beauty Studio',
    titleFont: 'Inter',
    subtitleFont: 'Inter',
    titleSize: '2xl',
    subtitleSize: 'base',
    titleColor: '#374151',
    subtitleColor: '#9ca3af',
    backgroundColor: '#ffffff',
    spacing: 'loose',
    alignment: 'center',
    effects: {
      shadow: false,
      glow: false,
      border: false,
      borderColor: '#e5e7eb',
      borderWidth: '1px'
    }
  }
]

const fontOptions = [
  { value: 'Inter', label: 'Inter (Sans-serif)' },
  { value: 'Playfair Display', label: 'Playfair Display (Serif)' },
  { value: 'Crimson Text', label: 'Crimson Text (Serif)' },
  { value: 'Dancing Script', label: 'Dancing Script (Cursive)' },
  { value: 'Permanent Marker', label: 'Permanent Marker (Display)' },
  { value: 'Roboto', label: 'Roboto (Sans-serif)' },
  { value: 'Open Sans', label: 'Open Sans (Sans-serif)' },
  { value: 'Lato', label: 'Lato (Sans-serif)' },
  { value: 'Poppins', label: 'Poppins (Sans-serif)' },
  { value: 'Montserrat', label: 'Montserrat (Sans-serif)' }
]

const sizeOptions = [
  { value: 'xs', label: 'Extra Small (12px)' },
  { value: 'sm', label: 'Small (14px)' },
  { value: 'base', label: 'Base (16px)' },
  { value: 'lg', label: 'Large (18px)' },
  { value: 'xl', label: 'Extra Large (20px)' },
  { value: '2xl', label: '2XL (24px)' },
  { value: '3xl', label: '3XL (30px)' },
  { value: '4xl', label: '4XL (36px)' },
  { value: '5xl', label: '5XL (48px)' },
  { value: '6xl', label: '6XL (60px)' }
]

const gradientOptions = [
  { value: 'none', label: 'Nessun gradiente' },
  { value: 'blue-purple', label: 'Blu-Viola' },
  { value: 'green-blue', label: 'Verde-Blu' },
  { value: 'pink-orange', label: 'Rosa-Arancione' },
  { value: 'purple-pink', label: 'Viola-Rosa' },
  { value: 'orange-red', label: 'Arancione-Rosso' },
  { value: 'teal-blue', label: 'Teal-Blu' },
  { value: 'yellow-orange', label: 'Giallo-Arancione' },
  { value: 'red-pink', label: 'Rosso-Rosa' },
  { value: 'indigo-purple', label: 'Indigo-Viola' }
]

interface TitleTemplatesProps {
  salonData: any
  onTemplateApply: (templateData: any) => void
  saving?: boolean
}

export default function TitleTemplates({ salonData, onTemplateApply, saving = false }: TitleTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TitleTemplate>(titleTemplates[0] || {
    id: 'default',
    name: 'Default',
    description: 'Default template',
    category: 'modern',
    title: 'Salone Bellezza Milano',
    subtitle: 'Professional Hair & Beauty Studio',
    titleFont: 'Inter',
    subtitleFont: 'Inter',
    titleSize: '3xl',
    subtitleSize: 'lg',
    titleColor: '#1f2937',
    subtitleColor: '#6b7280',
    backgroundColor: '#ffffff',
    spacing: 'tight',
    alignment: 'center',
    effects: {
      shadow: false,
      glow: false,
      border: false,
      borderColor: '#e5e7eb',
      borderWidth: '1px'
    }
  })
  const [customTitle, setCustomTitle] = useState(selectedTemplate?.title || 'Salone Bellezza Milano')
  const [customSubtitle, setCustomSubtitle] = useState(selectedTemplate?.subtitle || 'Professional Hair & Beauty Studio')
  const [copied, setCopied] = useState<string | null>(null)

  const getGradientStyle = (gradient: string) => {
    const gradients = {
      'blue-purple': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'green-blue': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'pink-orange': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'purple-pink': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'orange-red': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'teal-blue': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'yellow-orange': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'red-pink': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'indigo-purple': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
    return gradients[gradient as keyof typeof gradients] || 'none'
  }

  const getSizeClass = (size: string) => {
    const sizeMap: { [key: string]: string } = {
      'xs': 'text-xs',
      'sm': 'text-sm',
      'base': 'text-base',
      'lg': 'text-lg',
      'xl': 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
      '6xl': 'text-6xl'
    }
    return sizeMap[size] || 'text-2xl'
  }

  const getSpacingClass = (spacing: string) => {
    const spacingMap: { [key: string]: string } = {
      'tight': 'space-y-1',
      'normal': 'space-y-2',
      'loose': 'space-y-4'
    }
    return spacingMap[spacing] || 'space-y-2'
  }

  const getAlignmentClass = (alignment: string) => {
    const alignmentMap: { [key: string]: string } = {
      'left': 'text-left',
      'center': 'text-center',
      'right': 'text-right'
    }
    return alignmentMap[alignment] || 'text-center'
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

  const renderTemplate = (template: TitleTemplate) => {
    if (!template) {
      return <div>Template non disponibile</div>
    }
    
    const backgroundStyle = template.gradient && template.gradient !== 'none' 
      ? { background: getGradientStyle(template.gradient) }
      : { backgroundColor: template.backgroundColor }

    return (
      <div 
        className={`p-8 rounded-lg ${getAlignmentClass(template.alignment)} ${getSpacingClass(template.spacing)}`}
        style={backgroundStyle}
      >
        {template.badge && (
          <Badge 
            className="mb-4"
            style={{ 
              backgroundColor: template.badge.backgroundColor,
              color: template.badge.color
            }}
          >
            {template.badge.text}
          </Badge>
        )}
        
        <h1 
          className={`${getSizeClass(template.titleSize)} font-bold leading-tight`}
          style={{ 
            color: template.titleColor,
            fontFamily: template.titleFont,
            textShadow: template.effects.shadow ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            filter: template.effects.glow ? 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' : 'none',
            border: template.effects.border ? `${template.effects.borderWidth} solid ${template.effects.borderColor}` : 'none',
            padding: template.effects.border ? '1rem' : '0',
            borderRadius: template.effects.border ? '0.5rem' : '0'
          }}
        >
          {customTitle}
        </h1>
        
        <p 
          className={`${getSizeClass(template.subtitleSize)} leading-relaxed`}
          style={{ 
            color: template.subtitleColor,
            fontFamily: template.subtitleFont
          }}
        >
          {customSubtitle}
        </p>
      </div>
    )
  }

  // Safety check to ensure selectedTemplate exists
  if (!selectedTemplate) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent>
            <p>Caricamento template...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Template Titoli e Sottotitoli
          </CardTitle>
          <CardDescription>
            Scegli tra diversi template predefiniti per titoli e sottotitoli con stili, font e sfondi diversi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-4">
            <Label>Seleziona Template</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {titleTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate.id === template.id 
                      ? 'ring-2 ring-violet-500 bg-violet-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (template) {
                      setSelectedTemplate(template)
                      setCustomTitle(template.title || '')
                      setCustomSubtitle(template.subtitle || '')
                    }
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
                <Label htmlFor="custom-title">Titolo Personalizzato</Label>
                <Input
                  id="custom-title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Inserisci il tuo titolo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-subtitle">Sottotitolo Personalizzato</Label>
                <Input
                  id="custom-subtitle"
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  placeholder="Inserisci il tuo sottotitolo"
                />
              </div>
            </div>
          </div>

          {/* Advanced Customization */}
          <div className="space-y-4">
            <Label>Personalizzazione Avanzata</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Font Titolo</Label>
                <Select 
                  value={selectedTemplate.titleFont} 
                  onValueChange={(value) => setSelectedTemplate({...selectedTemplate, titleFont: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Font Sottotitolo</Label>
                <Select 
                  value={selectedTemplate.subtitleFont} 
                  onValueChange={(value) => setSelectedTemplate({...selectedTemplate, subtitleFont: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Dimensione Titolo</Label>
                <Select 
                  value={selectedTemplate.titleSize} 
                  onValueChange={(value) => setSelectedTemplate({...selectedTemplate, titleSize: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptions.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Dimensione Sottotitolo</Label>
                <Select 
                  value={selectedTemplate.subtitleSize} 
                  onValueChange={(value) => setSelectedTemplate({...selectedTemplate, subtitleSize: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptions.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Colore Titolo</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={selectedTemplate.titleColor}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, titleColor: e.target.value})}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={selectedTemplate.titleColor}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, titleColor: e.target.value})}
                    placeholder="#000000"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Colore Sottotitolo</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={selectedTemplate.subtitleColor}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, subtitleColor: e.target.value})}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={selectedTemplate.subtitleColor}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, subtitleColor: e.target.value})}
                    placeholder="#666666"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Colore Sfondo</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={selectedTemplate.backgroundColor}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, backgroundColor: e.target.value})}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={selectedTemplate.backgroundColor}
                    onChange={(e) => setSelectedTemplate({...selectedTemplate, backgroundColor: e.target.value})}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Gradiente</Label>
                <Select 
                  value={selectedTemplate.gradient || 'none'} 
                  onValueChange={(value) => setSelectedTemplate({...selectedTemplate, gradient: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {gradientOptions.map((gradient) => (
                      <SelectItem key={gradient.value} value={gradient.value}>
                        {gradient.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Allineamento</Label>
                <Select 
                  value={selectedTemplate.alignment} 
                  onValueChange={(value) => setSelectedTemplate({...selectedTemplate, alignment: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Sinistra</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Destra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Spaziatura</Label>
                <Select 
                  value={selectedTemplate.spacing} 
                  onValueChange={(value) => setSelectedTemplate({...selectedTemplate, spacing: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tight">Compatta</SelectItem>
                    <SelectItem value="normal">Normale</SelectItem>
                    <SelectItem value="loose">Ampia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Effects */}
          <div className="space-y-4">
            <Label>Effetti</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedTemplate.effects.shadow}
                  onCheckedChange={(checked) => setSelectedTemplate({
                    ...selectedTemplate, 
                    effects: {...selectedTemplate.effects, shadow: checked}
                  })}
                />
                <Label>Ombra</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedTemplate.effects.glow}
                  onCheckedChange={(checked) => setSelectedTemplate({
                    ...selectedTemplate, 
                    effects: {...selectedTemplate.effects, glow: checked}
                  })}
                />
                <Label>Bagliore</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedTemplate.effects.border}
                  onCheckedChange={(checked) => setSelectedTemplate({
                    ...selectedTemplate, 
                    effects: {...selectedTemplate.effects, border: checked}
                  })}
                />
                <Label>Bordo</Label>
              </div>
              
              {selectedTemplate.effects.border && (
                <div className="space-y-2">
                  <Label>Colore Bordo</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="color"
                      value={selectedTemplate.effects.borderColor}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate, 
                        effects: {...selectedTemplate.effects, borderColor: e.target.value}
                      })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={selectedTemplate.effects.borderColor}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate, 
                        effects: {...selectedTemplate.effects, borderColor: e.target.value}
                      })}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              )}
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
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(customTitle, 'title')}
                >
                  {copied === 'title' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  Copia Titolo
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    if (selectedTemplate && onTemplateApply) {
                      onTemplateApply(selectedTemplate)
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
              {Array.from(new Set(titleTemplates.map(t => t.category))).map((category) => {
                const getCategoryIcon = (cat: string) => {
                  switch (cat) {
                    case 'modern': return <Sparkles className="w-3 h-3 mr-1" />
                    case 'elegant': return <Crown className="w-3 h-3 mr-1" />
                    case 'bold': return <Zap className="w-3 h-3 mr-1" />
                    case 'vintage': return <Gem className="w-3 h-3 mr-1" />
                    case 'luxury': return <Star className="w-3 h-3 mr-1" />
                    case 'nature': return <Leaf className="w-3 h-3 mr-1" />
                    case 'tech': return <Zap className="w-3 h-3 mr-1" />
                    case 'romantic': return <Heart className="w-3 h-3 mr-1" />
                    case 'corporate': return <Award className="w-3 h-3 mr-1" />
                    case 'artistic': return <Palette className="w-3 h-3 mr-1" />
                    case 'minimalist': return <Type className="w-3 h-3 mr-1" />
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
                      const categoryTemplate = titleTemplates.find(t => t.category === category)
                      if (categoryTemplate) {
                        setSelectedTemplate(categoryTemplate)
                        setCustomTitle(categoryTemplate.title)
                        setCustomSubtitle(categoryTemplate.subtitle)
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
