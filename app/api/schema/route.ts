import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    // Use RPC function to query table names
    const { data, error } = await (supabaseAdmin as any).rpc('query_table_names', {
      schema_name: 'public'
    });

    if (error) {
      console.error('Error querying information_schema:', error);
      return NextResponse.json(
        { error: 'Failed to query database schema' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      count: Array.isArray(data) ? data.length : 0
    });

  } catch (error) {
    console.error('Exception while querying schema:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST method to query specific table columns
export async function POST(request: NextRequest) {
  try {
    const { tableName } = await request.json();

    if (!tableName) {
      return NextResponse.json(
        { error: 'tableName is required' },
        { status: 400 }
      );
    }

    // Use RPC function to query table columns
    const { data, error } = await (supabaseAdmin as any).rpc('query_table_columns', {
      table_name: tableName,
      schema_name: 'public'
    });

    if (error) {
      console.error(`Error querying columns for table ${tableName}:`, error);
      return NextResponse.json(
        { error: `Failed to query columns for table ${tableName}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tableName,
      data,
      count: Array.isArray(data) ? data.length : 0
    });

  } catch (error) {
    console.error('Exception while querying table columns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 