import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventHostedBy1779200000000 implements MigrationInterface {
  name = 'AddEventHostedBy1779200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "hosted_by" varchar(200)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN IF EXISTS "hosted_by"`);
  }
}
