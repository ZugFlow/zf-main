# Map Button Styling Setup

This document explains how to set up the map button styling feature that allows customizing the colors, fonts, and borders of the map section call button.

## Database Migration

### Step 1: Add New Fields to Database

Execute the following SQL in your Supabase SQL Editor:

```sql
-- Add map button styling fields to salon_web_settings table
ALTER TABLE salon_web_settings 
ADD COLUMN IF NOT EXISTS web_map_button_color VARCHAR(7) DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS web_map_button_text_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS web_map_button_border_color VARCHAR(7) DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS web_map_button_border_width VARCHAR(10) DEFAULT '1px',
ADD COLUMN IF NOT EXISTS web_map_button_border_radius VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS web_map_button_size VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS web_map_button_transparent BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN salon_web_settings.web_map_button_color IS 'Background color for the map section call button';
COMMENT ON COLUMN salon_web_settings.web_map_button_text_color IS 'Text color for the map section call button';
COMMENT ON COLUMN salon_web_settings.web_map_button_border_color IS 'Border color for the map section call button';
COMMENT ON COLUMN salon_web_settings.web_map_button_border_width IS 'Border width for the map section call button';
COMMENT ON COLUMN salon_web_settings.web_map_button_border_radius IS 'Border radius for the map section call button (none, small, medium, large, full)';
COMMENT ON COLUMN salon_web_settings.web_map_button_size IS 'Size for the map section call button (small, medium, large, xl)';
COMMENT ON COLUMN salon_web_settings.web_map_button_transparent IS 'Whether the map section call button should be transparent with only border';
```

### Step 2: Regenerate Database Types

After running the migration, regenerate your database types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

## Features Added

### New Fields in salon_web_settings Table

1. **web_map_button_color** - Background color for the map call button
2. **web_map_button_text_color** - Text color for the map call button  
3. **web_map_button_border_color** - Border color for the map call button
4. **web_map_button_border_width** - Border width (0px, 1px, 2px, 3px, 4px)
5. **web_map_button_border_radius** - Border radius (none, small, medium, large, full)
6. **web_map_button_size** - Button size (small, medium, large, xl)
7. **web_map_button_transparent** - Boolean to make button transparent with only border

### UI Components Updated

1. **SalonPageBuilder.tsx** - Added map button styling controls in the Content tab
2. **DynamicSalonPage.tsx** - Updated map button to use custom styles
3. **MapComponent.tsx** - Ready to receive custom styling props

## Usage

### In the Builder Interface

1. Go to the salon web page builder
2. Navigate to the "Contenuto" tab
3. Scroll down to the "Sezione Mappa" section
4. Use the "Stile Pulsante Mappa" controls to customize:
   - Button transparency
   - Size and border radius
   - Background color
   - Text color
   - Border color and width
5. Preview the button in real-time
6. Save your changes

### Default Values

- Background Color: #6366f1 (violet)
- Text Color: #ffffff (white)
- Border Color: #6366f1 (violet)
- Border Width: 1px
- Border Radius: medium
- Size: medium
- Transparent: false

## Technical Implementation

### Helper Functions

The implementation uses existing helper functions:
- `getButtonBorderRadius()` - Converts radius options to CSS values
- `getButtonPadding()` - Converts size options to padding values
- `getButtonFontSize()` - Converts size options to font size values

### Style Application

The map button styles are applied using inline styles in the DynamicSalonPage component:

```tsx
style={{ 
  background: salonData.web_map_button_transparent ? 'transparent' : (salonData.web_map_button_color || `linear-gradient(135deg, ${salonData.web_primary_color || '#6366f1'}, ${salonData.web_secondary_color || '#8b5cf6'})`),
  borderRadius: getButtonBorderRadius(salonData.web_map_button_border_radius || 'medium'),
  borderColor: salonData.web_map_button_border_color || (salonData.web_map_button_transparent ? '#6366f1' : 'transparent'),
  borderWidth: salonData.web_map_button_border_width || (salonData.web_map_button_transparent ? '2px' : '0px'),
  borderStyle: 'solid',
  color: salonData.web_map_button_transparent ? (salonData.web_map_button_text_color || '#6366f1') : (salonData.web_map_button_text_color || '#ffffff')
}}
```

## Fallback Behavior

If map button styling fields are not set, the system falls back to:
1. Primary/secondary color gradient for background
2. Default button styling from the main button configuration
3. Standard white text color

## Testing

To test the feature:

1. Run the database migration
2. Restart your development server
3. Go to a salon's web page builder
4. Customize the map button styles
5. Save and preview the changes
6. Verify the styles are applied correctly in the live page

## Troubleshooting

### Common Issues

1. **Styles not applying**: Check if the database migration was successful
2. **Type errors**: Regenerate database types after migration
3. **Default values not working**: Ensure the migration set proper default values

### Debug Steps

1. Check browser console for any errors
2. Verify database fields exist in Supabase dashboard
3. Confirm the salon_web_settings record has the new fields
4. Check if the styling is being applied in the component
