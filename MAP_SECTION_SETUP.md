# Map Section Setup Guide

## Overview
The Map Section displays the salon's location using OpenStreetMap with Leaflet, providing an interactive map experience for visitors.

## Database Migration
The map section requires a new column in the `salon_web_settings` table:

```sql
-- Migration: add map section visibility field to salon_web_settings
ALTER TABLE public.salon_web_settings
ADD COLUMN IF NOT EXISTS web_map_visible BOOLEAN DEFAULT true;
-- Add comment for documentation
COMMENT ON COLUMN public.salon_web_settings.web_map_visible IS 'Controls visibility of the map section showing salon location';
```

## Dependencies
The map section uses the following packages:
- `leaflet`: Interactive maps library
- `react-leaflet`: React components for Leaflet

Install with:
```bash
npm install leaflet react-leaflet
```

## Configuration in Salon Page Builder

### 1. Enable Map Section
- Navigate to the **Layout** tab in the Salon Page Builder
- Under "Sezioni Visibili", toggle the **Mappa** switch to enable/disable the map section

### 2. Address Configuration
- In the **Content** tab, under "Contatti"
- Enter the complete address in the "Indirizzo" field
- **Important**: Include the full address (street, house number, city, postal code) for accurate map positioning
- The system uses OpenStreetMap's Nominatim API for geocoding

### 3. Parallax Effect (Optional)
- In the **Layout** tab, under "Effetto Parallax"
- Check "Mappa" in the "Sezioni con Parallax" options to apply parallax effect to the map section

## Features

### Interactive Map
- **OpenStreetMap Integration**: Uses OpenStreetMap tiles for map display
- **Geocoding**: Automatically converts address to coordinates using Nominatim API
- **Interactive Marker**: Clickable marker with salon information popup
- **Responsive Design**: Adapts to different screen sizes

### Map Controls
- **Zoom Control**: Users can zoom in/out of the map
- **Marker Popup**: Clicking the marker shows salon name and address
- **Directions Button**: Opens OpenStreetMap with directions to the salon

### Visual Customization
- **Salon Overlay**: Displays salon logo and information on the map
- **Custom Styling**: Integrates with salon's color scheme
- **Loading States**: Shows loading spinner while geocoding address

## Technical Details

### Geocoding Process
1. When the page loads, the system sends the salon address to OpenStreetMap's Nominatim API
2. The API returns latitude and longitude coordinates
3. The map centers on these coordinates with a zoom level of 15
4. A marker is placed at the exact location

### Error Handling
- **Address Not Found**: Shows a placeholder with "Indirizzo non trovato" message
- **Geocoding Error**: Displays loading state indefinitely
- **Network Issues**: Graceful fallback to search-based navigation

### Performance Optimizations
- **Dynamic Imports**: Leaflet components are loaded only when needed
- **SSR Compatibility**: Uses dynamic imports to avoid server-side rendering issues
- **Lazy Loading**: Map tiles are loaded on demand

## Customization Options

### Map Styling
The map integrates with the salon's design system:
- Uses salon's primary and secondary colors for overlays
- Applies border radius and shadow settings from salon configuration
- Responsive design adapts to different screen sizes

### Marker Customization
- Default Leaflet marker with salon information popup
- Popup includes salon name and address
- Styled to match salon's branding

## Troubleshooting

### Map Not Loading
1. **Check Address**: Ensure the address is complete and accurate
2. **Network Connection**: Verify internet connection for geocoding API
3. **Browser Console**: Check for JavaScript errors in browser console

### Address Not Found
1. **Verify Address**: Double-check spelling and completeness
2. **Try Alternative Format**: Use different address formats (e.g., "Via Roma 123, Milano" vs "Roma 123, Milano")
3. **Manual Coordinates**: Consider adding manual coordinate support if needed

### Performance Issues
1. **Clear Cache**: Clear browser cache and reload
2. **Check Network**: Ensure stable internet connection
3. **Reduce Zoom**: Lower zoom levels load faster

## Best Practices

### Address Entry
- Use complete addresses including street number
- Include city and postal code for better accuracy
- Avoid abbreviations when possible
- Test with multiple address formats

### User Experience
- The map provides immediate visual context for salon location
- Interactive elements enhance engagement
- Loading states provide clear feedback
- Fallback options ensure functionality even with errors

## Future Enhancements
- Custom marker icons with salon branding
- Multiple location support for chain salons
- Integration with public transport information
- Real-time traffic data integration
- Custom map styles and themes
