import { Request } from 'express';

export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
    take: number;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

/**
 * Parses page and limit parameters from Express request query string.
 *
 * @param req Express Request object
 * @param defaultLimit Default limit if unspecified (default: 20)
 * @param maxLimit Maximum allowable limit (default: 100)
 */
export function parsePagination(req: Request, defaultLimit: number = 20, maxLimit: number = 100): PaginationParams {
    const pageParam = parseInt(String(req.query.page || '1'), 10);
    const limitParam = parseInt(String(req.query.limit || defaultLimit), 10);

    const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    let limit = isNaN(limitParam) || limitParam < 1 ? defaultLimit : limitParam;
    if (limit > maxLimit) {
        limit = maxLimit;
    }

    const skip = (page - 1) * limit;
    const take = limit;

    return { page, limit, skip, take };
}

/**
 * Formats data array and count into a structured paginated result.
 *
 * @param data Array of records
 * @param totalItems Total count of records matching criteria
 * @param page Current page number
 * @param limit Page size limit
 */
export function buildPaginatedResult<T>(
    data: T[],
    totalItems: number,
    page: number,
    limit: number
): PaginatedResult<T> {
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
        data,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage,
            hasPreviousPage,
        },
    };
}
