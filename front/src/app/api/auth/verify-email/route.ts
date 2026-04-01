import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiBase } from '@/lib/internal-api-base';

export async function POST(request: NextRequest) {
	const body = await request.text();
	const res = await fetch(`${getInternalApiBase()}/auth/verify-email`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body,
	});

	const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
	return NextResponse.json(data, { status: res.status });
}
