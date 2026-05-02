import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateErrorLogs1746201700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "error_logs" (
        "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
        "message"    TEXT        NOT NULL,
        "stack"      TEXT,
        "user_id"    UUID,
        "path"       VARCHAR(500),
        "created_at" TIMESTAMP   NOT NULL DEFAULT now(),
        CONSTRAINT "PK_error_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_error_logs_created_at" ON "error_logs" ("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "error_logs"`);
  }
}
