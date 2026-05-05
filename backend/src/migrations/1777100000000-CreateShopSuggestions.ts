import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShopSuggestions1777100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "shop_suggestions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "text" varchar(200) NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shop_suggestions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_shop_suggestions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_shop_suggestions_user_id" ON "shop_suggestions" ("user_id")`);

    await queryRunner.query(`
      CREATE TABLE "shop_suggestion_votes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "suggestion_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shop_suggestion_votes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_shop_suggestion_votes_user_suggestion" UNIQUE ("user_id", "suggestion_id"),
        CONSTRAINT "FK_shop_suggestion_votes_suggestion" FOREIGN KEY ("suggestion_id") REFERENCES "shop_suggestions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_shop_suggestion_votes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_shop_suggestion_votes_suggestion_id" ON "shop_suggestion_votes" ("suggestion_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_shop_suggestion_votes_user_id" ON "shop_suggestion_votes" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "shop_suggestion_votes"`);
    await queryRunner.query(`DROP TABLE "shop_suggestions"`);
  }
}
