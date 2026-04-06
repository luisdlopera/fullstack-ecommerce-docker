import { HttpStatus } from '@nestjs/common';
import { Messages } from './messages.enum';

export interface ApiResponseIssue {
  property: string;
  constraints: string[];
}

export interface ApiResponseMeta {
  page?: number;
  pageSize?: number;
  totalPages?: number;
  total?: number;
  search?: string;
  orderBy?: string;
  order?: string;
}

export interface ApiResponseBody<T = unknown> {
  ok: boolean;
  status: number;
  message: string | string[];
  data: T | null;
  meta: ApiResponseMeta | null;
  issues: ApiResponseIssue[] | null;
}

export interface ApiResponseParams<T = unknown> {
  ok?: boolean;
  status?: number;
  message?: string | string[];
  data?: T | null;
  meta?: ApiResponseMeta | null;
  issues?: ApiResponseIssue[] | null;
}

export function apiResponse<T = unknown>(params: ApiResponseParams<T>): ApiResponseBody<T> {
  const status = params.status ?? (params.ok === true ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR);

  const ok = params.ok ?? status < HttpStatus.BAD_REQUEST;

  return {
    ok,
    status,
    message: params.message ?? (ok ? Messages.SUCCESSFUL : Messages.INTERNAL_SERVER_ERROR),
    data: params.data ?? null,
    meta: params.meta ?? null,
    issues: params.issues ?? null,
  };
}

export function isApiResponseBody(value: unknown): value is ApiResponseBody {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.ok === 'boolean' &&
    typeof candidate.status === 'number' &&
    'message' in candidate &&
    'data' in candidate &&
    'meta' in candidate &&
    'issues' in candidate
  );
}
