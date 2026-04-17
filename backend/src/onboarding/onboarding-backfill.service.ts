import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, IsNull, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Project } from '../entities/project.entity';
import { RsvpService } from '../rsvp/rsvp.service';

@Injectable()
export class OnboardingBackfillService implements OnModuleInit {
  private readonly logger = new Logger(OnboardingBackfillService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    private readonly rsvpService: RsvpService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    if (this.config.get<string>('ONBOARDING_BACKFILL') !== '1') return;
    // Run in background so app startup isn't blocked — backfill can take minutes at Airtable rate limits
    setImmediate(() => this.runBackfill().catch((err) => this.logger.error(`Backfill failed: ${err}`)));
  }

  private async runBackfill() {
    this.logger.log('ONBOARDING_BACKFILL=1 — running one-shot funnel backfill in background...');

    const hackatimeUsers = await this.userRepo.find({
      where: { hackatimeToken: Not(IsNull()) },
      select: ['id', 'email'],
    });
    const projectUserIds = new Set(
      (await this.projectRepo.createQueryBuilder('p')
        .select('DISTINCT p.user_id', 'user_id')
        .getRawMany()).map((r) => r.user_id),
    );

    const onboardedCandidates = await this.userRepo.find({
      select: ['id', 'email', 'hackatimeToken', 'twoEmails'],
    });
    const onboardedUsers = onboardedCandidates.filter(
      (u) => u.email && (u.hackatimeToken || u.twoEmails || projectUserIds.has(u.id)),
    );

    this.logger.log(
      `Backfill targets: ${hackatimeUsers.length} hackatime-synched, ${onboardedUsers.length} onboarded`,
    );

    // Users who have projects with linked Hackatime project names
    const detailedProjectUsers = await this.projectRepo
      .createQueryBuilder('p')
      .innerJoin('p.user', 'u')
      .where('p.hackatime_project_name IS NOT NULL')
      .andWhere("p.hackatime_project_name != '[]'")
      .select('DISTINCT u.email', 'email')
      .getRawMany();

    for (const u of hackatimeUsers) {
      if (u.email) await this.rsvpService.updateDateField(u.email, 'Loops - beestHackatimeSynched');
    }
    for (const u of onboardedUsers) {
      await this.rsvpService.updateDateField(u.email, 'Loops - beestOnboarded');
    }
    for (const row of detailedProjectUsers) {
      if (row.email) await this.rsvpService.updateDateField(row.email, 'Loops - beestDetailedProject');
    }

    this.logger.log(
      `Backfill targets: ${detailedProjectUsers.length} detailed-project`,
    );
    this.logger.log('Onboarding funnel backfill complete. Unset ONBOARDING_BACKFILL to skip on next boot.');
  }
}
