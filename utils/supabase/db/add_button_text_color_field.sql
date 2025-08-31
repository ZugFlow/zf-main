-- Add web_button_text_color field to salon_web_settings table
ALTER TABLE salon_web_settings 
ADD COLUMN web_button_text_color VARCHAR(7) DEFAULT '#ffffff';

-- Add comment to document the field
COMMENT ON COLUMN salon_web_settings.web_button_text_color IS 'Custom text color for buttons in hex format (e.g., #ffffff)';
