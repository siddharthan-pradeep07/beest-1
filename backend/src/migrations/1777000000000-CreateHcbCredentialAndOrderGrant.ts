import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHcbCredentialAndOrderGrant1777000000000 implements MigrationInterface {
    name = 'CreateHcbCredentialAndOrderGrant1777000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Single-row store for the HCB OAuth connection (tokens encrypted at rest).
        await queryRunner.query(`
            CREATE TABLE "hcb_credentials" (
                "id" varchar(32) NOT NULL,
                "access_token" text NOT NULL,
                "refresh_token" text NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "scope" varchar(255),
                "connected_by_user_id" uuid,
                "connected_by_email" varchar(320),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_hcb_credentials" PRIMARY KEY ("id")
            )
        `);

        // Per-order idempotency lock: the HCB card grant public id (cdg_…).
        await queryRunner.query(`ALTER TABLE "orders" ADD "hcb_card_grant_id" varchar(64)`);
        // Enforce one grant per HCB card grant id at the DB level (defence in depth).
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_orders_hcb_card_grant_id" ON "orders"("hcb_card_grant_id") WHERE "hcb_card_grant_id" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "UQ_orders_hcb_card_grant_id"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "hcb_card_grant_id"`);
        await queryRunner.query(`DROP TABLE "hcb_credentials"`);
    }
}
