import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../common/types/authenticated-request.js';
import { User, UserRole } from '../users/entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AUTH_OPTIONS } from './auth.types.js';
import type { AuthModuleOptions, JwtPayload } from './auth.types.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(AUTH_OPTIONS) private readonly options: AuthModuleOptions,
  ) {}

  async register(input: RegisterDto): Promise<{ token: string; user: AuthenticatedUser }> {
    const email = input.email.trim().toLowerCase();
    if (await this.users.exists({ where: { email } })) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const user = this.users.create({
      email,
      name: input.name.trim(),
      passwordHash: await hash(input.password, 12),
      role: UserRole.USER,
    });
    await this.users.save(user);
    return this.issueToken(user);
  }

  async login(input: LoginDto): Promise<{ token: string; user: AuthenticatedUser }> {
    const user = await this.users.findOne({ where: { email: input.email.trim().toLowerCase() } });
    if (!user || !(await compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    return this.issueToken(user);
  }

  async authenticateRequest(request: Request): Promise<AuthenticatedUser | null> {
    const header = request.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const cookieToken = (request.cookies as Record<string, string> | undefined)?.film_tinder_token;
    const token = bearer ?? cookieToken;
    if (!token) return null;

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, { secret: this.options.secret });
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role as UserRole,
      };
    } catch {
      return null;
    }
  }

  private async issueToken(user: User): Promise<{ token: string; user: AuthenticatedUser }> {
    const publicUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, name: user.name, role: user.role } satisfies JwtPayload,
      { secret: this.options.secret, expiresIn: this.options.expiresIn as JwtSignOptions['expiresIn'] },
    );
    return { token, user: publicUser };
  }
}
