import 'reflect-metadata';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const records: User[] = [];
  const repository = {
    exists: jest.fn(async ({ where: { email } }: { where: { email: string } }) => records.some((user) => user.email === email)),
    create: jest.fn((input: Partial<User>) => Object.assign(new User(), input)),
    save: jest.fn(async (user: User) => {
      if (!user.id) user.id = `00000000-0000-4000-8000-${String(records.length + 1).padStart(12, '0')}`;
      user.createdAt ??= new Date();
      user.updatedAt ??= new Date();
      if (!records.includes(user)) records.push(user);
      return user;
    }),
    findOne: jest.fn(async ({ where: { email } }: { where: { email: string } }) => records.find((user) => user.email === email) ?? null),
  } as unknown as Repository<User>;
  const service = new AuthService(repository, new JwtService(), {
    secret: 'test-secret-with-more-than-thirty-two-characters',
    expiresIn: '1h',
  });

  beforeEach(() => {
    records.length = 0;
    jest.clearAllMocks();
  });

  it('registers, normalizes email and issues a verifiable token', async () => {
    const result = await service.register({ email: ' User@Example.COM ', name: 'User', password: 'StrongPass123!' });
    expect(result.user.email).toBe('user@example.com');
    expect(result.user.role).toBe(UserRole.USER);
    expect(await service.authenticateRequest({ headers: { authorization: `Bearer ${result.token}` } } as never)).toEqual(result.user);
  });

  it('rejects duplicate registration and a wrong password', async () => {
    await service.register({ email: 'user@example.com', name: 'User', password: 'StrongPass123!' });
    await expect(service.register({ email: 'USER@example.com', name: 'Other', password: 'StrongPass123!' })).rejects.toBeInstanceOf(ConflictException);
    await expect(service.login({ email: 'user@example.com', password: 'wrong' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
