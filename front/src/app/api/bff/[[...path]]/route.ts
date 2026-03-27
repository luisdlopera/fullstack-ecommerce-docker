import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getInternalApiBase } from '@/lib/internal-api-base';
import { NEXSTORE_ACCESS_COOKIE } from '@/lib/auth-cookie-names';

async function proxy(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
	const { path: segments } = await context.params;
	if (!segments?.length) {
		return NextResponse.json({ message: 'Not found' }, { status: 404 });
	}

	const path = segments.join('/');
	const url = new URL(request.url);
	const target = `${getInternalApiBase()}/${path}${url.search}`;

	const headers = new Headers();
	const contentType = request.headers.get('content-type');
	if (contentType) headers.set('content-type', contentType);
	const accept = request.headers.get('accept');
	if (accept) headers.set('accept', accept);

	const access = request.cookies.get(NEXSTORE_ACCESS_COOKIE)?.value;
	if (access) headers.set('Authorization', `Bearer ${access}`);

	const init: RequestInit = {
		method: request.method,
		headers,
		body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text(),
		cache: 'no-store',
	};

	const upstream = await fetch(target, init);
	const bodyText = await upstream.text();
	const res = new NextResponse(bodyText, { status: upstream.status });
	const ct = upstream.headers.get('content-type');
	if (ct) res.headers.set('content-type', ct);
	return res;
}

const handler = (req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) => proxy(req, ctx);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
