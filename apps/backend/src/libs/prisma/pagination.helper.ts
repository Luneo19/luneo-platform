/**
 * Pagination Helper for Prisma
 * Provides standardized pagination utilities
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
  minLimit?: number;
}

const DEFAULT_OPTIONS: PaginationOptions = {
  defaultLimit: 20,
  maxLimit: 100,
  minLimit: 1,
};

/**
 * Normalize pagination parameters
 */
export function normalizePagination(
  params: PaginationParams,
  options: PaginationOptions = DEFAULT_OPTIONS
): { skip: number; take: number; page: number; limit: number } {
  const { defaultLimit = 20, maxLimit = 100, minLimit = 1 } = options;
  
  // If skip/take are provided, use them directly
  if (params.skip !== undefined || params.take !== undefined) {
    const skip = params.skip ?? 0;
    const take = Math.min(Math.max(params.take ?? defaultLimit, minLimit), maxLimit);
    const page = Math.floor(skip / take) + 1;
    const limit = take;
    return { skip, take, page, limit };
  }
  
  // Otherwise, use page/limit
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? defaultLimit, minLimit), maxLimit);
  const skip = (page - 1) * limit;
  const take = limit;
  
  return { skip, take, page, limit };
}

/**
 * Create pagination result
 */
export function createPaginationResult<T>(
  data: T[],
  total: number,
  pagination: { page: number; limit: number }
): PaginationResult<T> {
  const totalPages = Math.ceil(total / pagination.limit);
  
  return {
    data,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
  };
}

/**
 * Helper to add pagination to Prisma query
 */
export function withPagination<T>(
  query: T,
  params: PaginationParams,
  options?: PaginationOptions
): T & { skip: number; take: number } {
  const { skip, take } = normalizePagination(params, options);
  return {
    ...query,
    skip,
    take,
  };
}

