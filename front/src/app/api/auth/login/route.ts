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
	const apiBase = getInternalApiBase();
	const targetUrl = `${apiBase}/auth/login`;

	authRouteLog('api login start', {
		target: targetUrl,
		method: 'POST',
		hasBody: body.length > 0,
		contentType: request.headers.get('content-type'),
	});

	try {
		const res = await fetch(targetUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body,
		});

		authRouteLog('api login response', {
			status: res.status,
			statusText: res.statusText,
		});

		const data = (await res.json().catch((e) => {
			authRouteLog('api login parse error', { error: e instanceof Error ? e.message : String(e) });
			return {};
		})) as {
			success?: boolean;
			message?: string | string[];
			data?: { user?: unknown; accessToken?: string; refreshToken?: string };
			user?: unknown;
			accessToken?: string;
			refreshToken?: string;
		};

		const payload = data.data ?? data;

		if (!res.ok) {
			authRouteLog('api login failed', {
				status: res.status,
				message: data.message,
			});
			return NextResponse.json(data, { status: res.status });
		}

		if (!payload.accessToken || !payload.refreshToken || !payload.user) {
			authRouteLog('api login invalid payload', {
				status: res.status,
				hasUser: Boolean(payload.user),
				hasAccessToken: Boolean(payload.accessToken),
				hasRefreshToken: Boolean(payload.refreshToken),
			});
			return NextResponse.json({ message: 'Invalid auth response' }, { status: 502 });
		}

		const response = NextResponse.json({ user: payload.user });
		applyAuthCookies(response, { accessToken: payload.accessToken, refreshToken: payload.refreshToken });
		authRouteLog('api login cookies set', {
			hasAccessToken: Boolean(payload.accessToken),
			hasRefreshToken: Boolean(payload.refreshToken),
		});
		return response;
	} catch (error) {
		authRouteLog('api login error', { error: error instanceof Error ? error.message : 'Unknown error' });
		return NextResponse.json(
			{ message: 'Backend connection error', error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 },
		);
	}
}
