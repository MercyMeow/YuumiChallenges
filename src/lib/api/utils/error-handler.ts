import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public override message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown, context: string): NextResponse {
  const parts = context.split(' ');
  logger.apiError(parts[0] || '', parts[1] || '', error);

  if (error instanceof ApiError) {
    const response: ErrorResponse = {
      error: error.message,
      ...(error.code ? { code: error.code } : {}),
    };

    if (process.env.NODE_ENV === 'development') {
      response.details = error.details;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Resource already exists' },
        { status: 409 }
      );
    }

    if (message.includes('not found')) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    if (message.includes('invalid')) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export function createErrorResponse(
  status: number,
  message: string,
  code?: string
): NextResponse {
  return NextResponse.json({ error: message, code }, { status });
}

export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields = requiredFields.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    throw new ApiError(400, 'Missing required fields', 'MISSING_FIELDS', {
      fields: missingFields,
    });
  }
}
