import 'reflect-metadata';
import { CacheModule } from '@nestjs/cache-manager';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import { DataType, newDb } from 'pg-mem';
import request from 'supertest';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { createComplexityRule, fieldExtensionsEstimator, simpleEstimator } from 'graphql-query-complexity';
import { AuthModule } from '../server/auth/auth.module.js';
import { ElapsedTimeInterceptor } from '../server/common/interceptors/elapsed-time.interceptor.js';
import { InitialSchema1760000000000 } from '../server/database/migrations/1760000000000-initial-schema.js';
import { Genre } from '../server/genres/genre.entity.js';
import { GenresModule } from '../server/genres/genres.module.js';
import { Credit } from '../server/movies/entities/credit.entity.js';
import { Movie } from '../server/movies/entities/movie.entity.js';
import { MoviesModule } from '../server/movies/movies.module.js';
import { MoviesService } from '../server/movies/movies.service.js';
import { Friendship } from '../server/users/entities/friendship.entity.js';
import { Swipe } from '../server/users/entities/swipe.entity.js';
import { User } from '../server/users/entities/user.entity.js';
import { UsersModule } from '../server/users/users.module.js';

describe('Film Tinder REST API (e2e)', () => {
  let app: INestApplication;
  let movieId: string;

  beforeAll(async () => {
    const memoryDb = newDb({ autoCreateForeignKeyIndices: true });
    memoryDb.public.registerFunction({ name: 'version', returns: DataType.text, implementation: () => 'PostgreSQL 17.0' });
    memoryDb.public.registerFunction({ name: 'current_database', returns: DataType.text, implementation: () => 'film_tinder_test' });
    memoryDb.public.registerFunction({ name: 'quote_ident', args: [DataType.text], returns: DataType.text, implementation: (value) => value });
    memoryDb.public.registerFunction({ name: 'obj_description', args: [DataType.regclass, DataType.text], returns: DataType.text, implementation: () => null, allowNullArguments: true });
    memoryDb.registerExtension('pgcrypto', (schema) => {
      schema.registerFunction({ name: 'gen_random_uuid', returns: DataType.uuid, implementation: randomUUID, impure: true });
    });

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        CacheModule.register({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'postgres' as const,
            entities: [User, Movie, Genre, Credit, Swipe, Friendship],
            migrations: [InitialSchema1760000000000],
            migrationsRun: true,
            synchronize: false,
            retryAttempts: 1,
          }),
          dataSourceFactory: async (options?: DataSourceOptions) => {
            const dataSource = memoryDb.adapters.createTypeormDataSource(options) as DataSource;
            return dataSource.initialize();
          },
        }),
        AuthModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: () => ({ secret: 'e2e-secret-with-more-than-thirty-two-characters', expiresIn: '1h' }),
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          graphiql: true,
          context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
          validationRules: [createComplexityRule({
            maximumComplexity: 100,
            variables: {},
            estimators: [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })],
          })],
        }),
        MoviesModule,
        GenresModule,
        UsersModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalInterceptors(new ElapsedTimeInterceptor());
    await app.init();

    const movie = await moduleRef.get(MoviesService).create({
      title: 'Тестовый фильм',
      description: 'Фильм для сквозной проверки API',
      posterUrl: '/poster.jpg',
      backdropUrl: '/backdrop.jpg',
      rating: 8.2,
      year: 2024,
      genres: ['Драма'],
      director: 'Режиссёр',
      cast: ['Актёр'],
    });
    movieId = movie.id;
  }, 20_000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('registers a user, returns catalog, records a swipe and exposes it in profile', async () => {
    const registration = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'e2e@example.com', name: 'E2E User', password: 'StrongPass123!' })
      .expect(201);
    const cookie = registration.headers['set-cookie'];
    expect(cookie).toBeDefined();

    const catalog = await request(app.getHttpServer()).get('/api/movies?page=1&limit=10').expect(200);
    expect(catalog.body.meta.total).toBe(1);
    expect(catalog.body.data[0].genres).toEqual(['Драма']);
    expect(catalog.headers.etag).toBeDefined();
    expect(catalog.headers['x-elapsed-time']).toBeDefined();

    await request(app.getHttpServer())
      .post(`/api/movies/${movieId}/swipes`)
      .set('Cookie', cookie)
      .send({ direction: 'like' })
      .expect(201);

    const profile = await request(app.getHttpServer()).get('/api/users/me').set('Cookie', cookie).expect(200);
    expect(profile.body.likedMovies).toContain(movieId);

    const graph = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ movies(page: 1, limit: 10) { data { id title genres { name } credits { name role } } meta { total } } }' })
      .expect(200);
    expect(graph.body.errors).toBeUndefined();
    expect(graph.body.data.movies.meta.total).toBe(1);
    expect(graph.headers['x-elapsed-time']).toBeDefined();

    const graphiql = await request(app.getHttpServer()).get('/graphql').set('Accept', 'text/html').expect(200);
    expect(graphiql.text).toContain('GraphiQL');
  });

  it('rejects invalid pagination and protected access without a session', async () => {
    await request(app.getHttpServer()).get('/api/movies?page=0').expect(400);
    await request(app.getHttpServer()).get('/api/users/me').expect(401);
  });
});
