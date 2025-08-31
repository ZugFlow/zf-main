-- Migration: Setup RLS policies for salon-assets storage bucket
-- This allows authenticated users to upload and manage carousel images for their salon

-- Enable RLS on the storage.objects table for salon-assets bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for INSERT (upload) - Users can upload files to their salon folder
CREATE POLICY "Users can upload files to their salon folder" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'salon-assets' 
    AND auth.role() = 'authenticated'
    AND (
      -- Allow upload to salon_id folder structure
      (storage.foldername(name))[1] IN (
        SELECT salon_id::text 
        FROM profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- Policy for SELECT (download/view) - Users can view files from their salon folder
CREATE POLICY "Users can view files from their salon folder" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'salon-assets'
    AND (
      -- Allow public access to all files in salon-assets
      true
      -- OR restrict to own salon folder:
      -- (storage.foldername(name))[1] IN (
      --   SELECT salon_id::text 
      --   FROM profiles 
      --   WHERE id = auth.uid()
      -- )
    )
  );

-- Policy for UPDATE - Users can update files in their salon folder
CREATE POLICY "Users can update files in their salon folder" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'salon-assets'
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[1] IN (
        SELECT salon_id::text 
        FROM profiles 
        WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'salon-assets'
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[1] IN (
        SELECT salon_id::text 
        FROM profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- Policy for DELETE - Users can delete files from their salon folder
CREATE POLICY "Users can delete files from their salon folder" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'salon-assets'
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[1] IN (
        SELECT salon_id::text 
        FROM profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- Ensure the salon-assets bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('salon-assets', 'salon-assets', true)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  updated_at = NOW();

-- Add comments for documentation
COMMENT ON POLICY "Users can upload files to their salon folder" ON storage.objects IS 'Allows authenticated users to upload files to their salon folder in salon-assets bucket';
COMMENT ON POLICY "Users can view files from their salon folder" ON storage.objects IS 'Allows public access to view files in salon-assets bucket';
COMMENT ON POLICY "Users can update files in their salon folder" ON storage.objects IS 'Allows authenticated users to update files in their salon folder';
COMMENT ON POLICY "Users can delete files from their salon folder" ON storage.objects IS 'Allows authenticated users to delete files from their salon folder';
