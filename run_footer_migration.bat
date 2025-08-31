@echo off
echo Running Footer Customization Migration...
echo.
echo Please make sure you have the following information ready:
echo - Your Supabase database URL
echo - Your Supabase database password
echo.
echo You can find these in your Supabase project settings.
echo.
pause

echo.
echo Running migration...
psql -h db.supabase.co -p 5432 -d postgres -U postgres -f utils/supabase/db/add_footer_customization_fields.sql

echo.
echo Migration completed!
pause
