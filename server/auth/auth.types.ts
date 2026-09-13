import type { FactoryProvider, ModuleMetadata } from '@nestjs/common';

export const AUTH_OPTIONS = Symbol('AUTH_OPTIONS');

export interface AuthModuleOptions {
  secret: string;
  expiresIn: string;
}

export interface AuthModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: FactoryProvider<AuthModuleOptions>['inject'];
  useFactory: FactoryProvider<AuthModuleOptions>['useFactory'];
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
}
