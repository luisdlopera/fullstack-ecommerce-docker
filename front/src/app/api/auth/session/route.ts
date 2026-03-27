import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiBase } from '@/lib/internal-api-base';
import { NEXSTORE_ACCESS_COOKIE, NEXSTORE_REFRESH_COOKIE } from '@/lib/auth-cookie-names';
import { applyAuthCookies, clearAuthCookies } from '@/lib/auth-cookie-options';

async function refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
	const r = await fetch(`${getInternalApiBase()}/auth/refresh`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ refreshToken }),
	});
	if (!r.ok) return null;
	const data = (await r.json()) as { accessToken?: string; refreshToken?: string };
	if (!data.accessToken || !data.refreshToken) return null;
	return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}

export async function GET(request: NextRequest) {
	const base = getInternalApiBase();

	const meWithToken = (accessToken: string) =>
		fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } });

	const tryReturnUser = async (
		accessToken: string,
		rotated?: { accessToken: string; refreshToken: string },
	): Promise<NextResponse | null> => {
		const me = await meWithToken(accessToken);
		if (!me.ok) return null;
		const user = await me.json();
		const response = NextResponse.json({ user });
		if (rotated) applyAuthCookies(response, rotated);
		return response;
	};

	const access = request.cookies.get(NEXSTORE_ACCESS_COOKIE)?.value;
	if (access) {
		const ok = await tryReturnUser(access);
		if (ok) return ok;
	}

	const rt = request.cookies.get(NEXSTORE_REFRESH_COOKIE)?.value;
	if (!rt) {
		const res = NextResponse.json({ user: null });
		clearAuthCookies(res);
		return res;
	}

	const tokens = await refreshTokens(rt);
	if (!tokens) {
		const res = NextResponse.json({ user: null });
		clearAuthCookies(res);
		return res;
	}

	const ok = await tryReturnUser(tokens.accessToken, tokens);
	if (ok) return ok;

	const res = NextResponse.json({ user: null });
	clearAuthCookies(res);
	return res;
}
