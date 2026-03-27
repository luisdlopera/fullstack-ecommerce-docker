import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiBase } from '@/lib/internal-api-base';
import { applyAuthCookies } from '@/lib/auth-cookie-options';

export async function POST(request: NextRequest) {
	const body = await request.text();
	const res = await fetch(`${getInternalApiBase()}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body,
	});

	const data = (await res.json().catch(() => ({}))) as {
		user?: unknown;
		accessToken?: string;
		refreshToken?: string;
		message?: string | string[];
	};

	if (!res.ok) {
		return NextResponse.json(data, { status: res.status });
	}

	if (!data.accessToken || !data.refreshToken || !data.user) {
		return NextResponse.json({ message: 'Invalid auth response' }, { status: 502 });
	}

	const response = NextResponse.json({ user: data.user });
	applyAuthCookies(response, { accessToken: data.accessToken, refreshToken: data.refreshToken });
	return response;
}
