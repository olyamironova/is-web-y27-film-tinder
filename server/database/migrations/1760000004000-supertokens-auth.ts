import { MigrationInterface, QueryRunner } from 'typeorm';

export class SupertokensAuth1760000004000 implements MigrationInterface {
  name = 'SupertokensAuth1760000004000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE users DROP COLUMN IF EXISTS password_hash');
    await queryRunner.query('ALTER TABLE users ALTER COLUMN id DROP DEFAULT');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()');
    await queryRunner.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar NOT NULL DEFAULT ''");
  }
}
