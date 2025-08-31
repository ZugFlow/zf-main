-- Check if realtime is enabled for our tables
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('permessiferie', 'team')
ORDER BY tablename;

-- Check if realtime extension is enabled
SELECT * FROM pg_extension WHERE extname = 'realtime';

-- Check publication status
SELECT 
  pubname,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- Check if tables exist and have the right structure
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('permessiferie', 'team')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position; 