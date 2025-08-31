-- Complete fix for salon web settings issue
-- Run this script in your Supabase SQL Editor to fix all the problems

-- 1. Add missing columns to salon_web_settings table
ALTER TABLE public.salon_web_settings 
ADD COLUMN IF NOT EXISTS web_layout_type VARCHAR(20) DEFAULT 'sidebar',
ADD COLUMN IF NOT EXISTS web_subtitle VARCHAR(255),
ADD COLUMN IF NOT EXISTS web_title_color VARCHAR(7) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS web_subtitle_color VARCHAR(7) DEFAULT '#666666',
ADD COLUMN IF NOT EXISTS web_text_color VARCHAR(7) DEFAULT '#333333',
ADD COLUMN IF NOT EXISTS web_salon_name_color VARCHAR(7) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS web_right_section_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS web_studio_text VARCHAR(500),
ADD COLUMN IF NOT EXISTS web_salon_name_font_size VARCHAR(10) DEFAULT '24px',
ADD COLUMN IF NOT EXISTS web_subtitle_font_size VARCHAR(10) DEFAULT '16px',
ADD COLUMN IF NOT EXISTS web_title_font_family VARCHAR(50) DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS web_subtitle_font_family VARCHAR(50) DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS web_description_color VARCHAR(7) DEFAULT '#666666',
ADD COLUMN IF NOT EXISTS web_description_font_family VARCHAR(50) DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS web_button_size VARCHAR(10) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS web_button_border_radius VARCHAR(10) DEFAULT '8px',
ADD COLUMN IF NOT EXISTS web_button_color VARCHAR(7) DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS web_button_border_color VARCHAR(7) DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS web_button_border_width VARCHAR(10) DEFAULT '1px',
ADD COLUMN IF NOT EXISTS web_button_type VARCHAR(20) DEFAULT 'filled',
ADD COLUMN IF NOT EXISTS web_button_quantity INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS web_button_primary_text VARCHAR(50) DEFAULT 'Prenota Ora',
ADD COLUMN IF NOT EXISTS web_button_secondary_text VARCHAR(50) DEFAULT 'Contattaci',
ADD COLUMN IF NOT EXISTS web_studio_text_font_size VARCHAR(10) DEFAULT '14px',
ADD COLUMN IF NOT EXISTS web_description_font_size VARCHAR(10) DEFAULT '16px',
ADD COLUMN IF NOT EXISTS web_carousel_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS web_carousel_autoplay BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS web_carousel_speed INTEGER DEFAULT 5000,
ADD COLUMN IF NOT EXISTS web_carousel_display_mode VARCHAR(20) DEFAULT 'single',
ADD COLUMN IF NOT EXISTS web_carousel_image_1 TEXT,
ADD COLUMN IF NOT EXISTS web_carousel_image_2 TEXT,
ADD COLUMN IF NOT EXISTS web_carousel_image_3 TEXT,
ADD COLUMN IF NOT EXISTS web_carousel_image_4 TEXT,
ADD COLUMN IF NOT EXISTS web_carousel_image_5 TEXT,
ADD COLUMN IF NOT EXISTS web_carousel_image_6 TEXT;

