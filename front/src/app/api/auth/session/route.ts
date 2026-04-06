import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiBase } from '@/lib/internal-api-base';
import { NEXSTORE_ACCESS_COOKIE, NEXSTORE_REFRESH_COOKIE } from '@/lib/auth-cookie-names';
import { applyAuthCookies, clearAuthCookies } from '@/lib/auth-cookie-options';

const AUTH_DEBUG = process.env.NEXT_PUBLIC_AUTH_DEBUG_LOGS === 'true';

function authRouteLog(event: string, payload: Record<string, unknown> = {}) {
	if (!AUTH_DEBUG) return;
	console.log(`[AUTH-ME] ${event}`, payload);
}

async function refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
	authRouteLog('refresh start', {
		url: `${getInternalApiBase()}/auth/refresh`,
		refreshTokenLength: refreshToken.length,
	});
	const r = await fetch(`${getInternalApiBase()}/auth/refresh`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ refreshToken }),
	});
	const raw = await r
		.clone()
		.text()
		.catch(() => '');
	authRouteLog('refresh response', {
		status: r.status,
		body: raw.slice(0, 800),
	});
	if (!r.ok) return null;
	const data = (await r.json()) as {
		data?: { accessToken?: string; refreshToken?: string };
		accessToken?: string;
		refreshToken?: string;
	};
	const payload = data.data ?? data;
	if (!payload.accessToken || !payload.refreshToken) return null;
	authRouteLog('refresh tokens parsed', {
		hasAccessToken: Boolean(payload.accessToken),
		hasRefreshToken: Boolean(payload.refreshToken),
	});
	return { accessToken: payload.accessToken, refreshToken: payload.refreshToken };
}

export async function GET(request: NextRequest) {
	const base = getInternalApiBase();
	authRouteLog('session start', {
		base,
		hasAccessCookie: Boolean(request.cookies.get(NEXSTORE_ACCESS_COOKIE)?.value),
		hasRefreshCookie: Boolean(request.cookies.get(NEXSTORE_REFRESH_COOKIE)?.value),
	});

	const meWithToken = (accessToken: string) =>
		fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } });

	const tryReturnUser = async (
		accessToken: string,
		rotated?: { accessToken: string; refreshToken: string },
	): Promise<NextResponse | null> => {
		const me = await meWithToken(accessToken);
		const raw = await me
			.clone()
			.text()
			.catch(() => '');
		authRouteLog('me response', { status: me.status, body: raw.slice(0, 800) });
		if (!me.ok) return null;
		const userPayload = (await me.json()) as { data?: unknown; user?: unknown };
		const user = userPayload.data ?? userPayload.user ?? userPayload;
		const response = NextResponse.json({ user });
		if (rotated) applyAuthCookies(response, rotated);
		if (rotated) {
			authRouteLog('cookies rotated', {
				hasAccessToken: Boolean(rotated.accessToken),
				hasRefreshToken: Boolean(rotated.refreshToken),
			});
		}
		return response;
	};

	const access = request.cookies.get(NEXSTORE_ACCESS_COOKIE)?.value;
	if (access) {
		const ok = await tryReturnUser(access);
		if (ok) return ok;
	}

	const rt = request.cookies.get(NEXSTORE_REFRESH_COOKIE)?.value;
	if (!rt) {
		authRouteLog('no refresh cookie', {});
		const res = NextResponse.json({ user: null });
		clearAuthCookies(res);
		authRouteLog('cookies cleared', {});
		return res;
	}

	const tokens = await refreshTokens(rt);
	if (!tokens) {
		authRouteLog('refresh failed', {});
		const res = NextResponse.json({ user: null });
		clearAuthCookies(res);
		authRouteLog('cookies cleared', {});
		return res;
	}

	const ok = await tryReturnUser(tokens.accessToken, tokens);
	if (ok) return ok;

	const res = NextResponse.json({ user: null });
	clearAuthCookies(res);
	authRouteLog('me failed after refresh', {});
	return res;
}
