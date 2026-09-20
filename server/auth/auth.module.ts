import { DynamicModule, MiddlewareConsumer, Module, NestModule, Provider } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { AUTH_OPTIONS, AuthModuleAsyncOptions, AuthModuleOptions } from './auth.types.js';
import { RolesGuard } from './roles.guard.js';
import { SupertokensMiddleware } from './supertokens.middleware.js';
import { initSupertokens } from './supertokens.js';

@Module({})
export class AuthModule implements NestModule {
  static forRootAsync(options: AuthModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: AUTH_OPTIONS,
      inject: options.inject ?? [],
      useFactory: async (...args: unknown[]) => {
        const resolved = (await options.useFactory(...args)) as AuthModuleOptions;
        initSupertokens(resolved);
        return resolved;
      },
    };
    return {
      module: AuthModule,
      imports: [TypeOrmModule.forFeature([User]), ...(options.imports ?? [])],
      controllers: [AuthController],
      providers: [
        optionsProvider,
        AuthService,
        { provide: APP_GUARD, useClass: AuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
      exports: [AuthService, AUTH_OPTIONS],
      global: true,
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SupertokensMiddleware).forRoutes('*');
  }
}
