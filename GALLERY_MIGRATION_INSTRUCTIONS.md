# Gallery Migration Instructions

## Database Migration

To add the gallery functionality to your salon web settings, you need to run the following SQL migration:

```sql
-- Add gallery fields to salon_web_settings table
ALTER TABLE salon_web_settings 
ADD COLUMN web_gallery_enabled BOOLEAN DEFAULT false,
ADD COLUMN web_gallery_title VARCHAR(255) DEFAULT 'La Nostra Galleria',
ADD COLUMN web_gallery_subtitle TEXT,
ADD COLUMN web_gallery_image_1 VARCHAR(500),
ADD COLUMN web_gallery_image_2 VARCHAR(500),
ADD COLUMN web_gallery_image_3 VARCHAR(500),
ADD COLUMN web_gallery_image_4 VARCHAR(500),
ADD COLUMN web_gallery_image_5 VARCHAR(500),
ADD COLUMN web_gallery_image_6 VARCHAR(500),
ADD COLUMN web_gallery_image_7 VARCHAR(500),
ADD COLUMN web_gallery_image_8 VARCHAR(500);
```

## How to Run the Migration

1. **Via Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the SQL above
   - Click "Run" to execute the migration

2. **Via Supabase CLI:**
   ```bash
   supabase db push
   ```

## Features Added

### Gallery Section
- **Horizontal scrolling gallery** that appears under the hero section
- **Up to 8 images** can be added
- **Customizable title and subtitle**
- **Responsive design** with hover effects
- **Hidden scrollbar** for clean appearance

### Configuration Options
- **Enable/Disable** gallery via Layout tab
- **Custom title** and subtitle
- **Image URLs** for up to 8 images
- **Automatic styling** using salon's color scheme

### Usage
1. Go to the **Layout** tab in the Salon Page Builder
2. Enable the **"Galleria Orizzontale"** section
3. Add your **gallery title** and **subtitle**
4. Add **image URLs** for your gallery images
5. Save the changes

The gallery will appear as a horizontal scrolling section with your salon's branding colors and styling.
