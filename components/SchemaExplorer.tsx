'use client';

import { useState, useEffect } from 'react';
import { queryTableSchema, getTableColumns, getTableNames, ColumnInfo, TableColumn, SchemaTableName } from '@/utils/supabase/schemaQuery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SchemaExplorer() {
  const [allColumns, setAllColumns] = useState<ColumnInfo[]>([]);
  const [tableNames, setTableNames] = useState<SchemaTableName[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all table names on component mount
  useEffect(() => {
    loadTableNames();
  }, []);

  const loadTableNames = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await getTableNames();
      if (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } else {
        // Type guard to ensure data is the expected format
        if (Array.isArray(data)) {
          setTableNames(data as SchemaTableName[]);
        } else {
          setTableNames([]);
          setError('Invalid data format received from server');
        }
      }
    } catch (err) {
      setError('Failed to load table names');
    } finally {
      setLoading(false);
    }
  };

  const loadAllColumns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await queryTableSchema();
      if (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } else {
        // Type guard to ensure data is the expected format
        if (Array.isArray(data)) {
          setAllColumns(data as ColumnInfo[]);
        } else {
          setAllColumns([]);
          setError('Invalid data format received from server');
        }
      }
    } catch (err) {
      setError('Failed to load all columns');
    } finally {
      setLoading(false);
    }
  };

  const loadTableColumns = async (tableName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await getTableColumns(tableName);
      if (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } else {
        // Type guard to ensure data is the expected format
        if (Array.isArray(data)) {
          setTableColumns(data as TableColumn[]);
        } else {
          setTableColumns([]);
          setError('Invalid data format received from server');
        }
        setSelectedTable(tableName);
      }
    } catch (err) {
      setError(`Failed to load columns for table ${tableName}`);
    } finally {
      setLoading(false);
    }
  };

  // Group columns by table name
  const columnsByTable = allColumns.reduce((acc, column) => {
    if (!acc[column.table_name]) {
      acc[column.table_name] = [];
    }
    acc[column.table_name].push(column);
    return acc;
  }, {} as Record<string, ColumnInfo[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Database Schema Explorer</h1>
        <div className="space-x-2">
          <Button 
            onClick={loadTableNames}
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Loading...' : 'Refresh Tables'}
          </Button>
          <Button 
            onClick={loadAllColumns}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load All Schema'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Table Names Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tables in Database ({tableNames.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {tableNames.map((table) => (
              <Button
                key={table.table_name}
                variant="outline"
                size="sm"
                onClick={() => loadTableColumns(table.table_name)}
                className="text-left justify-start"
              >
                {table.table_name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Table Columns */}
      {selectedTable && tableColumns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Columns for: {selectedTable}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Column</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Type</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Nullable</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Default</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Max Length</th>
                  </tr>
                </thead>
                <tbody>
                  {tableColumns.map((column) => (
                    <tr key={column.column_name}>
                      <td className="border border-gray-200 px-4 py-2 font-medium">
                        {column.column_name}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <Badge variant="secondary">{column.data_type}</Badge>
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <Badge variant={column.is_nullable === 'YES' ? 'default' : 'destructive'}>
                          {column.is_nullable}
                        </Badge>
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-sm">
                        {column.column_default || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {column.character_maximum_length || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Schema Overview */}
      {allColumns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Complete Database Schema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(columnsByTable).map(([tableName, columns]) => (
                <div key={tableName} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">{tableName}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {columns.map((column) => (
                      <div key={column.column_name} className="flex items-center space-x-2 text-sm">
                        <span className="font-medium">{column.column_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {column.data_type}
                        </Badge>
                        {column.is_nullable === 'NO' && (
                          <Badge variant="destructive" className="text-xs">
                            NOT NULL
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 