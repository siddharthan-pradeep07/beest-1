import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFraudReviews1778000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "fraud_reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL,
        "remote_project_id" varchar(64) NULL,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "trust_score" integer NULL,
        "justification" text NULL,
        "outcome_recorded" boolean NOT NULL DEFAULT false,
        "reviewed_at" timestamp NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fraud_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_fraud_reviews_project_id" UNIQUE ("project_id"),
        CONSTRAINT "FK_fraud_reviews_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_fraud_reviews_status" ON "fraud_reviews" ("status")`,
    );

    // Make project_reviews.reviewer_id nullable so fraud-rejection reviews
    // (system-authored, no human reviewer) can be inserted. Also relax the FK
    // ON DELETE CASCADE → SET NULL so deleting a reviewer account doesn't
    // wipe the historical review trail.
    await queryRunner.query(
      `ALTER TABLE "project_reviews" ALTER COLUMN "reviewer_id" DROP NOT NULL`,
    );
    // Find and drop the existing FK by introspection (constraint name may vary
    // across environments depending on TypeORM auto-generation).
    await queryRunner.query(`
      DO $$
      DECLARE fk_name text;
      BEGIN
        SELECT conname INTO fk_name
        FROM pg_constraint
        WHERE conrelid = 'project_reviews'::regclass
          AND contype = 'f'
          AND conkey = ARRAY[(
            SELECT attnum FROM pg_attribute
            WHERE attrelid = 'project_reviews'::regclass AND attname = 'reviewer_id'
          )]
        LIMIT 1;
        IF fk_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE project_reviews DROP CONSTRAINT %I', fk_name);
        END IF;
      END$$;
    `);
    await queryRunner.query(`
      ALTER TABLE "project_reviews"
      ADD CONSTRAINT "FK_project_reviews_reviewer"
      FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "fraud_reviews"`);
    // Note: not reverting the project_reviews.reviewer_id nullability change
    // here because down-migrating could fail on rows with NULL reviewers.
  }
}
