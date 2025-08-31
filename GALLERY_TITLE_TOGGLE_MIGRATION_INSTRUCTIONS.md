# Gallery Title Toggle Migration Instructions

## Overview
This migration adds a new field `web_gallery_title_enabled` to the `salon_web_settings` table to allow users to enable or disable the gallery title text.

## New Feature
- **Field**: `web_gallery_title_enabled` (BOOLEAN, default: true)
- **Purpose**: Controls whether the gallery title is displayed on the salon's web page
- **Default Value**: true (title is shown by default)

## Database Migration

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL command:

```sql
-- Add web_gallery_title_enabled field to salon_web_settings table
ALTER TABLE salon_web_settings 
ADD COLUMN web_gallery_title_enabled BOOLEAN DEFAULT true;
```

### Option 2: Supabase CLI
If you have the Supabase CLI installed, you can run:

```bash
supabase db push
```

Or manually execute the SQL file:
```bash
psql -h your-project-ref.supabase.co -U postgres -d postgres -f utils/supabase/db/add_gallery_title_enabled_field.sql
```

## Implementation Details

### Files Modified:
1. **`utils/supabase/db/add_gallery_title_enabled_field.sql`** - Database migration
2. **`app/salon/[subdomain]/components/SalonPageBuilder.tsx`** - Added toggle switch in gallery configuration
3. **`app/salon/[subdomain]/components/DynamicSalonPage.tsx`** - Conditional rendering of gallery title

### New UI Elements:
- Toggle switch labeled "Mostra Titolo Galleria" in the gallery configuration
- When disabled, the title input field is hidden
- When disabled, the gallery title is not displayed on the public page

### Behavior:
- **Default**: Title is enabled (shown)
- **When enabled**: Title and subtitle are displayed above the gallery
- **When disabled**: Only the gallery images are shown, no title section

## Testing
After running the migration:
1. Go to your salon's page builder
2. Navigate to the "Layout" tab
3. Find the "Galleria Orizzontale" section
4. Test the "Mostra Titolo Galleria" toggle
5. Verify that the title appears/disappears on the public page accordingly
