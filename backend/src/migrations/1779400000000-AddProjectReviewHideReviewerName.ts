import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectReviewHideReviewerName1779400000000 implements MigrationInterface {
    name = 'AddProjectReviewHideReviewerName1779400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_reviews"
            ADD COLUMN "hide_reviewer_name" boolean NOT NULL DEFAULT false
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_reviews"
            DROP COLUMN "hide_reviewer_name"
        `);
    }
}
