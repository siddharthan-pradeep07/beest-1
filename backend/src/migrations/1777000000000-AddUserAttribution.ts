import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserAttribution1777000000000 implements MigrationInterface {
    name = 'AddUserAttribution1777000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "utm_source" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "utm_medium" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "utm_campaign" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "referrer" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "landing_path" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "landing_path"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "referrer"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "utm_campaign"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "utm_medium"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "utm_source"`);
    }
}
