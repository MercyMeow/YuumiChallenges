import { createServerSupabaseClient } from '@/lib/supabase';
import { ApiError } from './error-handler';

export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>,
  errorMessage: string = 'Database query failed'
): Promise<T> {
  const { data, error } = await queryFn();
  
  if (error) {
    console.error('Database error:', error);
    throw new ApiError(500, errorMessage, 'DATABASE_ERROR', error);
  }
  
  if (!data) {
    throw new ApiError(404, 'Resource not found', 'NOT_FOUND');
  }
  
  return data;
}

export async function batchQuery<T, K extends string | number>(
  table: string,
  column: string,
  values: K[],
  selectColumns: string = '*'
): Promise<Map<K, T>> {
  if (values.length === 0) {
    return new Map();
  }
  
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(table)
    .select(selectColumns)
    .in(column, values);
  
  if (error) {
    console.error('Batch query error:', error);
    throw new ApiError(500, 'Batch query failed', 'BATCH_QUERY_ERROR', error);
  }
  
  const resultMap = new Map<K, T>();
  if (data && Array.isArray(data)) {
    data.forEach((item: unknown) => {
      const record = item as Record<string, unknown>;
      resultMap.set(record[column] as K, record as T);
    });
  }
  
  return resultMap;
}

export function buildConditionalQuery<T extends { in: (column: string, values: unknown[]) => T; eq: (column: string, value: unknown) => T }>(query: T, conditions: Record<string, unknown>): T {
  let result = query;
  Object.entries(conditions).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        result = result.in(key, value);
      } else {
        result = result.eq(key, value);
      }
    }
  });
  
  return result;
}