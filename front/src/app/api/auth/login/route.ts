import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiBase } from '@/lib/internal-api-base';
import { applyAuthCookies } from '@/lib/auth-cookie-options';

const AUTH_DEBUG = process.env.NEXT_PUBLIC_AUTH_DEBUG_LOGS === 'true';

function authRouteLog(event: string, payload: Record<string, unknown> = {}) {
	if (!AUTH_DEBUG) return;
	console.log(`[AUTH-FRONT] ${event}`, payload);
}

export async function POST(request: NextRequest) {
	const body = await request.text();
	const target = `${getInternalApiBase()}/auth/login`;
	authRouteLog('api login start', {
		target,
		method: 'POST',
		hasBody: body.length > 0,
		contentType: request.headers.get('content-type'),
	});
	const res = await fetch(target, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body,
	});

	const raw = await res.clone().text().catch(() => '');
	authRouteLog('api login response', {
		status: res.status,
		statusText: res.statusText,
		contentType: res.headers.get('content-type'),
		body: raw.slice(0, 800),
	});

	const data = (await res.json().catch(() => ({}))) as {
		success?: boolean;
		message?: string | string[];
		data?: { user?: unknown; accessToken?: string; refreshToken?: string };
		user?: unknown;
		accessToken?: string;
		refreshToken?: string;
	};

	const payload = data.data ?? data;

	if (!res.ok) {
		console.log('[AUTH_DEBUG] BFF login failed with upstream error', { status: res.status });
		console.log('[auth.login] upstream error', {
			status: res.status,
			message: data.message,
		});
		authRouteLog('api login failed', {
			status: res.status,
			message: data.message,
		});
		return NextResponse.json(data, { status: res.status });
	}

	if (!payload.accessToken || !payload.refreshToken || !payload.user) {
		console.log('[AUTH_DEBUG] BFF login failed: Missing accessToken or refreshToken in JSON payload');
		console.log('[auth.login] invalid payload', {
			status: res.status,
			hasUser: Boolean(payload.user),
			hasAccessToken: Boolean(payload.accessToken),
			hasRefreshToken: Boolean(payload.refreshToken),
		});
		return NextResponse.json({ message: 'Invalid auth response' }, { status: 502 });
	}

	const response = NextResponse.json({ user: payload.user });
	applyAuthCookies(response, { accessToken: payload.accessToken, refreshToken: payload.refreshToken });
	console.log('[AUTH_DEBUG] Successfully set httpOnly cookies for Next.js session');
	authRouteLog('api login cookies set', {
		hasAccessToken: Boolean(payload.accessToken),
		hasRefreshToken: Boolean(payload.refreshToken),
	});
	return response;
}
