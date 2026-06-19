export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface ApiError {
  statusCode: number;
  data: null;
  message: string;
  success: false;
  errors: string[];
}

export interface Pagination {
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type EmptyObject = Record<string, never>;
