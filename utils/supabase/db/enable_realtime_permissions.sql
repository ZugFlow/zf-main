-- Enable realtime for permessiferie table
ALTER PUBLICATION supabase_realtime ADD TABLE public.permessiferie;

-- Enable realtime for team table
ALTER PUBLICATION supabase_realtime ADD TABLE public.team;

-- Verify that realtime is enabled
SELECT 
  schemaname,
  tablename,
  attname,
  atttypid::regtype as data_type
FROM pg_publication_tables pt
JOIN pg_attribute a ON a.attrelid = pt.tablename::regclass
WHERE pt.pubname = 'supabase_realtime'
  AND pt.tablename IN ('permessiferie', 'team')
ORDER BY pt.tablename, a.attnum; 