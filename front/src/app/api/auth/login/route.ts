import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiBase } from '@/lib/internal-api-base';
import { applyAuthCookies } from '@/lib/auth-cookie-options';

export async function POST(request: NextRequest) {
	const body = await request.text();
	const apiBase = getInternalApiBase();
	const targetUrl = `${apiBase}/auth/login`;
	
	console.log('[API ROUTE /api/auth/login] ============================================');
	console.log('[API ROUTE] Target URL:', targetUrl);
	console.log('[API ROUTE] Request body:', body);
	console.log('[API ROUTE] Headers:', { 'Content-Type': 'application/json' });
	
	try {
		const res = await fetch(targetUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body,
		});
		
		console.log('[API ROUTE] Backend response status:', res.status, res.statusText);
		
		const data = (await res.json().catch((e) => {
			console.error('[API ROUTE] Error parsing JSON response:', e);
			return {};
		})) as {
			user?: unknown;
			accessToken?: string;
			refreshToken?: string;
			message?: string | string[];
			statusCode?: number;
			error?: string;
		};
		
		console.log('[API ROUTE] Backend response data:', JSON.stringify(data, null, 2));

		if (!res.ok) {
			console.error('[API ROUTE] Backend returned error status:', res.status);
			return NextResponse.json(data, { status: res.status });
		}

		if (!data.accessToken || !data.refreshToken || !data.user) {
			console.error('[API ROUTE] Invalid auth response - missing fields:', {
				hasAccessToken: !!data.accessToken,
				hasRefreshToken: !!data.refreshToken,
				hasUser: !!data.user,
			});
			return NextResponse.json({ message: 'Invalid auth response' }, { status: 502 });
		}

		const response = NextResponse.json({ user: data.user });
		applyAuthCookies(response, { accessToken: data.accessToken, refreshToken: data.refreshToken });
		console.log('[API ROUTE] Login successful, cookies applied');
		console.log('[API ROUTE] ============================================');
		return response;
	} catch (error) {
		console.error('[API ROUTE] CRITICAL ERROR calling backend:', error);
		console.error('[API ROUTE] ============================================');
		return NextResponse.json(
			{ message: 'Backend connection error', error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}
