import { NextRequest, NextResponse } from 'next/server';
import { NEXSTORE_ACCESS_COOKIE } from '@/lib/auth-cookie-names';
import { hasPermissionForRole, PERMISSIONS, type PermissionKey } from '@/features/admin/permissions';

const AUTH_DEBUG = process.env.NEXT_PUBLIC_AUTH_DEBUG_LOGS === 'true';

function authRedirectLog(event: string, payload: Record<string, unknown> = {}) {
  if (!AUTH_DEBUG) return;
  console.log(`[AUTH-REDIRECT] ${event}`, payload);
}

type JwtPayload = {
  role?: string;
};

const ROUTE_PERMISSIONS: Array<{ startsWith: string; permission: PermissionKey }> = [
  { startsWith: '/admin/users', permission: PERMISSIONS.USERS_READ },
  { startsWith: '/admin/orders', permission: PERMISSIONS.ORDERS_READ },
  { startsWith: '/admin/products', permission: PERMISSIONS.PRODUCTS_READ },
  { startsWith: '/admin/categories', permission: PERMISSIONS.CATEGORIES_READ },
  { startsWith: '/admin/inventory', permission: PERMISSIONS.INVENTORY_READ },
  { startsWith: '/admin/promotions', permission: PERMISSIONS.PROMOTIONS_MANAGE },
  { startsWith: '/admin/payments', permission: PERMISSIONS.PAYMENTS_READ },
  { startsWith: '/admin/audit-logs', permission: PERMISSIONS.AUDIT_READ },
  { startsWith: '/admin/countries', permission: PERMISSIONS.SETTINGS_MANAGE },
  { startsWith: '/admin', permission: PERMISSIONS.DASHBOARD_READ },
];

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
}

function normalizeRole(rawRole: string | undefined): string | null {
  if (!rawRole) return null;
  const role = rawRole.trim().toUpperCase();
  if (!role) return null;
  if (role === 'USER') return 'CUSTOMER';
  return role;
}

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  if (pathname === '/auth') {
    url.searchParams.set('next', request.nextUrl.pathname);
  }
  authRedirectLog('redirect', {
    from: request.nextUrl.pathname,
    to: pathname,
    hostname: request.nextUrl.hostname,
  });
  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(NEXSTORE_ACCESS_COOKIE)?.value;
  if (!accessToken) {
    authRedirectLog('missing access cookie', {
      pathname: request.nextUrl.pathname,
      hostname: request.nextUrl.hostname,
    });
    return redirectTo(request, '/auth');
  }

  const payload = decodeJwtPayload(accessToken);
  const role = normalizeRole(payload?.role);

  authRedirectLog('decoded token', {
    pathname: request.nextUrl.pathname,
    hostname: request.nextUrl.hostname,
    role,
  });

  if (!role || role === 'CUSTOMER') {
    authRedirectLog('role forbidden', {
      pathname: request.nextUrl.pathname,
      role,
    });
    return redirectTo(request, '/forbidden');
  }

  const routePermission = ROUTE_PERMISSIONS.find((item) => request.nextUrl.pathname.startsWith(item.startsWith));
  if (routePermission && !hasPermissionForRole(role, routePermission.permission)) {
    authRedirectLog('permission denied', {
      pathname: request.nextUrl.pathname,
      role,
      permission: routePermission.permission,
    });
    return redirectTo(request, '/forbidden');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
