@echo off
echo ========================================
echo Setup Impostazioni Modal Appuntamento
echo ========================================
echo.

echo 1. Verifica ambiente...
if not exist ".env" (
    echo ❌ File .env non trovato
    echo Crea il file .env con le tue credenziali Supabase
    pause
    exit /b 1
)

echo ✅ Ambiente verificato
echo.

echo 2. Esegui test di verifica...
node test_modal_settings.js
if %errorlevel% neq 0 (
    echo ❌ Test fallito
    pause
    exit /b 1
)

echo ✅ Test completato con successo
echo.

echo 3. Prossimi passi:
echo    - Esegui gli script SQL nel tuo database Supabase:
echo      * appointment_modal_settings.sql
echo      * enable_realtime_appointment_modal_settings.sql
echo    - Apri l'applicazione e vai alle impostazioni del modal
echo    - Modifica il titolo del modal
echo    - Apri il modal di nuovo appuntamento e verifica che il titolo sia aggiornato
echo.

echo 🎉 Setup completato!
pause
