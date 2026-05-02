import { MigrationInterface, QueryRunner } from 'typeorm';

export class RedesignExchangeRates1746201800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "exchange_rates"`);
    await queryRunner.query(`
      CREATE TABLE "exchange_rates" (
        "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
        "date"       DATE         NOT NULL,
        "usd_to_krw" DECIMAL(18,4) NOT NULL,
        "created_at" TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exchange_rates"        PRIMARY KEY ("id"),
        CONSTRAINT "UQ_exchange_rates_date"   UNIQUE ("date")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "exchange_rates"`);
    await queryRunner.query(`
      CREATE TABLE "exchange_rates" (
        "id"           UUID          NOT NULL DEFAULT gen_random_uuid(),
        "from_currency" VARCHAR(10)   NOT NULL,
        "to_currency"   VARCHAR(10)   NOT NULL,
        "rate"          DECIMAL(18,8) NOT NULL,
        "fetched_at"    TIMESTAMPTZ   NOT NULL,
        "expires_at"    TIMESTAMPTZ   NOT NULL,
        CONSTRAINT "PK_exchange_rates" PRIMARY KEY ("id")
      )
    `);
  }
}
