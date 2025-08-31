# Parallax Effect Implementation

## Overview

This implementation adds a sophisticated parallax scrolling effect to the salon web pages, creating depth and visual interest through layered background images that move at different speeds during scroll.

## Features

### 1. Configurable Parallax Settings
- **Enable/Disable**: Toggle parallax effect on/off
- **Background Image**: Custom image URL for parallax background
- **Speed Control**: Adjustable scroll speed (0.1 to 0.9)
- **Opacity Control**: Customizable image opacity (0.1 to 0.7)
- **Section Targeting**: Choose which sections to apply parallax to

### 2. Supported Sections
- **Hero Section**: Main landing area with strongest parallax effect
- **Services Section**: Subtle parallax for service cards
- **Team Section**: Light parallax for team member profiles
- **Gallery Section**: Medium parallax for gallery display

### 3. Performance Optimized
- Uses CSS transforms for smooth animations
- Efficient scroll event handling
- Reduced opacity on secondary sections to maintain readability

## Database Schema

### New Fields Added to `salon_web_settings`:

```sql
-- Enable/disable parallax effect
web_parallax_enabled BOOLEAN DEFAULT false

-- Background image URL for parallax
web_parallax_image TEXT

-- Parallax scroll speed (0.1 to 1.0)
web_parallax_speed DECIMAL(3,2) DEFAULT 0.5

-- Background image opacity (0.0 to 1.0)
web_parallax_opacity DECIMAL(3,2) DEFAULT 0.3

-- Array of sections where parallax should be applied
web_parallax_sections TEXT[] DEFAULT ARRAY['hero', 'services', 'team', 'gallery']
```

## Implementation Details

### 1. Custom Hook (`hooks/useParallax.ts`)
- `useParallaxBackground`: Handles background image parallax effects
- Configurable speed and enabled state
- Efficient scroll event management

### 2. Dynamic Salon Page (`DynamicSalonPage.tsx`)
- Implements parallax effects across multiple sections
- Uses data attributes for performance optimization
- Responsive design considerations

### 3. Page Builder (`SalonPageBuilder.tsx`)
- Comprehensive parallax configuration interface
- Real-time preview of parallax effects
- Section-specific controls

## Usage

### 1. Enable Parallax Effect
1. Navigate to the salon page builder
2. Go to the "Layout" tab
3. Find the "Effetto Parallax" section
4. Toggle "Abilita Parallax" to ON

### 2. Configure Settings
- **Background Image**: Add a high-quality image URL
- **Speed**: Choose from 5 speed levels (0.1 to 0.9)
- **Opacity**: Select opacity level (0.1 to 0.7)
- **Sections**: Check which sections should have parallax

### 3. Preview and Save
- Use the preview section to see the effect
- Save changes to apply to the live page

## Technical Implementation

### Scroll Event Handler
```javascript
useEffect(() => {
  if (!salonData?.web_parallax_enabled) return

  const handleScroll = () => {
    const scrolled = window.pageYOffset
    const parallaxElements = document.querySelectorAll('[data-parallax]')
    
    parallaxElements.forEach((element) => {
      const speed = parseFloat(element.getAttribute('data-speed') || '0.5')
      const yPos = -(scrolled * speed)
      element.style.transform = `translateY(${yPos}px)`
    })
  }

  window.addEventListener('scroll', handleScroll)
  return () => window.removeEventListener('scroll', handleScroll)
}, [salonData?.web_parallax_enabled])
```

### CSS Implementation
```css
.parallax-background {
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  transition: transform 0.1s ease-out;
}
```

## Migration

### Run Migration Script
```bash
node run_parallax_migration.js
```

This will add all necessary database fields to support the parallax feature.

## Best Practices

### 1. Image Selection
- Use high-resolution images (1920x1080 or higher)
- Choose images with good contrast
- Avoid busy patterns that might interfere with text readability

### 2. Performance
- Keep image file sizes reasonable (< 2MB)
- Use WebP format when possible
- Consider lazy loading for multiple parallax images

### 3. Accessibility
- Ensure sufficient contrast between text and parallax backgrounds
- Provide fallbacks for users with reduced motion preferences
- Test with screen readers

## Browser Compatibility

- **Modern Browsers**: Full support with smooth animations
- **Mobile Devices**: Reduced parallax effect for better performance
- **Older Browsers**: Graceful degradation to static backgrounds

## Troubleshooting

### Common Issues

1. **Parallax not working**
   - Check if `web_parallax_enabled` is true
   - Verify image URL is accessible
   - Ensure sections are selected in `web_parallax_sections`

2. **Performance issues**
   - Reduce image file size
   - Lower parallax speed
   - Disable parallax on mobile devices

3. **Visual glitches**
   - Check image aspect ratio
   - Adjust opacity settings
   - Test with different background colors

## Future Enhancements

- Multiple parallax layers
- Directional parallax effects
- Parallax on individual elements
- Advanced easing functions
- Mobile-optimized parallax
