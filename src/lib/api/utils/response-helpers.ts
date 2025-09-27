import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  
  if (message) {
    response.message = message;
  }
  
  return NextResponse.json(response, { status });
}

export function createErrorResponse(
  error: string,
  status: number = 500
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error,
  };
  
  return NextResponse.json(response, { status });
}

export function createEmptyResponse(status: number = 204): NextResponse {
  return new NextResponse(null, { status });
}

export interface ValidationError {
  field: string;
  message: string;
}

export function createValidationErrorResponse(
  errors: ValidationError[],
  message: string = 'Validation failed'
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      validationErrors: errors,
    },
    { status: 400 }
  );
}
