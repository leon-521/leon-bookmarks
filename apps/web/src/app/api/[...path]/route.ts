import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FORWARDED_REQ_HEADERS = [
  'content-type',
  'authorization',
  'accept',
  'cookie',
  'stripe-signature',
  'x-forwarded-for',
  'x-real-ip',
];

const FORWARDED_RES_HEADERS = [
  'content-type',
  'content-disposition',
  'cache-control',
  'set-cookie',
];

const getBackendBaseUrl = () => {
  const internal = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return internal.replace(/\/+$/, '').replace(/\/api$/, '');
};

async function proxyRequest(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  const targetBase = getBackendBaseUrl();
  const subPath = (params.path || []).join('/');
  const search = req.nextUrl.search || '';
  const targetUrl = `${targetBase}/api/${subPath}${search}`;

  const headers = new Headers();
  for (const name of FORWARDED_REQ_HEADERS) {
    const val = req.headers.get(name);
    if (val) headers.set(name, val);
  }

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      cache: 'no-store',
    });

    const responseHeaders = new Headers();
    for (const name of FORWARDED_RES_HEADERS) {
      const val = upstream.headers.get(name);
      if (val) responseHeaders.set(name, val);
    }

    if (upstream.status === 204) {
      return new NextResponse(null, { status: 204, headers: responseHeaders });
    }

    const responseBody = await upstream.arrayBuffer();
    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: `API upstream unreachable (${targetBase}): ${err?.message || 'Unknown error'}` },
      { status: 502 },
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PATCH = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
