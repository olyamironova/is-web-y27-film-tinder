import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatarHistory1760000003000 implements MigrationInterface {
  name = 'AddAvatarHistory1760000003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE users ADD COLUMN avatar_urls text[] NOT NULL DEFAULT '{}'");
    await queryRunner.query("UPDATE users SET avatar_urls = ARRAY[avatar_url] WHERE avatar_url IS NOT NULL AND avatar_url <> ''");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE users DROP COLUMN IF EXISTS avatar_urls');
  }
}
