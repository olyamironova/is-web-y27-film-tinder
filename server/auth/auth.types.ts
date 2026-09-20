import type { FactoryProvider, ModuleMetadata } from '@nestjs/common';

export const AUTH_OPTIONS = Symbol('AUTH_OPTIONS');

export interface AuthModuleOptions {
  appName: string;
  apiDomain: string;
  websiteDomain: string;
  connectionUri: string;
  apiKey?: string;
  apiBasePath: string;
  adminRole: string;
  userRole: string;
}

export interface AuthModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: FactoryProvider<AuthModuleOptions>['inject'];
  useFactory: FactoryProvider<AuthModuleOptions>['useFactory'];
}

export const NAME_FORM_FIELD = 'name';
