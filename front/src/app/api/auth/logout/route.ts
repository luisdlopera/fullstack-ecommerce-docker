import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiBase } from '@/lib/internal-api-base';
import { NEXSTORE_ACCESS_COOKIE, NEXSTORE_REFRESH_COOKIE } from '@/lib/auth-cookie-names';
import { clearAuthCookies } from '@/lib/auth-cookie-options';

export async function POST(request: NextRequest) {
	const access = request.cookies.get(NEXSTORE_ACCESS_COOKIE)?.value;
	const refresh = request.cookies.get(NEXSTORE_REFRESH_COOKIE)?.value;

	if (access) {
		try {
			await fetch(`${getInternalApiBase()}/auth/logout`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${access}`,
					...(refresh ? { 'x-refresh-token': refresh } : {}),
				},
			});
		} catch {
			/* best-effort */
		}
	}

	const response = NextResponse.json({ ok: true });
	clearAuthCookies(response);
	return response;
}
