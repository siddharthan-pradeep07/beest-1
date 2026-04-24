import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HackatimeService } from '../hackatime/hackatime.service';
import { Project } from '../entities/project.entity';
import { ProjectReview } from '../entities/project-review.entity';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './create-project.dto';
import { UpdateProjectDto } from './update-project.dto';

@Controller('api/projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly hackatimeService: HackatimeService,
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    @InjectRepository(ProjectReview) private readonly reviewRepo: Repository<ProjectReview>,
  ) {}

  /**
   * Returns total Hackatime hours across all of the user's linked projects.
   * Called on page load — Hackatime time increases without site interaction.
   */
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Get('hours')
  async getHours(@Req() req: Request) {
    const user = (req as any).user;
    if (!user?.uid) throw new UnauthorizedException('No user identity');

    const projects = await this.projectsService.findByUser(user.uid);
    const linkedNames = projects
      .flatMap((p) => p.hackatimeProjectName ?? [])
      .filter((n): n is string => !!n);

    const { hours, perProject } = await this.hackatimeService.getHoursForProjects(
      user.sub,
      [...new Set(linkedNames)],
    );

    const byStatus: Record<string, number> = {};
    for (const p of projects) {
      const names = p.hackatimeProjectName ?? [];
      const status = p.status ?? 'unshipped';

      let currentHours = 0;
      for (const name of names) {
        if (perProject[name]) currentHours += perProject[name];
      }
      if (currentHours <= 0) continue;

      // overrideHours is the hours locked in at the last approval (user-facing, drives pipes).
      // Anything beyond that is post-approval work that hasn't been approved yet.
      // When a project is in changes_needed, any prior approval has been revoked
      // (pipes are clawed back in admin.service.ts#reviewProject), so those hours
      // must not count as approved — they belong to the changes_needed bucket.
      const approvedCountsTowardApproved =
        status === 'approved' || status === 'unreviewed';
      const approvedSoFar = approvedCountsTowardApproved
        ? Math.min(p.overrideHours ?? 0, currentHours)
        : 0;
      const remainder = Math.max(0, currentHours - approvedSoFar);

      if (approvedSoFar > 0) {
        byStatus['approved'] = (byStatus['approved'] ?? 0) + approvedSoFar;
      }
      if (remainder > 0) {
        const bucket = status === 'approved' ? 'unshipped' : status;
        byStatus[bucket] = (byStatus[bucket] ?? 0) + remainder;
      }
    }

    return { hours, byStatus };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Get('explore')
  async explore() {
    return this.projectsService.findApprovedProjects();
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Get('explore/:id')
  async exploreDetail(@Param('id') id: string) {
    const project = await this.projectsService.findApprovedProjectById(id);
    if (!project) throw new UnauthorizedException('Project not found');
    return project;
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Get('explore/:id/comments')
  async getComments(@Param('id') projectId: string) {
    return this.projectsService.getComments(projectId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('explore/:id/comments')
  async addComment(
    @Param('id') projectId: string,
    @Req() req: Request,
    @Body() body: { body?: string },
  ) {
    const user = (req as any).user;
    if (!user?.uid) throw new UnauthorizedException('No user identity');
    return this.projectsService.addComment(projectId, user.uid, body.body ?? '');
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Delete('explore/:id/comments/:commentId')
  async deleteComment(
    @Param('commentId') commentId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    if (!user?.uid) throw new UnauthorizedException('No user identity');
    return this.projectsService.deleteComment(commentId, user.uid, user.email);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateProjectDto) {
    const user = (req as any).user;
    if (!user?.uid) throw new UnauthorizedException('No user identity');

    return this.projectsService.create(dto, user.uid, user.sub, user.impersonator_name);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: Request) {
    const userId = (req as any).user?.uid;
    if (!userId) throw new UnauthorizedException('No user identity');

    return this.projectsService.findByUser(userId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateProjectDto,
  ) {
    const user = (req as any).user;
    if (!user?.uid) throw new UnauthorizedException('No user identity');

    return this.projectsService.update(id, dto, user.uid, user.sub, user.impersonator_name);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post(':id/resubmit')
  async resubmit(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() body: { changeDescription?: string; minHoursConfirmed?: boolean },
  ) {
    const user = (req as any).user;
    if (!user?.uid) throw new UnauthorizedException('No user identity');
    if (!body.changeDescription || typeof body.changeDescription !== 'string') {
      throw new UnauthorizedException('changeDescription is required');
    }
    return this.projectsService.resubmit(
      id,
      user.uid,
      user.sub,
      body.changeDescription,
      body.minHoursConfirmed === true,
      user.impersonator_name,
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    if (!user?.uid) throw new UnauthorizedException('No user identity');

    await this.projectsService.delete(id, user.uid, user.impersonator_name);
    return { deleted: true };
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Get(':id/reviews')
  async getReviews(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user?.uid;
    if (!userId) throw new UnauthorizedException('No user identity');

    // Verify the project belongs to the authenticated user
    const project = await this.projectRepo.findOne({
      where: { id, userId },
      select: ['id'],
    });
    if (!project) throw new UnauthorizedException('Project not found');

    const reviews = await this.reviewRepo.find({
      where: { projectId: id },
      order: { createdAt: 'DESC' },
      relations: ['reviewer'],
    });

    // Never expose internal notes to the user
    return reviews.map((r) => ({
      id: r.id,
      status: r.status,
      feedback: r.feedback,
      reviewerName: r.reviewer?.name ?? null,
      createdAt: r.createdAt,
    }));
  }
}
