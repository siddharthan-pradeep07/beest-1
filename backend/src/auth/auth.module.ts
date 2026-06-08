import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RsvpModule } from '../rsvp/rsvp.module';
import { IdentityModule } from '../identity/identity.module';
import { User } from '../entities/user.entity';
import { Session } from '../entities/session.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: {
          expiresIn: '1h',
          issuer: 'beest',
          audience: 'beest',
        },
        verifyOptions: {
          issuer: 'beest',
          audience: 'beest',
        },
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 30 }],
    }),
    RsvpModule,
    IdentityModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
