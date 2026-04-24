import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserGender1776400000000 implements MigrationInterface {
    name = 'AddUserGender1776400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "gender" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "gender"`);
    }
}
