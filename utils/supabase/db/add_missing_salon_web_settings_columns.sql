-- Add missing columns to salon_web_settings table
-- This script adds all the columns that are referenced in the code but might be missing from the database

-- Basic layout and styling columns
ALTER TABLE public.salon_web_settings 
ADD COLUMN IF NOT EXISTS web_layout_type VARCHAR(20) DEFAULT 'sidebar',
ADD COLUMN IF NOT EXISTS web_subtitle VARCHAR(255),
ADD COLUMN IF NOT EXISTS web_title_color VARCHAR(7) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS web_subtitle_color VARCHAR(7) DEFAULT '#666666',
ADD COLUMN IF NOT EXISTS web_text_color VARCHAR(7) DEFAULT '#333333',
ADD COLUMN IF NOT EXISTS web_salon_name_color VARCHAR(7) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS web_right_section_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS web_studio_text VARCHAR(50) DEFAULT 'STUDIO',
ADD COLUMN IF NOT EXISTS web_salon_name_font_size VARCHAR(20) DEFAULT 'large',
ADD COLUMN IF NOT EXISTS web_subtitle_font_size VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS web_studio_text_font_size VARCHAR(20) DEFAULT 'small',
ADD COLUMN IF NOT EXISTS web_description_font_size VARCHAR(20) DEFAULT 'x-large',
ADD COLUMN IF NOT EXISTS web_title_font_family VARCHAR(50),
ADD COLUMN IF NOT EXISTS web_subtitle_font_family VARCHAR(50),
ADD COLUMN IF NOT EXISTS web_description_color VARCHAR(7) DEFAULT '#333333',
ADD COLUMN IF NOT EXISTS web_description_font_family VARCHAR(50);

-- Bold styling columns
ALTER TABLE public.salon_web_settings 
ADD COLUMN IF NOT EXISTS web_title_bold BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS web_subtitle_bold BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS web_description_bold BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS web_studio_text_bold BOOLEAN DEFAULT false;

-- Button styling columns
ALTER TABLE public.salon_web_settings 
ADD COLUMN IF NOT EXISTS web_button_size VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS web_button_border_radius VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS web_button_color VARCHAR(7) DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS web_button_border_color VARCHAR(7),
ADD COLUMN IF NOT EXISTS web_button_border_width VARCHAR(10) DEFAULT '0',
ADD COLUMN IF NOT EXISTS web_button_text_color VARCHAR(7) DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS web_button_transparent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS web_button_type VARCHAR(20) DEFAULT 'primary',
ADD COLUMN IF NOT EXISTS web_button_quantity INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS web_button_primary_text VARCHAR(100) DEFAULT 'Prenota Ora',
ADD COLUMN IF NOT EXISTS web_button_secondary_text VARCHAR(100) DEFAULT 'Contattaci';

-- Carousel columns
ALTER TABLE public.salon_web_settings 
ADD COLUMN IF NOT EXISTS web_carousel_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS web_carousel_autoplay BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS web_carousel_speed INTEGER DEFAULT 3000,
ADD COLUMN IF NOT EXISTS web_carousel_display_mode VARCHAR(20) DEFAULT 'single',
ADD COLUMN IF NOT EXISTS web_carousel_image_1 TEXT,
ADD COLUMN IF NOT EXISTS web_carousel_image_2 TEXT,
ADD COLUMN IF NOT EXISTS web_carousel_image_3 TEXT,
ADD COLUMN IF NOT EXISTS web_carousel_image_4 TEXT,
ADD COLUMN IF NOT EXISTS web_carousel_image_5 TEXT,
ADD COLUMN IF NOT EXISTS web_carousel_image_6 TEXT;

