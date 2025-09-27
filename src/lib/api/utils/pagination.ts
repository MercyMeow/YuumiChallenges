import { NextRequest } from 'next/server';

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export function getPaginationParams(request: NextRequest): PaginationParams {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
  
  return { limit, offset };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      offset: params.offset,
      limit: params.limit,
      total,
      hasMore: params.offset + params.limit < total,
    },
  };
}

export function applyPagination<T extends { range: (from: number, to: number) => T }>(query: T, params: PaginationParams): T {
  return query.range(params.offset, params.offset + params.limit - 1);
}
