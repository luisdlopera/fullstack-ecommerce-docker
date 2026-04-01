import { NextRequest, NextResponse } from 'next/server';
import { getInternalApiBase } from '@/lib/internal-api-base';

export async function POST(request: NextRequest) {
	const body = await request.text();
	const res = await fetch(`${getInternalApiBase()}/auth/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body,
	});

	const data = (await res.json().catch(() => ({}))) as {
		ok?: boolean;
		message?: string;
	};

	if (!res.ok) {
		return NextResponse.json(data, { status: res.status });
	}

	return NextResponse.json({
		ok: data.ok ?? true,
		message: data.message ?? 'Revisa tu correo para verificar la cuenta.',
	});
}