-- Gallery columns
ALTER TABLE public.salon_web_settings 
ADD COLUMN IF NOT EXISTS web_gallery_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS web_gallery_title VARCHAR(255) DEFAULT 'Galleria',
ADD COLUMN IF NOT EXISTS web_gallery_title_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS web_gallery_subtitle VARCHAR(255),
ADD COLUMN IF NOT EXISTS web_gallery_image_1 TEXT,
ADD COLUMN IF NOT EXISTS web_gallery_image_2 TEXT,
ADD COLUMN IF NOT EXISTS web_gallery_image_3 TEXT,
ADD COLUMN IF NOT EXISTS web_gallery_image_4 TEXT,
ADD COLUMN IF NOT EXISTS web_gallery_image_5 TEXT,
ADD COLUMN IF NOT EXISTS web_gallery_image_6 TEXT,
ADD COLUMN IF NOT EXISTS web_gallery_image_7 TEXT,
ADD COLUMN IF NOT EXISTS web_gallery_image_8 TEXT,
ADD COLUMN IF NOT EXISTS web_gallery_full_width BOOLEAN DEFAULT false;

-- Additional visibility columns
ALTER TABLE public.salon_web_settings 
ADD COLUMN IF NOT EXISTS web_carousel_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS web_map_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS web_opening_hours_visible BOOLEAN DEFAULT true;

-- Profile photo column
ALTER TABLE public.salon_web_settings 
ADD COLUMN IF NOT EXISTS web_profile_photo_url TEXT;

-- Advanced styling columns
ALTER TABLE public.salon_web_settings 
ADD COLUMN IF NOT EXISTS web_layout_style VARCHAR(50) DEFAULT 'default',
ADD COLUMN IF NOT EXISTS web_header_style VARCHAR(50) DEFAULT 'default',
ADD COLUMN IF NOT EXISTS web_footer_style VARCHAR(50) DEFAULT 'default',
ADD COLUMN IF NOT EXISTS web_animation_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS web_parallax_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS web_parallax_image TEXT,
ADD COLUMN IF NOT EXISTS web_parallax_speed INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS web_parallax_opacity DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS web_parallax_sections TEXT[],
ADD COLUMN IF NOT EXISTS web_dark_mode_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS web_show_search BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS web_show_breadcrumbs BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS web_show_social_share BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS web_show_back_to_top BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS web_show_loading_animation BOOLEAN DEFAULT true;

-- Typography and spacing columns
ALTER TABLE public.salon_web_settings 
ADD COLUMN IF NOT EXISTS web_custom_font VARCHAR(50) DEFAULT 'default',
ADD COLUMN IF NOT EXISTS web_font_size VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS web_line_height VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS web_spacing VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS web_border_radius VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS web_shadow_style VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS web_transition_speed VARCHAR(20) DEFAULT 'normal';

-- Map specific columns
ALTER TABLE public.salon_web_settings 
ADD COLUMN IF NOT EXISTS web_map_badge_text VARCHAR(100) DEFAULT 'Siamo qui',
ADD COLUMN IF NOT EXISTS web_map_title VARCHAR(255) DEFAULT 'Dove trovarci',
ADD COLUMN IF NOT EXISTS web_map_subtitle VARCHAR(255),
ADD COLUMN IF NOT EXISTS web_map_opening_hours VARCHAR(255),
ADD COLUMN IF NOT EXISTS web_map_call_button_text VARCHAR(100) DEFAULT 'Chiama ora',
ADD COLUMN IF NOT EXISTS web_map_button_color VARCHAR(7) DEFAULT '#6366f1';

-- Add comments for documentation
COMMENT ON COLUMN public.salon_web_settings.web_layout_type IS 'Layout type: sidebar (left sidebar) or navbar (top navigation bar)';
COMMENT ON COLUMN public.salon_web_settings.web_studio_text IS 'Text displayed as studio badge';
COMMENT ON COLUMN public.salon_web_settings.web_right_section_enabled IS 'Whether to show the right section in sidebar layout';
COMMENT ON COLUMN public.salon_web_settings.web_carousel_enabled IS 'Whether to enable image carousel';
COMMENT ON COLUMN public.salon_web_settings.web_gallery_enabled IS 'Whether to enable image gallery';
COMMENT ON COLUMN public.salon_web_settings.web_parallax_enabled IS 'Whether to enable parallax scrolling effects';

-- Verify the columns were added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'salon_web_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;
