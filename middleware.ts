import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limiter';

/**
 * Next.js Edge Middleware
 * Handles distributed rate limiting for public-facing API routes using Upstash Redis
 * sliding window algorithm — accurate across all serverless instances and regions.
 *
 * Note: @upstash/redis and @upstash/ratelimit both support the Next.js Edge Runtime.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // 1. Rate limiting on public order submission: max 5 orders per IP per minute
  if (pathname === '/api/orders' && request.method === 'POST') {
    const rateCheck = await checkRateLimit(`order_${ip}`, 5, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'تم تجاوز حد الطلبات المسموح به. يرجى الانتظار دقيقة واحدة.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': String(rateCheck.remaining),
          },
        }
      );
    }
  }

  // 2. Rate limiting on waiter call submissions: max 3 calls per IP per minute
  if (pathname === '/api/waiter-calls' && request.method === 'POST') {
    const rateCheck = await checkRateLimit(`waiter_${ip}`, 3, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'تم إرسال نداء من قبل. يرجى الانتظار قليلاً حتى يستجيب طاقم الخدمة.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': String(rateCheck.remaining),
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/orders', '/api/waiter-calls', '/admin/:path*'],
};
