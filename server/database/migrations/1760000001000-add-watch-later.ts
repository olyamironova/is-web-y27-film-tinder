import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWatchLater1760000001000 implements MigrationInterface {
  name = 'AddWatchLater1760000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Третий тип свайпа «посмотреть позже». ADD VALUE идемпотентен и на PG12+ допустим в транзакции.
    await queryRunner.query("ALTER TYPE swipe_direction ADD VALUE IF NOT EXISTS 'watch_later'");
  }

  async down(): Promise<void> {
    // Удаление значения из enum в PostgreSQL нетривиально (нужно пересоздавать тип); откат не поддерживаем.
  }
}
