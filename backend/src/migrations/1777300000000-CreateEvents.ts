import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEvents1777300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
         title varchar(200) NOT NULL,
        description text,
        start_at timestamptz NOT NULL,
        end_at timestamptz,
        location varchar(255),
        url varchar(255),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE events;`);
  }
}
