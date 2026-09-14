import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWatchLater1760000001000 implements MigrationInterface {
  name = 'AddWatchLater1760000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TYPE swipe_direction ADD VALUE IF NOT EXISTS 'watch_later'");
  }

  async down(): Promise<void> {
  }
}