-- 2. Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'salon_web_settings_salon_id_fkey'
        AND table_name = 'salon_web_settings'
    ) THEN
        ALTER TABLE public.salon_web_settings 
        ADD CONSTRAINT salon_web_settings_salon_id_fkey 
        FOREIGN KEY (salon_id) REFERENCES public.profiles(salon_id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint salon_web_settings_salon_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint salon_web_settings_salon_id_fkey already exists';
    END IF;
END $$;

-- 3. Create missing web settings for profiles that don't have them
INSERT INTO public.salon_web_settings (
    salon_id,
    web_enabled,
    web_title,
    web_description,
    web_primary_color,
    web_secondary_color,
    web_booking_enabled,
    web_services_visible,
    web_team_visible,
    web_gallery_visible,
    web_testimonials_visible,
    web_contact_form_enabled,
    web_layout_type,
    web_subtitle,
    web_title_color,
    web_subtitle_color,
    web_text_color,
    web_salon_name_color,
    web_right_section_enabled,
    web_studio_text,
    web_salon_name_font_size,
    web_subtitle_font_size,
    web_title_font_family,
    web_subtitle_font_family,
    web_description_color,
    web_description_font_family,
    web_button_size,
    web_button_border_radius,
    web_button_color,
    web_button_border_color,
    web_button_border_width,
    web_button_type,
    web_button_quantity,
    web_button_primary_text,
    web_button_secondary_text,
    web_studio_text_font_size,
    web_description_font_size,
    web_carousel_enabled,
    web_carousel_autoplay,
    web_carousel_speed,
    web_carousel_display_mode
)
SELECT 
    p.salon_id,
    false as web_enabled,
    'Il Mio Salone' as web_title,
    'Trasformiamo la tua bellezza in arte. Prenota il tuo appuntamento online per un''esperienza di bellezza straordinaria.' as web_description,
    '#6366f1' as web_primary_color,
    '#8b5cf6' as web_secondary_color,
    true as web_booking_enabled,
    true as web_services_visible,
    true as web_team_visible,
    true as web_gallery_visible,
    true as web_testimonials_visible,
    true as web_contact_form_enabled,
    'sidebar' as web_layout_type,
    'La tua bellezza, la nostra passione' as web_subtitle,
    '#000000' as web_title_color,
    '#666666' as web_subtitle_color,
    '#333333' as web_text_color,
    '#000000' as web_salon_name_color,
    false as web_right_section_enabled,
    'Studio di bellezza professionale' as web_studio_text,
    '24px' as web_salon_name_font_size,
    '16px' as web_subtitle_font_size,
    'Inter' as web_title_font_family,
    'Inter' as web_subtitle_font_family,
    '#666666' as web_description_color,
    'Inter' as web_description_font_family,
    'medium' as web_button_size,
    '8px' as web_button_border_radius,
    '#6366f1' as web_button_color,
    '#6366f1' as web_button_border_color,
    '1px' as web_button_border_width,
    'filled' as web_button_type,
    2 as web_button_quantity,
    'Prenota Ora' as web_button_primary_text,
    'Contattaci' as web_button_secondary_text,
    '14px' as web_studio_text_font_size,
    '16px' as web_description_font_size,
    false as web_carousel_enabled,
    true as web_carousel_autoplay,
    5000 as web_carousel_speed,
    'single' as web_carousel_display_mode
FROM public.profiles p
WHERE p.salon_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.salon_web_settings sws 
    WHERE sws.salon_id = p.salon_id
);

-- 4. Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Users can view their own salon web settings" ON public.salon_web_settings;
CREATE POLICY "Users can view their own salon web settings" ON public.salon_web_settings
    FOR SELECT USING (
        salon_id IN (
            SELECT salon_id FROM public.profiles WHERE id = auth.uid()
            UNION
            SELECT salon_id FROM public.team WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own salon web settings" ON public.salon_web_settings;
CREATE POLICY "Users can update their own salon web settings" ON public.salon_web_settings
    FOR UPDATE USING (
        salon_id IN (
            SELECT salon_id FROM public.profiles WHERE id = auth.uid()
            UNION
            SELECT salon_id FROM public.team WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own salon web settings" ON public.salon_web_settings;
CREATE POLICY "Users can insert their own salon web settings" ON public.salon_web_settings
    FOR INSERT WITH CHECK (
        salon_id IN (
            SELECT salon_id FROM public.profiles WHERE id = auth.uid()
            UNION
            SELECT salon_id FROM public.team WHERE user_id = auth.uid()
        )
    );

-- 5. Enable RLS on the table if not already enabled
ALTER TABLE public.salon_web_settings ENABLE ROW LEVEL SECURITY;

-- 6. Verification query
SELECT 
    'Fix Complete' as status,
    COUNT(*) as total_web_settings,
    COUNT(CASE WHEN web_enabled = true THEN 1 END) as enabled_web_settings,
    COUNT(CASE WHEN web_subdomain IS NOT NULL AND web_subdomain != '' THEN 1 END) as web_settings_with_subdomain
FROM public.salon_web_settings;
