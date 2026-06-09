import { Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  ThrottlerGuard,
  getOptionsToken,
  getStorageToken,
} from '@nestjs/throttler';
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';

/**
 * Throttler keyed on the authenticated user rather than the request IP.
 *
 * Beest's frontend hand-proxies every backend route, so the backend only ever
 * sees the SvelteKit server's IP — `req.ip` is identical for every user. With
 * the stock IP-based tracker that collapses the entire user base into a single
 * throttle bucket, so a handful of people creating projects in the same minute
 * trips a 429 ("Too Many Requests") for everyone.
 *
 * Every authenticated route carries a Bearer JWT (forwarded by the proxy), so
 * we key on the JWT's `uid` instead. The token is verified here independently
 * of JwtAuthGuard because the global throttler guard runs before route-level
 * guards populate `req.user`.
 *
 * Unauthenticated routes (login, refresh, public stats) have no user identity,
 * so they fall back to `req.ip` — which, behind the proxy, is still shared.
 * Those routes are not the source of the project-creation incident; tightening
 * them would require forwarding the real client IP (X-Forwarded-For) from the
 * proxy and trusting it on the backend.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  constructor(
    @Inject(getOptionsToken()) options: ThrottlerModuleOptions,
    @Inject(getStorageToken()) storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const authHeader: string | undefined = req?.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = this.jwtService.verify(authHeader.slice(7));
        const id = payload?.uid ?? payload?.sub;
        if (id) return `user:${id}`;
      } catch {
        // Invalid/expired token — fall through to IP-based tracking.
      }
    }
    return `ip:${req?.ip ?? 'unknown'}`;
  }
}
