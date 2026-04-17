import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShopDetailedDescription1776300000000 implements MigrationInterface {
    name = 'AddShopDetailedDescription1776300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shop_items" ADD "detailed_description" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shop_items" DROP COLUMN "detailed_description"`);
    }
}
