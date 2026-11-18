import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
  const contentType = req.headers.get('content-type');
  const authorization = req.headers.get('authorization');
  const tenantHeader = req.headers.get('x-tenant-id');
  if (contentType) headers.set('content-type', contentType);
  if (authorization) headers.set('authorization', authorization);
  if (tenantHeader) headers.set('x-tenant-id', tenantHeader);

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
    const upstreamType = upstream.headers.get('content-type');
    if (upstreamType) responseHeaders.set('content-type', upstreamType);

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
