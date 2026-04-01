import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac, timingSafeEqual } from 'crypto';
import { User } from '../entities/user.entity';

@Injectable()
export class HackatimeService {
  private readonly logger = new Logger(HackatimeService.name);
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;
  private readonly redirectUri: string;
  private readonly jwtSecret: string;
  private readonly baseUrl: string;
  private readonly configured: boolean;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {
    this.clientId = this.configService.get('HACKATIME_CLIENT_ID');
    this.clientSecret = this.configService.get('HACKATIME_CLIENT_SECRET');
    this.redirectUri = this.configService.get(
      'HACKATIME_REDIRECT_URI',
      'http://localhost:5173/auth/hackatime/callback',
    );
    this.jwtSecret = this.configService.getOrThrow('JWT_SECRET');
    this.baseUrl = this.configService.get(
      'HACKATIME_BASE_URL',
      'https://hackatime.hackclub.com',
    );
    this.configured = !!(this.clientId && this.clientSecret);
    if (!this.configured) {
      this.logger.warn('HACKATIME_CLIENT_ID/SECRET not set — Hackatime OAuth disabled');
    }
  }

  private assertConfigured(): void {
    if (!this.configured) {
      throw new Error('Hackatime OAuth is not configured');
    }
  }

  private signState(state: string): string {
    // Prefix with flow name to prevent cross-flow state confusion with HCA OAuth
    return createHmac('sha256', this.jwtSecret)
      .update(`hackatime:${state}`)
      .digest('hex');
  }

  startAuth(): { url: string; state: string } {
    this.assertConfigured();

    const state = crypto.randomUUID();
    const signature = this.signState(state);
    const signedState = `${state}.${signature}`;

    const params = new URLSearchParams({
      client_id: this.clientId!,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'profile read',
      state: signedState,
    });

    return {
      url: `${this.baseUrl}/oauth/authorize?${params.toString()}`,
      state,
    };
  }

  async handleCallback(
    code: string,
    returnedSignedState: string,
    cookieState: string,
    userId: string,
  ): Promise<{ success: boolean; redirectTo: string }> {
    this.assertConfigured();

    // 1. Verify state (same HMAC pattern as HCA OAuth)
    const dotIndex = returnedSignedState.lastIndexOf('.');
    if (dotIndex === -1) {
      throw new Error('Malformed state parameter');
    }

    const stateValue = returnedSignedState.substring(0, dotIndex);
    const signature = returnedSignedState.substring(dotIndex + 1);

    const stateBuffer = Buffer.from(stateValue);
    const cookieBuffer = Buffer.from(cookieState);
    if (
      stateBuffer.length !== cookieBuffer.length ||
      !timingSafeEqual(stateBuffer, cookieBuffer)
    ) {
      throw new Error('State mismatch');
    }

    const expectedSignature = this.signState(stateValue);
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      throw new Error('Invalid state signature');
    }

    // 2. Exchange code for tokens
    const tokenResponse = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
      }),
    });

    if (!tokenResponse.ok) {
      this.logger.error(
        `Hackatime token exchange failed: ${tokenResponse.status}`,
      );
      throw new Error('Hackatime token exchange failed');
    }

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      this.logger.error('Hackatime token response missing access_token');
      throw new Error('Invalid token response from Hackatime');
    }

    // 3. Persist the token to the user's DB record
    // Use find+save (not update) so the column encryption transformer runs
    const user = await this.userRepo.findOne({ where: { hcaSub: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    user.hackatimeToken = tokens.access_token;
    await this.userRepo.save(user);
    this.logger.log(`Hackatime connected for user ${userId}`);

    return { success: true, redirectTo: '/tutorial' };
  }

  async isConnected(userId: string): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { hcaSub: userId },
      select: ['hackatimeToken'],
    });
    return !!user?.hackatimeToken;
  }
}
