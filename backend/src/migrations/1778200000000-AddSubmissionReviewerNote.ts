import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubmissionReviewerNote1778200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "submissions" ADD COLUMN "reviewer_note" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "reviewer_note"`);
  }
}
