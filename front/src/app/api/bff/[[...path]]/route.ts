import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getInternalApiBase } from '@/lib/internal-api-base';
import { NEXSTORE_ACCESS_COOKIE } from '@/lib/auth-cookie-names';

export const maxDuration = 30;

const AUTH_DEBUG = process.env.NEXT_PUBLIC_AUTH_DEBUG_LOGS === 'true';

function authBffLog(event: string, payload: Record<string, unknown> = {}) {
	if (!AUTH_DEBUG) return;
	console.log(`[AUTH-BFF] ${event}`, payload);
}

async function proxy(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
	const { path: segments } = await context.params;
	if (!segments?.length) {
		return NextResponse.json({ message: 'Not found' }, { status: 404 });
	}

	const path = segments.join('/');
	const url = new URL(request.url);
	const target = `${getInternalApiBase()}/${path}${url.search}`;
	const isAuthPath = path.startsWith('auth') || path.startsWith('users/me');

	const headers = new Headers();
	const contentType = request.headers.get('content-type');
	if (contentType) headers.set('content-type', contentType);
	const accept = request.headers.get('accept');
	if (accept) headers.set('accept', accept);

	const access = request.cookies.get(NEXSTORE_ACCESS_COOKIE)?.value;
	if (access) headers.set('Authorization', `Bearer ${access}`);
	if (isAuthPath) {
		authBffLog('proxy start', {
			method: request.method,
			path,
			target,
			hasAccessCookie: Boolean(access),
			hasAuthHeader: Boolean(access),
		});
	}

	let body: BodyInit | undefined;

	if (request.method !== 'GET' && request.method !== 'HEAD') {
		if (contentType?.includes('multipart/form-data')) {
			// For multipart: re-parse FormData so fetch generates a fresh boundary
			body = await request.formData();
			headers.delete('content-type');
		} else {
			// For JSON / other: read the body as bytes to avoid stream-already-consumed errors
			try {
				const buf = await request.arrayBuffer();
				if (buf.byteLength > 0) {
					body = new Uint8Array(buf);
				}
			} catch {
				// body was empty or already consumed — send without body
			}
		}
	}

	const init: RequestInit = {
		method: request.method,
		headers,
		body,
		cache: 'no-store',
	};

	try {
		const upstream = await fetch(target, init);
		const bodyText = await upstream.text();
		if (isAuthPath) {
			authBffLog('proxy response', {
				status: upstream.status,
				statusText: upstream.statusText,
				body: bodyText.slice(0, 800),
			});
		}

		const res = new NextResponse(bodyText, {
			status: upstream.status,
			statusText: upstream.statusText,
		});

		const ct = upstream.headers.get('content-type');
		if (ct) res.headers.set('content-type', ct);

		if (!upstream.ok) {
			console.error(
				`[BFF Proxy Error] Upstream returned status ${upstream.status} for ${target}\nBody: ${bodyText.slice(0, 500)}`,
			);
		}

		return res;
	} catch (error) {
		console.error('BFF Proxy Error:', error);
		return NextResponse.json(
			{ message: 'Internal proxy error', error: error instanceof Error ? error.message : String(error) },
			{ status: 502 },
		);
	}
}

const handler = (req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) => proxy(req, ctx);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
