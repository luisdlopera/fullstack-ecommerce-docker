import type { NextResponse } from 'next/server';
import { NEXSTORE_ACCESS_COOKIE, NEXSTORE_REFRESH_COOKIE } from '@/lib/auth-cookie-names';

const secure = process.env.NODE_ENV === 'production';

export function applyAuthCookies(res: NextResponse, tokens: { accessToken: string; refreshToken: string }) {
	res.cookies.set(NEXSTORE_ACCESS_COOKIE, tokens.accessToken, {
		httpOnly: true,
		secure,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 15,
	});
	res.cookies.set(NEXSTORE_REFRESH_COOKIE, tokens.refreshToken, {
		httpOnly: true,
		secure,
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24 * 7,
	});
}

export function clearAuthCookies(res: NextResponse) {
	res.cookies.set(NEXSTORE_ACCESS_COOKIE, '', {
		httpOnly: true,
		secure,
		sameSite: 'lax',
		path: '/',
		maxAge: 0,
	});
	res.cookies.set(NEXSTORE_REFRESH_COOKIE, '', {
		httpOnly: true,
		secure,
		sameSite: 'lax',
		path: '/',
		maxAge: 0,
	});
}
