import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviews1760000002000 implements MigrationInterface {
  name = 'AddReviews1760000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE reviews (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
        text varchar(500),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (user_id, movie_id)
      )
    `);
    await queryRunner.query('CREATE INDEX idx_reviews_movie ON reviews(movie_id)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS reviews');
  }
}
