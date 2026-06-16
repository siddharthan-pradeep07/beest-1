import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserReviewerMarkers1779500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "watchlisted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "cool_builder" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "cool_builder"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "watchlisted"`,
    );
  }
}
