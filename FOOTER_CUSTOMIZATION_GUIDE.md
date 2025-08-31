# Footer Customization Guide

## Overview

The footer of salon web pages is now fully customizable with comprehensive options for colors, typography, layout, and content. This guide explains all the available customization options.

## Database Migration

Before using the footer customization features, you need to run the database migration:

```bash
# Run the migration script
psql -h db.supabase.co -p 5432 -d postgres -U postgres -f utils/supabase/db/add_footer_customization_fields.sql
```

Or use the provided batch script on Windows:
```bash
run_footer_migration.bat
```

## Available Customization Options

### 1. Content Customization

#### Copyright Text
- **Field**: `web_footer_copyright_text`
- **Default**: `© 2024 {salon_name}. Tutti i diritti riservati.`
- **Description**: Custom copyright text with `{salon_name}` placeholder

#### Visibility Controls
- **Show Social Links**: `web_footer_show_social_links` (boolean)
- **Show Contact Info**: `web_footer_show_contact_info` (boolean)
- **Show Copyright**: `web_footer_show_copyright` (boolean)

### 2. Color Customization

#### Background Colors
- **Background Color**: `web_footer_background_color`
- **Gradient Enabled**: `web_footer_gradient_enabled`
- **Gradient From Color**: `web_footer_gradient_from_color`
- **Gradient To Color**: `web_footer_gradient_to_color`
- **Gradient Direction**: `web_footer_gradient_direction`

#### Text Colors
- **Main Text Color**: `web_footer_text_color`
- **Title Color**: `web_footer_title_color`
- **Subtitle Color**: `web_footer_subtitle_color`
- **Description Color**: `web_footer_description_color`
- **Link Color**: `web_footer_link_color`
- **Link Hover Color**: `web_footer_link_hover_color`
- **Copyright Color**: `web_footer_copyright_color`

#### Border and Icon Colors
- **Border Color**: `web_footer_border_color`
- **Social Icon Color**: `web_footer_social_icon_color`
- **Social Icon Hover Color**: `web_footer_social_icon_hover_color`

### 3. Typography Customization

#### Font Families
- **Title Font**: `web_footer_title_font_family`
- **Subtitle Font**: `web_footer_subtitle_font_family`
- **Description Font**: `web_footer_description_font_family`
- **Copyright Font**: `web_footer_copyright_font_family`

#### Font Sizes
- **Title Size**: `web_footer_title_font_size`
- **Subtitle Size**: `web_footer_subtitle_font_size`
- **Description Size**: `web_footer_description_font_size`
- **Copyright Size**: `web_footer_copyright_font_size`

#### Font Weights
- **Title Bold**: `web_footer_title_bold`
- **Subtitle Bold**: `web_footer_subtitle_bold`
- **Description Bold**: `web_footer_description_bold`

### 4. Layout and Spacing

#### Layout Style
- **Layout Style**: `web_footer_layout_style`
  - `default`: Standard layout
  - `compact`: Reduced spacing
  - `wide`: Extended spacing
  - `centered`: Centered content

#### Padding and Margins
- **Padding Top**: `web_footer_padding_top`
- **Padding Bottom**: `web_footer_padding_bottom`
- **Margin Top**: `web_footer_margin_top`

#### Borders
- **Border Top Width**: `web_footer_border_top_width`
- **Border Top Style**: `web_footer_border_top_style`
- **Border Top Color**: `web_footer_border_top_color`
- **Border Radius**: `web_footer_border_radius`

### 5. Visual Effects

#### Background Effects
- **Pattern Enabled**: `web_footer_pattern_enabled`
- **Pattern Color**: `web_footer_pattern_color`
- **Pattern Opacity**: `web_footer_pattern_opacity`
- **Pattern Size**: `web_footer_pattern_size`

#### Additional Effects
- **Shadow**: `web_footer_shadow`
- **Opacity**: `web_footer_opacity`
- **Backdrop Blur**: `web_footer_backdrop_blur`

## Usage Examples

### 1. Dark Theme Footer
```javascript
{
  web_footer_background_color: '#1a1a1a',
  web_footer_text_color: '#ffffff',
  web_footer_title_color: '#ffffff',
  web_footer_subtitle_color: '#9ca3af',
  web_footer_border_color: '#374151'
}
```

### 2. Gradient Background Footer
```javascript
{
  web_footer_gradient_enabled: true,
  web_footer_gradient_from_color: '#6366f1',
  web_footer_gradient_to_color: '#8b5cf6',
  web_footer_gradient_direction: 'to-br',
  web_footer_text_color: '#ffffff'
}
```

### 3. Compact Footer
```javascript
{
  web_footer_layout_style: 'compact',
  web_footer_padding_top: '24px',
  web_footer_padding_bottom: '16px',
  web_footer_show_description: false
}
```

### 4. Centered Footer
```javascript
{
  web_footer_layout_style: 'centered',
  web_footer_show_social_links: true,
  web_footer_show_contact_info: true,
  web_footer_show_copyright: true
}
```

## Implementation Details

### SalonPageBuilder Component
The builder includes a comprehensive "Personalizzazione Footer" section with:
- Color pickers for all color options
- Typography controls
- Layout style selection
- Visibility toggles
- Real-time preview

### DynamicSalonPage Component
The footer implementation includes:
- Conditional rendering based on visibility settings
- Dynamic styling based on customization options
- Hover effects for interactive elements
- Responsive design for all layout styles

## Migration Notes

The migration adds 50+ new fields to the `salon_web_settings` table. All fields have sensible defaults, so existing pages will continue to work without modification.

## Browser Compatibility

All footer customization features work in modern browsers that support:
- CSS Grid and Flexbox
- CSS Custom Properties
- CSS Gradients
- CSS Filters and Backdrop Filters

## Performance Considerations

- Gradient backgrounds are GPU-accelerated
- Pattern backgrounds use CSS-only implementation
- Hover effects use CSS transitions for smooth animations
- All customization options are applied via inline styles for maximum compatibility

## Troubleshooting

### Common Issues

1. **Footer not updating**: Ensure the migration has been run successfully
2. **Colors not applying**: Check that color values are valid hex codes
3. **Layout issues**: Verify that layout style values are correct
4. **Font not loading**: Ensure font family values match available system fonts

### Debug Mode

To debug footer customization, check the browser console for any CSS-related errors and verify that all customization fields are properly set in the database.
