import { Controller, Get, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HackatimeService } from '../hackatime/hackatime.service';
import { User } from '../entities/user.entity';
import { ProjectsService } from './projects.service';

@Controller('api/leaderboard')
export class LeaderboardController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly hackatimeService: HackatimeService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Returns the top 10 users by approved Hackatime hours.
   * No PII is exposed — only display names and hours.
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getLeaderboard() {
    const [grouped, totalUsers] = await Promise.all([
      this.projectsService.findApprovedProjectsGroupedByUser(),
      this.userRepo.count(),
    ]);

    const results = await Promise.allSettled(
      Array.from(grouped.entries()).map(async ([, entry]) => {
        const allNames = [
          ...new Set(entry.projects.flatMap((p) => p.hackatimeProjectNames)),
        ];
        const { perProject } = await this.hackatimeService.getHoursForProjects(
          entry.hcaSub,
          allNames,
        );
        // Approved hours per project = min(overrideHours, hackatime hours on its names).
        // Mirrors the per-user calc in projects.controller.ts#getHours so the
        // leaderboard shows what was actually locked in at approval, not raw logged time.
        let hours = 0;
        for (const proj of entry.projects) {
          let projHours = 0;
          for (const name of proj.hackatimeProjectNames) {
            projHours += perProject[name] ?? 0;
          }
          hours += Math.min(proj.overrideHours, projHours);
        }
        return {
          name: entry.nickname || entry.name || 'Anonymous',
          hours,
        };
      }),
    );

    const leaderboard = results
      .filter(
        (r): r is PromiseFulfilledResult<{ name: string; hours: number }> =>
          r.status === 'fulfilled' && r.value.hours > 0,
      )
      .map((r) => r.value)
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);

    return { leaderboard, totalUsers };
  }
}
