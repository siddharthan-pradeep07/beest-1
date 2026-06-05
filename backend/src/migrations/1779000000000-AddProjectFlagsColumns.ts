import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectFlagsColumns1779000000000 implements MigrationInterface {
  name = 'AddProjectFlagsColumns1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "override_hours" real`);
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "internal_hours" real`);
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "is_update" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "pipes_granted" integer NOT NULL DEFAULT 0`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "pipes_granted"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "is_update"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "internal_hours"`);
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "override_hours"`);
  }
}
