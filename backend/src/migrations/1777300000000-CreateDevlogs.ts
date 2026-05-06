import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDevlogs1777300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "devlogs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "project_id" uuid NULL,
        "text" text NOT NULL,
        "image_urls" text NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_devlogs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_devlogs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_devlogs_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_devlogs_user_id" ON "devlogs" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_devlogs_project_id" ON "devlogs" ("project_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_devlogs_created_at" ON "devlogs" ("created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "devlogs"`);
  }
}
