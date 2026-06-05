import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewerUserNote1779300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "reviewer_user_note" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "reviewer_user_note"`,
    );
  }
}
