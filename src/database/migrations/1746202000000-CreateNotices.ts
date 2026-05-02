import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotices1746202000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notices" (
        "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
        "title"      VARCHAR(200) NOT NULL,
        "content"    TEXT         NOT NULL,
        "is_active"  BOOLEAN      NOT NULL DEFAULT true,
        "created_by" UUID,
        "created_at" TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notices" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notices"`);
  }
}
