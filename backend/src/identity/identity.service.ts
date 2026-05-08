import { Injectable, Logger } from '@nestjs/common';
import { fetchWithTimeout } from '../fetch.util';

const IDENTITY_CHECK_URL = 'https://identity.hackclub.com/api/external/check';

/**
 * Live check against identity.hackclub.com — no auth required, no caching.
 * Lets us see verification status changes immediately, without waiting for
 * the user to log out and back in to refresh their JWT.
 *
 * The endpoint returns { result: string }; values starting with "verified"
 * (e.g. "verified_eligible") count as verified.
 */
@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  async isVerified(opts: { slackId?: string | null; email?: string | null }): Promise<boolean> {
    const result = await this.fetchResult(opts);
    return typeof result === 'string' && result.startsWith('verified');
  }

  private async fetchResult(opts: {
    slackId?: string | null;
    email?: string | null;
  }): Promise<string | null> {
    if (opts.slackId) {
      const r = await this.tryFetch({ slack_id: opts.slackId });
      if (r !== null) return r;
    }
    if (opts.email) {
      return this.tryFetch({ email: opts.email });
    }
    return null;
  }

  private async tryFetch(params: Record<string, string>): Promise<string | null> {
    const url = `${IDENTITY_CHECK_URL}?${new URLSearchParams(params).toString()}`;
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      const result = data?.result;
      return typeof result === 'string' ? result : null;
    } catch (err) {
      this.logger.warn(`Identity check failed for ${Object.keys(params)[0]}: ${err}`);
      return null;
    }
  }
}
