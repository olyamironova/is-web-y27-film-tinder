import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createComplexityRule, fieldExtensionsEstimator, simpleEstimator } from 'graphql-query-complexity';
import { AdminModule } from './admin/admin.module.js';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { ElapsedTimeInterceptor } from './common/interceptors/elapsed-time.interceptor.js';
import { DatabaseModule } from './database/database.module.js';
import { InitialSchema1760000000000 } from './database/migrations/1760000000000-initial-schema.js';
import { AddWatchLater1760000001000 } from './database/migrations/1760000001000-add-watch-later.js';
import { GenresModule } from './genres/genres.module.js';
import { Genre } from './genres/genre.entity.js';
import { Credit } from './movies/entities/credit.entity.js';
import { Movie } from './movies/entities/movie.entity.js';
import { MoviesModule } from './movies/movies.module.js';
import { Friendship } from './users/entities/friendship.entity.js';
import { Swipe } from './users/entities/swipe.entity.js';
import { User } from './users/entities/user.entity.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true, ttl: 5_000, max: 200 }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL', 'postgresql://film_tinder:film_tinder@localhost:5432/film_tinder'),
        entities: [User, Movie, Genre, Credit, Swipe, Friendship],
        migrations: [InitialSchema1760000000000, AddWatchLater1760000001000],
        migrationsRun: true,
        synchronize: false,
        ssl: config.get<string>('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        logging: config.get<string>('TYPEORM_LOGGING') === 'true',
      }),
    }),
    AuthModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'development-secret-change-me-please-32-chars'),
        expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d'),
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/graphql',
      introspection: true,
      graphiql: true,
      context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
      validationRules: [
        createComplexityRule({
          maximumComplexity: 100,
          variables: {},
          estimators: [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })],
        }),
      ],
    }),
    MoviesModule,
    GenresModule,
    UsersModule,
    DatabaseModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_INTERCEPTOR, useClass: ElapsedTimeInterceptor }],
})
export class AppModule {}
