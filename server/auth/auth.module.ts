import { DynamicModule, Module, Provider } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { AUTH_OPTIONS, AuthModuleAsyncOptions } from './auth.types.js';
import { RolesGuard } from './roles.guard.js';

@Module({})
export class AuthModule {
  static forRootAsync(options: AuthModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: AUTH_OPTIONS,
      inject: options.inject ?? [],
      useFactory: options.useFactory,
    };
    return {
      module: AuthModule,
      imports: [TypeOrmModule.forFeature([User]), JwtModule.register({}), ...(options.imports ?? [])],
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
}
