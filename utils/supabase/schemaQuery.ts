import { createClient } from './client';
import { supabaseAdmin } from './admin';

export interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

export interface SchemaTableName {
  table_name: string;
}

/**
 * Query information_schema.columns to get table structure information
 * This function demonstrates how to use supabase-js to query PostgreSQL system tables
 */
export async function queryTableSchema(): Promise<{ data: ColumnInfo[]; error: any }> {
  try {
    // Using raw SQL query to access information_schema
    const { data, error } = await (supabaseAdmin as any).rpc('query_schema_columns', {
      schema_name: 'public'
    });

    if (error) {
      console.error('Error querying information_schema:', error);
      return { data: [], error: null };
    }

    return { data: (data as ColumnInfo[]) || [], error: null };
  } catch (error) {
    console.error('Exception while querying schema:', error);
    return { data: [], error };
  }
}

/**
 * Get columns for a specific table
 */
export async function getTableColumns(tableName: string): Promise<{ data: TableColumn[]; error: any }> {
  try {
    const { data, error } = await (supabaseAdmin as any).rpc('query_table_columns', {
      table_name: tableName,
      schema_name: 'public'
    });

    if (error) {
      console.error(`Error querying columns for table ${tableName}:`, error);
      return { data: [], error: null };
    }

    return { data: (data as TableColumn[]) || [], error: null };
  } catch (error) {
    console.error(`Exception while querying columns for table ${tableName}:`, error);
    return { data: [], error };
  }
}

/**
 * Get all table names in the public schema
 */
export async function getTableNames(): Promise<{ data: SchemaTableName[]; error: any }> {
  try {
    const { data, error } = await (supabaseAdmin as any).rpc('query_table_names', {
      schema_name: 'public'
    });

    if (error) {
      console.error('Error querying table names:', error);
      // Return empty array instead of throwing error
      return { data: [], error: null };
    }

    // Ensure data is properly typed
    if (data && Array.isArray(data)) {
      return { data: (data.filter(item => item && typeof item === 'object' && 'table_name' in item) as SchemaTableName[]), error: null };
    }

    return { data: [], error: null };
  } catch (error) {
    console.error('Exception while querying table names:', error);
    return { data: [], error };
  }
}

/**
 * Example usage function
 */
export async function exampleUsage() {
  console.log('=== Querying all tables and columns ===');
  const { data: allColumns, error: allError } = await queryTableSchema();
  
  if (allError) {
    console.error('Failed to query all columns:', allError);
    return;
  }
  
  console.log('All columns:', allColumns);

  console.log('\n=== Querying specific table columns ===');
  const { data: tableColumns, error: tableError } = await getTableColumns('users');
  
  if (tableError) {
    console.error('Failed to query table columns:', tableError);
    return;
  }
  
  console.log('Users table columns:', tableColumns);

  console.log('\n=== Querying table names ===');
  const { data: tableNames, error: namesError } = await getTableNames();
  
  if (namesError) {
    console.error('Failed to query table names:', namesError);
    return;
  }
  
  console.log('Table names:', tableNames);
} 