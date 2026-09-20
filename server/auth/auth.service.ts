import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import supertokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import type { SessionContainer } from 'supertokens-node/recipe/session';
import UserMetadata from 'supertokens-node/recipe/usermetadata';
import UserRoles from 'supertokens-node/recipe/userroles';
import { AuthenticatedUser } from '../common/types/authenticated-request.js';
import { User, UserRole } from '../users/entities/user.entity.js';
import { AUTH_OPTIONS, type AuthModuleOptions } from './auth.types.js';

const DEFAULT_TENANT = 'public';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @Inject(AUTH_OPTIONS) private readonly options: AuthModuleOptions,
  ) {}

  async getOrCreateLocalUser(userId: string): Promise<AuthenticatedUser> {
    const existing = await this.users.findOne({ where: { id: userId } });
    if (existing) {
      return { id: existing.id, email: existing.email, name: existing.name, role: existing.role };
    }

    const stUser = await supertokens.getUser(userId);
    if (!stUser) throw new UnauthorizedException('Пользователь SuperTokens не найден');
    const email = stUser.emails[0] ?? '';
    const metadata = await UserMetadata.getUserMetadata(userId);
    const name = typeof metadata.metadata.name === 'string' && metadata.metadata.name.trim()
      ? (metadata.metadata.name as string).trim()
      : email.split('@')[0];
    const { roles } = await UserRoles.getRolesForUser(DEFAULT_TENANT, userId);
    const role = roles.includes(this.options.adminRole) ? UserRole.ADMIN : UserRole.USER;

    const created = await this.users.save(this.users.create({ id: userId, email, name, role }));
    return { id: created.id, email: created.email, name: created.name, role: created.role };
  }

  async resolveSession(request: Request, response: Response): Promise<SessionContainer | undefined> {
    try {
      return await Session.getSession(request, response, { sessionRequired: false });
    } catch (error) {
      if ((error as { type?: string })?.type !== 'TRY_REFRESH_TOKEN') {
        this.clearStaleSessionCookies(response);
      }
      return undefined;
    }
  }

  async sessionUser(request: Request, response: Response): Promise<(AuthenticatedUser & { avatarUrl: string }) | null> {
    const session = await this.resolveSession(request, response);
    if (!session) return null;
    const authenticated = await this.getOrCreateLocalUser(session.getUserId());
    const user = await this.users.findOne({ where: { id: authenticated.id }, select: { avatarUrl: true } });
    return { ...authenticated, avatarUrl: user?.avatarUrl ?? '' };
  }

  private clearStaleSessionCookies(response: Response): void {
    response.clearCookie('sAccessToken', { path: '/' });
    response.clearCookie('st-last-access-token-update', { path: '/' });
    response.clearCookie('sRefreshToken', { path: '/auth/session/refresh' });
  }

  async changePassword(userId: string, email: string, oldPassword: string, newPassword: string): Promise<void> {
    const check = await EmailPassword.verifyCredentials(DEFAULT_TENANT, email, oldPassword);
    if (check.status !== 'OK') {
      throw new UnauthorizedException('Старый пароль указан неверно');
    }
    const result = await EmailPassword.updateEmailOrPassword({
      recipeUserId: supertokens.convertToRecipeUserId(userId),
      password: newPassword,
    });
    if (result.status === 'PASSWORD_POLICY_VIOLATED_ERROR') {
      throw new UnauthorizedException(result.failureReason);
    }
    if (result.status !== 'OK') {
      throw new UnauthorizedException('Не удалось обновить пароль');
    }
  }

  async updateEmail(userId: string, email: string): Promise<'OK' | 'EMAIL_ALREADY_EXISTS' | 'NOT_ALLOWED'> {
    const result = await EmailPassword.updateEmailOrPassword({
      recipeUserId: supertokens.convertToRecipeUserId(userId),
      email,
    });
    if (result.status === 'OK') return 'OK';
    if (result.status === 'EMAIL_ALREADY_EXISTS_ERROR') return 'EMAIL_ALREADY_EXISTS';
    return 'NOT_ALLOWED';
  }
}
