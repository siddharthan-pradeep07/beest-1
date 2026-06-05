import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveEventLocation1777400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE events DROP COLUMN IF EXISTS location;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE events ADD COLUMN location varchar(255);`);
  }
}
