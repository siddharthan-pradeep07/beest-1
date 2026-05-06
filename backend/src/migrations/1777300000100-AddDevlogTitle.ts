import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDevlogTitle1777300000100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add as NOT NULL with an empty default so any pre-existing rows fit;
    // application layer enforces non-empty going forward.
    await queryRunner.query(
      `ALTER TABLE "devlogs" ADD COLUMN "title" varchar(120) NOT NULL DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "devlogs" DROP COLUMN "title"`);
  }
}
