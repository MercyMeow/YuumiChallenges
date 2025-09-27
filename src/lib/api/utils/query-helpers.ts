import { ApiError } from './error-handler';

export async function executeQuery<T>(
  queryFn: () => Promise<T | null>,
  errorMessage: string = 'Query failed'
): Promise<T> {
  try {
    const result = await queryFn();
    if (result === null || result === undefined) {
      throw new ApiError(404, 'Resource not found', 'NOT_FOUND');
    }
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    console.error('Datastore query failed:', error);
    throw new ApiError(500, errorMessage, 'DATASTORE_ERROR', error);
  }
}

export function mapByProperty<
  T extends Record<string, unknown>,
  K extends keyof T,
>(items: T[], property: K): Map<T[K], T> {
  const result = new Map<T[K], T>();
  items.forEach((item) => {
    const key = item[property];
    if (key !== undefined && key !== null) {
      result.set(key as T[K], item);
    }
  });
  return result;
}

export function filterByConditions<T extends Record<string, unknown>>(
  items: T[],
  conditions: Partial<{ [K in keyof T]: T[K] | T[K][] }>
): T[] {
  return items.filter((item) => {
    return Object.entries(conditions).every(([key, value]) => {
      if (value === undefined || value === null) {
        return true;
      }

      const recordValue = item[key];

      if (Array.isArray(value)) {
        return value.includes(recordValue as never);
      }

      return recordValue === value;
    });
  });
}
