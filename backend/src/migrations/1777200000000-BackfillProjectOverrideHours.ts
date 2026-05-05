import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * One-shot data fix for projects where override_hours got silently zeroed (or
 * reduced below pipes_granted) during a re-approval — see admin.service.ts:375
 * for the prevention. Without this fix the home progress bar shows 0 hours for
 * the project even though the user keeps the pipes that were granted on the
 * earlier approval.
 *
 * Restore target: the highest override_hours seen on any submission for the
 * project. If no submission carries a usable value we fall back to
 * pipes_granted, which is the minimum that re-aligns the bar with the granted
 * pipes (pipes_granted = floor(override_hours), so override_hours >= pipes_granted
 * is the invariant). GREATEST guarantees we never restore below pipes_granted.
 *
 * The corresponding code change rejects future approvals that would
 * re-introduce this state, so this migration is a one-shot — the down() is a
 * no-op because we cannot reconstruct the corrupted zero values, nor would we
 * want to.
 */
export class BackfillProjectOverrideHours1777200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE projects p
      SET override_hours = GREATEST(
        COALESCE(
          (
            SELECT MAX(s.override_hours)
            FROM submissions s
            WHERE s.project_id = p.id
              AND s.override_hours IS NOT NULL
          ),
          p.pipes_granted
        ),
        p.pipes_granted
      )
      WHERE p.pipes_granted > 0
        AND (p.override_hours IS NULL OR p.override_hours < p.pipes_granted)
    `);
  }

  public async down(): Promise<void> {
    // No-op: this is a one-shot correction. Reversing it would re-introduce
    // the bug.
  }
}
