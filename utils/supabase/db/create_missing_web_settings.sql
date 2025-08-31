-- Create missing web settings for profiles
-- This script automatically creates web settings for profiles that don't have them
-- Uses only basic columns to avoid schema mismatch issues

-- Function to create web settings for a profile
CREATE OR REPLACE FUNCTION create_web_settings_for_profile(p_profile_id UUID)
RETURNS JSON AS $$
DECLARE
    profile_record RECORD;
    web_settings_record RECORD;
    result JSON;
BEGIN
    -- Get the profile information
    SELECT * INTO profile_record 
    FROM profiles 
    WHERE id = p_profile_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Profile not found'
        );
    END IF;
    
    -- Check if web settings already exist
    SELECT * INTO web_settings_record 
    FROM salon_web_settings 
    WHERE salon_id = profile_record.salon_id;
    
    IF FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Web settings already exist for this salon'
        );
    END IF;
    
    -- Create basic web settings with only essential columns
    INSERT INTO salon_web_settings (
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
        web_contact_form_enabled
    ) VALUES (
        profile_record.salon_id,
        false,
        COALESCE(profile_record.name, 'Il Mio Salone'),
        'Trasformiamo la tua bellezza in arte. Prenota il tuo appuntamento online per un''esperienza di bellezza straordinaria.',
        '#6366f1',
        '#8b5cf6',
        true,
        true,
        true,
        true,
        true,
        true
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'Web settings created successfully',
        'salon_id', profile_record.salon_id
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create web settings for all profiles that don't have them
DO $$
DECLARE
    profile_record RECORD;
    result JSON;
BEGIN
    FOR profile_record IN 
        SELECT p.id, p.salon_id, p.name, p.email
        FROM profiles p
        LEFT JOIN salon_web_settings sws ON sws.salon_id = p.salon_id
        WHERE p.salon_id IS NOT NULL 
        AND sws.id IS NULL
    LOOP
        RAISE NOTICE 'Creating web settings for profile: % (salon_id: %)', profile_record.email, profile_record.salon_id;
        
        result := create_web_settings_for_profile(profile_record.id);
        
        IF (result->>'success')::boolean THEN
            RAISE NOTICE 'Successfully created web settings for profile %', profile_record.email;
        ELSE
            RAISE NOTICE 'Failed to create web settings for profile %: %', profile_record.email, result->>'error';
        END IF;
    END LOOP;
END $$;

-- Verify the results
SELECT 
    'Verification' as check_type,
    COUNT(*) as total_profiles,
    COUNT(sws.id) as profiles_with_web_settings,
    COUNT(*) - COUNT(sws.id) as profiles_without_web_settings
FROM profiles p
LEFT JOIN salon_web_settings sws ON sws.salon_id = p.salon_id
WHERE p.salon_id IS NOT NULL;

-- Show profiles that still don't have web settings (if any)
SELECT 
    'Profiles Still Without Web Settings' as check_type,
    p.id,
    p.email,
    p.salon_id,
    p.name,
    p.role
FROM profiles p
LEFT JOIN salon_web_settings sws ON sws.salon_id = p.salon_id
WHERE p.salon_id IS NOT NULL 
AND sws.id IS NULL;
