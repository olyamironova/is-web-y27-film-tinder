import 'reflect-metadata';
import { CacheModule } from '@nestjs/cache-manager';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import {
  CanActivate,
  ExecutionContext,
  Global,
  INestApplication,
  Injectable,
  Module,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import { DataType, newDb } from 'pg-mem';
import request from 'supertest';
import { Repository, DataSource, type DataSourceOptions } from 'typeorm';
import { createComplexityRule, fieldExtensionsEstimator, simpleEstimator } from 'graphql-query-complexity';
import { AuthService } from '../server/auth/auth.service.js';
import { IS_PUBLIC_KEY } from '../server/common/decorators/public.decorator.js';
import { AuthenticatedRequest, AuthenticatedUser } from '../server/common/types/authenticated-request.js';
import { ElapsedTimeInterceptor } from '../server/common/interceptors/elapsed-time.interceptor.js';
import { InitialSchema1760000000000 } from '../server/database/migrations/1760000000000-initial-schema.js';
import { AddWatchLater1760000001000 } from '../server/database/migrations/1760000001000-add-watch-later.js';
import { AddReviews1760000002000 } from '../server/database/migrations/1760000002000-add-reviews.js';
import { AddAvatarHistory1760000003000 } from '../server/database/migrations/1760000003000-add-avatar-history.js';
import { SupertokensAuth1760000004000 } from '../server/database/migrations/1760000004000-supertokens-auth.js';
import { Genre } from '../server/genres/genre.entity.js';
import { GenresModule } from '../server/genres/genres.module.js';
import { Credit } from '../server/movies/entities/credit.entity.js';
import { Movie } from '../server/movies/entities/movie.entity.js';
import { MoviesModule } from '../server/movies/movies.module.js';
import { MoviesService } from '../server/movies/movies.service.js';
import { Friendship } from '../server/users/entities/friendship.entity.js';
import { Swipe } from '../server/users/entities/swipe.entity.js';
import { User, UserRole } from '../server/users/entities/user.entity.js';
import { UsersModule } from '../server/users/users.module.js';

const TEST_USER: AuthenticatedUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'e2e@example.com',
  name: 'E2E User',
  role: UserRole.USER,
};

@Injectable()
class TestAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.headers['x-test-user'] !== TEST_USER.id) {
      throw new UnauthorizedException('Требуется аутентификация');
    }
    request.user = TEST_USER;
    return true;
  }
}

const authServiceStub = {
  getOrCreateLocalUser: async () => TEST_USER,
  sessionUser: async () => null,
  changePassword: async () => undefined,
  updateEmail: async () => 'OK' as const,
};

@Global()
@Module({
  providers: [
    { provide: AuthService, useValue: authServiceStub },
    { provide: APP_GUARD, useClass: TestAuthGuard },
  ],
  exports: [AuthService],
})
class TestAuthModule {}

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

    let enumPatched = false;
    memoryDb.public.interceptQueries((sql) => {
      if (!enumPatched && /CREATE TYPE swipe_direction AS ENUM/i.test(sql)) {
        enumPatched = true;
        memoryDb.public.none("CREATE TYPE swipe_direction AS ENUM ('like', 'dislike', 'watch_later')");
        return [];
      }
      if (/ALTER TYPE swipe_direction ADD VALUE/i.test(sql)) return [];
      return null;
    });

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        CacheModule.register({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'postgres' as const,
            entities: [User, Movie, Genre, Credit, Swipe, Friendship],
            migrations: [
              InitialSchema1760000000000,
              AddWatchLater1760000001000,
              AddReviews1760000002000,
              AddAvatarHistory1760000003000,
              SupertokensAuth1760000004000,
            ],
            migrationsRun: true,
            synchronize: false,
            retryAttempts: 1,
          }),
          dataSourceFactory: async (options?: DataSourceOptions) => {
            const dataSource = memoryDb.adapters.createTypeormDataSource(options) as DataSource;
            return dataSource.initialize();
          },
        }),
        TestAuthModule,
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

    const users = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    await users.save(users.create(TEST_USER));

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

  it('returns catalog, records a swipe and exposes it in profile', async () => {
    const catalog = await request(app.getHttpServer()).get('/api/movies?page=1&limit=10').expect(200);
    expect(catalog.body.meta.total).toBe(1);
    expect(catalog.body.data[0].genres).toEqual(['Драма']);
    expect(catalog.headers.etag).toBeDefined();
    expect(catalog.headers['x-elapsed-time']).toBeDefined();

    await request(app.getHttpServer())
      .post(`/api/movies/${movieId}/swipes`)
      .set('x-test-user', TEST_USER.id)
      .send({ direction: 'like' })
      .expect(201);

    const profile = await request(app.getHttpServer()).get('/api/users/me').set('x-test-user', TEST_USER.id).expect(200);
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
