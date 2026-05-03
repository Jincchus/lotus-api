import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultStrategyToUsers1746300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN default_strategy_id UUID,
        ADD CONSTRAINT fk_users_default_strategy
          FOREIGN KEY (default_strategy_id) REFERENCES strategies(id) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        DROP CONSTRAINT fk_users_default_strategy,
        DROP COLUMN default_strategy_id
    `);
  }
}
