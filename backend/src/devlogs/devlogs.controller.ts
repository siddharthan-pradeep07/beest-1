import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DevlogsService } from './devlogs.service';
import { CreateDevlogDto } from './create-devlog.dto';

@Controller('api/devlogs')
export class DevlogsController {
  constructor(private readonly devlogsService: DevlogsService) {}

  /** List the current user's devlogs, newest first. */
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: Request) {
    const user = (req as any).user;
    if (!user?.uid) throw new UnauthorizedException('No user identity');
    return this.devlogsService.findByUser(user.uid);
  }

  /** Create a new devlog. Optional image upload via base64 data URIs. */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateDevlogDto) {
    const user = (req as any).user;
    if (!user?.uid) throw new UnauthorizedException('No user identity');
    return this.devlogsService.create(user.uid, dto);
  }

  /** Delete one of the current user's devlogs. */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    if (!user?.uid) throw new UnauthorizedException('No user identity');
    return this.devlogsService.deleteOwn(user.uid, id);
  }
}
