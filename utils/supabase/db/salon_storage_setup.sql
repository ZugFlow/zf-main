-- =====================================================
-- CONFIGURAZIONE SUPABASE STORAGE PER SALON ASSETS
-- =====================================================

-- Crea il bucket per gli asset dei saloni
-- Questo bucket conterrà logo, immagini galleria, e altri file dei saloni
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'salon-assets',
  'salon-assets',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Crea policy per permettere agli utenti autenticati di caricare file
CREATE POLICY "Users can upload salon assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'salon-assets' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'salons'
  AND (storage.foldername(name))[2]::uuid IN (
    SELECT salon_id FROM profiles WHERE id = auth.uid()
  )
);

-- Crea policy per permettere agli utenti di visualizzare i propri file
CREATE POLICY "Users can view own salon assets" ON storage.objects
FOR SELECT USING (
  bucket_id = 'salon-assets' 
  AND (
    auth.role() = 'authenticated' AND (
      (storage.foldername(name))[1] = 'salons'
      AND (storage.foldername(name))[2]::uuid IN (
        SELECT salon_id FROM profiles WHERE id = auth.uid()
      )
    )
  )
);

-- Crea policy per permettere agli utenti di aggiornare i propri file
CREATE POLICY "Users can update own salon assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'salon-assets' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'salons'
  AND (storage.foldername(name))[2]::uuid IN (
    SELECT salon_id FROM profiles WHERE id = auth.uid()
  )
);

-- Crea policy per permettere agli utenti di eliminare i propri file
CREATE POLICY "Users can delete own salon assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'salon-assets' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'salons'
  AND (storage.foldername(name))[2]::uuid IN (
    SELECT salon_id FROM profiles WHERE id = auth.uid()
  )
);

-- Crea policy per permettere accesso pubblico ai file (per la pagina web)
CREATE POLICY "Public access to salon assets" ON storage.objects
FOR SELECT USING (
  bucket_id = 'salon-assets' 
  AND (storage.foldername(name))[1] = 'salons'
);

-- Commenti per documentazione
COMMENT ON POLICY "Users can upload salon assets" ON storage.objects IS 'Permette agli utenti di caricare file nella cartella del proprio salone';
COMMENT ON POLICY "Users can view own salon assets" ON storage.objects IS 'Permette agli utenti di visualizzare i file del proprio salone';
COMMENT ON POLICY "Users can update own salon assets" ON storage.objects IS 'Permette agli utenti di aggiornare i file del proprio salone';
COMMENT ON POLICY "Users can delete own salon assets" ON storage.objects IS 'Permette agli utenti di eliminare i file del proprio salone';
COMMENT ON POLICY "Public access to salon assets" ON storage.objects IS 'Permette accesso pubblico ai file per la visualizzazione nella pagina web'; 