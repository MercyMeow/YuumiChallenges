import { z } from 'zod';
import { ApiError } from './error-handler';

export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    const validated = schema.parse(body);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      throw new ApiError(
        400,
        'Validation failed',
        'VALIDATION_ERROR',
        { errors }
      );
    }
    
    throw new ApiError(400, 'Invalid request body', 'INVALID_JSON');
  }
}

export const commonSchemas = {
  pagination: z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0),
  }),
  
  id: z.string().uuid('Invalid ID format'),
  
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  email: z.string().email('Invalid email format'),
  
  url: z.string().url('Invalid URL format'),
  
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'Start date must be before or equal to end date',
  }),
};

export function createPaginationSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object({
    ...shape,
    ...commonSchemas.pagination.shape,
  });
}