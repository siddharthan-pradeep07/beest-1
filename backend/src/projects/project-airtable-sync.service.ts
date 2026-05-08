import { Injectable, Logger } from '@nestjs/common';
import { Project } from '../entities/project.entity';
import { Submission } from '../entities/submission.entity';
import { RsvpService } from '../rsvp/rsvp.service';
import { HcaService } from '../hca/hca.service';

/**
 * Builds the Airtable Projects-table field map for an approved project and
 * pushes it. Extracted so both the existing SuperAdmin resync endpoint and the
 * fraud-review poller can reuse it (the poller is now what triggers Airtable
 * sync on first-time approvals — direct beest review no longer does).
 */
@Injectable()
export class ProjectAirtableSyncService {
  private readonly logger = new Logger(ProjectAirtableSyncService.name);

  constructor(
    private readonly rsvpService: RsvpService,
    private readonly hcaService: HcaService,
  ) {}

  async syncApprovedProject(
    project: Project,
    overrideJustification: string | null,
    submission: Submission | null,
  ): Promise<void> {
    if (!project.user?.email) {
      this.logger.warn(`Skipping Airtable sync for ${project.id} — no user email`);
      return;
    }

    const identity = await this.hcaService.getIdentity(project.user.hcaSub);
    const address = identity?.address ?? {};
    const streetLines = (address.street_address ?? '').split(/\r?\n/);

    const fullName = identity?.name ?? '';
    const [splitFirst, ...splitRest] = fullName.split(' ');
    const firstName = (identity as any)?.given_name ?? splitFirst;
    const lastName = (identity as any)?.family_name ?? splitRest.join(' ');

    const screenshots = [project.screenshot1Url, project.screenshot2Url]
      .filter((url): url is string => !!url)
      .map((url) => ({ url }));

    const shipInternalHours = submission?.internalHours ?? project.internalHours;

    const fields: Record<string, any> = {
      'First Name': firstName,
      'Last Name': lastName,
      Description: project.description,
      Email: project.user.email,
      'Playable URL': project.demoUrl,
      'Code URL': project.codeUrl,
      Screenshot: screenshots,
      'Address (Line 1)': streetLines[0],
      'Address (Line 2)': streetLines.slice(1).join(', '),
      City: address.locality,
      'State / Province': address.region,
      Country: address.country,
      'ZIP / Postal Code': address.postal_code,
      Birthday: identity?.birthdate,
      'Override Hours Spent': shipInternalHours,
      'Override Hours Spent Justification': overrideJustification,
    };

    const cleanFields = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => {
        if (v === null || v === undefined || v === '') return false;
        if (Array.isArray(v) && v.length === 0) return false;
        return true;
      }),
    );

    await this.rsvpService.createApprovedProjectRecord(cleanFields);
  }
}
