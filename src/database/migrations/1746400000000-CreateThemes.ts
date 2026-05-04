import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateThemes1746400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE themes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX idx_themes_user_id ON themes(user_id)`);

    await queryRunner.query(`ALTER TABLE lots ADD COLUMN theme_id UUID`);

    await queryRunner.query(`
      ALTER TABLE lots
        ADD CONSTRAINT fk_lots_theme
        FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE lots DROP CONSTRAINT fk_lots_theme`);
    await queryRunner.query(`ALTER TABLE lots DROP COLUMN theme_id`);
    await queryRunner.query(`DROP INDEX idx_themes_user_id`);
    await queryRunner.query(`DROP TABLE themes`);
  }
}
