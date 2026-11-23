import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import type { NextRequest } from 'next/server';
import { getApiApp } from '../../../../server/apiApp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleExpressRequest(request: NextRequest): Promise<Response> {
  const app = await getApiApp();
  const url = new URL(request.url);
  const fullPath = `${url.pathname}${url.search}`;

  const rawHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    rawHeaders[key.toLowerCase()] = value;
  });

  let bodyBuffer = Buffer.alloc(0);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const ab = await request.arrayBuffer();
    if (ab.byteLength > 0) {
      bodyBuffer = Buffer.from(ab);
    }
  }

  const reqStream = Readable.from(bodyBuffer.length > 0 ? [bodyBuffer] : []) as Readable & {
    url: string;
    originalUrl: string;
    method: string;
    headers: Record<string, string>;
    httpVersion: string;
    httpVersionMajor: number;
    httpVersionMinor: number;
    socket: { remoteAddress: string; encrypted: boolean };
    connection: { remoteAddress: string; encrypted: boolean };
  };

  reqStream.url = fullPath;
  reqStream.originalUrl = fullPath;
  reqStream.method = request.method;
  reqStream.headers = rawHeaders;
  reqStream.httpVersion = '1.1';
  reqStream.httpVersionMajor = 1;
  reqStream.httpVersionMinor = 1;
  const socketMock = {
    remoteAddress: rawHeaders['x-forwarded-for']?.split(',')[0]?.trim() || '127.0.0.1',
    encrypted: url.protocol === 'https:' || rawHeaders['x-forwarded-proto'] === 'https',
  };
  reqStream.socket = socketMock;
  reqStream.connection = socketMock;

  return new Promise<Response>((resolve) => {
    const responseHeaders = new Headers();
    const chunks: Buffer[] = [];
    let resolved = false;

    const resMock = new EventEmitter() as EventEmitter & {
      statusCode: number;
      statusMessage: string;
      headersSent: boolean;
      finished: boolean;
      writableEnded: boolean;
      setHeader: (name: string, value: number | string | readonly string[]) => unknown;
      getHeader: (name: string) => string | string[] | undefined;
      getHeaders: () => Record<string, string | string[]>;
      hasHeader: (name: string) => boolean;
      removeHeader: (name: string) => void;
      writeHead: (
        statusCode: number,
        reasonOrHeaders?: string | Record<string, number | string | readonly string[]>,
        maybeHeaders?: Record<string, number | string | readonly string[]>
      ) => unknown;
      write: (chunk: unknown, encoding?: BufferEncoding, cb?: () => void) => boolean;
      end: (chunk?: unknown, encoding?: BufferEncoding, cb?: () => void) => unknown;
      flushHeaders: () => void;
    };

    resMock.statusCode = 200;
    resMock.statusMessage = 'OK';
    resMock.headersSent = false;
    resMock.finished = false;
    resMock.writableEnded = false;

    const headerMap = new Map<string, string | string[]>();

    resMock.setHeader = (name: string, value: number | string | readonly string[]) => {
      const lower = name.toLowerCase();
      if (Array.isArray(value)) {
        headerMap.set(lower, value.map(String));
        responseHeaders.delete(lower);
        for (const v of value) {
          responseHeaders.append(lower, String(v));
        }
      } else {
        const str = String(value);
        headerMap.set(lower, str);
        responseHeaders.set(lower, str);
      }
      return resMock;
    };

    resMock.getHeader = (name: string) => headerMap.get(name.toLowerCase());
    resMock.getHeaders = () => Object.fromEntries(headerMap.entries());
    resMock.hasHeader = (name: string) => headerMap.has(name.toLowerCase());
    resMock.removeHeader = (name: string) => {
      const lower = name.toLowerCase();
      headerMap.delete(lower);
      responseHeaders.delete(lower);
    };
    resMock.flushHeaders = () => {
      resMock.headersSent = true;
    };

    resMock.writeHead = (
      statusCode: number,
      reasonOrHeaders?: string | Record<string, number | string | readonly string[]>,
      maybeHeaders?: Record<string, number | string | readonly string[]>
    ) => {
      resMock.statusCode = statusCode;
      const hdrs = typeof reasonOrHeaders === 'object' ? reasonOrHeaders : maybeHeaders;
      if (hdrs) {
        for (const [k, v] of Object.entries(hdrs)) {
          resMock.setHeader(k, v);
        }
      }
      resMock.headersSent = true;
      return resMock;
    };

    resMock.write = (chunk: unknown, encoding?: BufferEncoding, cb?: () => void) => {
      resMock.headersSent = true;
      if (chunk !== undefined && chunk !== null) {
        chunks.push(
          Buffer.isBuffer(chunk)
            ? chunk
            : typeof chunk === 'string'
            ? Buffer.from(chunk, encoding || 'utf8')
            : Buffer.from(chunk as Uint8Array)
        );
      }
      if (typeof encoding === 'function') {
        (encoding as unknown as () => void)();
      } else if (cb) {
        cb();
      }
      return true;
    };

    resMock.end = (chunk?: unknown, encoding?: BufferEncoding, cb?: () => void) => {
      if (typeof chunk === 'function') {
        (chunk as () => void)();
      } else if (chunk !== undefined && chunk !== null) {
        resMock.write(chunk, encoding);
      }
      if (typeof encoding === 'function') {
        (encoding as unknown as () => void)();
      } else if (cb) {
        cb();
      }
      resMock.headersSent = true;
      resMock.finished = true;
      resMock.writableEnded = true;
      resMock.emit('finish');

      if (!resolved) {
        resolved = true;
        const body = chunks.length > 0 ? Buffer.concat(chunks) : null;
        resolve(
          new Response(body, {
            status: resMock.statusCode,
            headers: responseHeaders,
          })
        );
      }
      return resMock;
    };

    app(
      reqStream as unknown as Parameters<typeof app>[0],
      resMock as unknown as Parameters<typeof app>[1],
      () => {
        if (!resolved) {
          resolved = true;
          resolve(Response.json({ error: 'API route not found' }, { status: 404 }));
        }
      }
    );
  });
}

export async function GET(req: NextRequest) {
  return handleExpressRequest(req);
}

export async function POST(req: NextRequest) {
  return handleExpressRequest(req);
}

export async function PUT(req: NextRequest) {
  return handleExpressRequest(req);
}

export async function PATCH(req: NextRequest) {
  return handleExpressRequest(req);
}

export async function DELETE(req: NextRequest) {
  return handleExpressRequest(req);
}

export async function OPTIONS(req: NextRequest) {
  return handleExpressRequest(req);
}
