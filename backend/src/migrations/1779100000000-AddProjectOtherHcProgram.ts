import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectOtherHcProgram1779100000000 implements MigrationInterface {
  name = 'AddProjectOtherHcProgram1779100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "other_hc_program" varchar(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN IF EXISTS "other_hc_program"`);
  }
}
