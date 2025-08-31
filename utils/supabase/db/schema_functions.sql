-- Functions to query database schema information
-- These functions provide a safe way to access information_schema without TypeScript conflicts

-- Function to get all table columns in the public schema
CREATE OR REPLACE FUNCTION get_schema_info()
RETURNS TABLE (
  table_name text,
  column_name text,
  data_type text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.table_name::text,
    c.column_name::text,
    c.data_type::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  ORDER BY c.table_name, c.ordinal_position;
$$;

-- Function to get columns for a specific table
CREATE OR REPLACE FUNCTION get_table_columns(table_name_param text)
RETURNS TABLE (
  table_name text,
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.table_name::text,
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = table_name_param
  ORDER BY c.ordinal_position;
$$;

-- Function to query all columns in the public schema (matches TypeScript interface)
CREATE OR REPLACE FUNCTION query_schema_columns(schema_name text DEFAULT 'public')
RETURNS TABLE (
  table_name text,
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.table_name::text,
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text
  FROM information_schema.columns c
  WHERE c.table_schema = schema_name
  ORDER BY c.table_name, c.ordinal_position;
$$;

-- Function to query columns for a specific table (matches TypeScript interface)
CREATE OR REPLACE FUNCTION query_table_columns(table_name text, schema_name text DEFAULT 'public')
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable text,
  column_default text,
  character_maximum_length integer
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text,
    c.character_maximum_length
  FROM information_schema.columns c
  WHERE c.table_schema = schema_name
    AND c.table_name = table_name
  ORDER BY c.ordinal_position;
$$;

-- Function to query all table names in the public schema (matches TypeScript interface)
CREATE OR REPLACE FUNCTION query_table_names(schema_name text DEFAULT 'public')
RETURNS TABLE (
  table_name text
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = schema_name
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_schema_info() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO authenticated;
GRANT EXECUTE ON FUNCTION query_schema_columns(text) TO authenticated;
GRANT EXECUTE ON FUNCTION query_table_columns(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION query_table_names(text) TO authenticated; 