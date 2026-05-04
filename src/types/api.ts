/**
 * Shared API types used across multiple features.
 *
 * Rules:
 * - Feature-specific types (Product, CreateProductDto) stay in features/<name>/types.ts
 * - Only promote a type here when 2+ features need the same shape
 */

// Standard paginated response envelope from the external API
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Standard error shape returned by the external API
export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

// Generic success/error response wrapper (if your API uses one)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
