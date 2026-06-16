import { Injectable, Logger } from '@nestjs/common';
import { fetchWithTimeout } from '../fetch.util';

const IDENTITY_CHECK_URL = 'https://identity.hackclub.com/api/external/check';

/**
 * Identity status, derived from the raw identity.hackclub.com result string.
 *  - `eligible`   — verified AND eligible for YSWS rewards (`verified_eligible`)
 *  - `ineligible` — identity verified but NOT eligible, e.g. age/region
 *                   (`verified_ineligible`). Counts as "verified" but must NOT
 *                   pass the ship gate.
 *  - `unverified` — no completed verification (`needs_submission`, `pending`,
 *                   network error, unknown value, …).
 */
export type IdentityStatus = 'eligible' | 'ineligible' | 'unverified';

/**
 * Live check against identity.hackclub.com — no auth required, no caching.
 * Lets us see verification status changes immediately, without waiting for
 * the user to log out and back in to refresh their JWT.
 *
 * The endpoint returns { result: string }. Values starting with "verified"
 * mean the identity document was accepted; the suffix encodes YSWS
 * eligibility ("verified_eligible" vs "verified_ineligible"). Shipping rewards
 * requires eligibility, not merely a verified document — see getStatus().
 */
@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  /** Full status — distinguishes eligible from verified-but-ineligible. */
  async getStatus(opts: {
    slackId?: string | null;
    email?: string | null;
  }): Promise<IdentityStatus> {
    const result = await this.fetchResult(opts);
    if (typeof result !== 'string' || !result.startsWith('verified')) {
      return 'unverified';
    }
    // "verified_ineligible" (and any future ineligible variant) is verified but
    // barred from rewards; everything else that starts with "verified" is good.
    return result.includes('ineligible') ? 'ineligible' : 'eligible';
  }

  /** True if the identity document is verified, regardless of YSWS eligibility. */
  async isVerified(opts: { slackId?: string | null; email?: string | null }): Promise<boolean> {
    return (await this.getStatus(opts)) !== 'unverified';
  }

  /** True only if verified AND eligible for YSWS rewards. Gate shipping on this. */
  async isEligible(opts: { slackId?: string | null; email?: string | null }): Promise<boolean> {
    return (await this.getStatus(opts)) === 'eligible';
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
