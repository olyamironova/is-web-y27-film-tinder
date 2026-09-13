import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1760000000000 implements MigrationInterface {
  name = 'InitialSchema1760000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query("CREATE TYPE user_role AS ENUM ('user', 'admin')");
    await queryRunner.query("CREATE TYPE swipe_direction AS ENUM ('like', 'dislike')");
    await queryRunner.query("CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'rejected')");
    await queryRunner.query("CREATE TYPE credit_role AS ENUM ('director', 'actor')");
    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar NOT NULL UNIQUE,
        password_hash varchar NOT NULL,
        name varchar(80) NOT NULL,
        avatar_url varchar,
        role user_role NOT NULL DEFAULT 'user',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE movies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title varchar(200) NOT NULL,
        description text NOT NULL,
        poster_url text NOT NULL,
        backdrop_url text NOT NULL,
        rating double precision NOT NULL CHECK (rating >= 0 AND rating <= 10),
        year smallint NOT NULL CHECK (year >= 1888 AND year <= 2100),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE TABLE genres (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(64) NOT NULL UNIQUE)`);
    await queryRunner.query(`
      CREATE TABLE movie_genres (
        movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        genre_id uuid NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
        PRIMARY KEY (movie_id, genre_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE credits (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        name varchar(120) NOT NULL,
        role credit_role NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE swipes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        movie_id uuid NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        direction swipe_direction NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_swipe_user_movie UNIQUE (user_id, movie_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE friendships (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        addressee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status friendship_status NOT NULL DEFAULT 'pending',
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_friendship_pair UNIQUE (requester_id, addressee_id),
        CONSTRAINT chk_friendship_not_self CHECK (requester_id <> addressee_id)
      )
    `);
    await queryRunner.query('CREATE INDEX idx_movies_rating ON movies (rating DESC)');
    await queryRunner.query('CREATE INDEX idx_swipes_user ON swipes (user_id)');
    await queryRunner.query('CREATE INDEX idx_friendships_addressee ON friendships (addressee_id)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS friendships');
    await queryRunner.query('DROP TABLE IF EXISTS swipes');
    await queryRunner.query('DROP TABLE IF EXISTS credits');
    await queryRunner.query('DROP TABLE IF EXISTS movie_genres');
    await queryRunner.query('DROP TABLE IF EXISTS genres');
    await queryRunner.query('DROP TABLE IF EXISTS movies');
    await queryRunner.query('DROP TABLE IF EXISTS users');
    await queryRunner.query('DROP TYPE IF EXISTS credit_role');
    await queryRunner.query('DROP TYPE IF EXISTS friendship_status');
    await queryRunner.query('DROP TYPE IF EXISTS swipe_direction');
    await queryRunner.query('DROP TYPE IF EXISTS user_role');
  }
}
