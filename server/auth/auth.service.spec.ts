import 'reflect-metadata';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Repository } from 'typeorm';

const getUser = jest.fn<(userId: string) => Promise<unknown>>();
const getUserMetadata = jest.fn<(userId: string) => Promise<{ metadata: Record<string, unknown> }>>();
const getRolesForUser = jest.fn<(tenantId: string, userId: string) => Promise<{ roles: string[] }>>();

jest.unstable_mockModule('supertokens-node', () => ({
  default: { getUser, convertToRecipeUserId: (id: string) => ({ getAsString: () => id }) },
}));
jest.unstable_mockModule('supertokens-node/recipe/emailpassword', () => ({
  default: { verifyCredentials: jest.fn(), updateEmailOrPassword: jest.fn() },
}));
jest.unstable_mockModule('supertokens-node/recipe/session', () => ({
  default: { getSession: jest.fn() },
}));
jest.unstable_mockModule('supertokens-node/recipe/usermetadata', () => ({
  default: { getUserMetadata, updateUserMetadata: jest.fn() },
}));
jest.unstable_mockModule('supertokens-node/recipe/userroles', () => ({
  default: { getRolesForUser, addRoleToUser: jest.fn(), UserRoleClaim: {} },
}));

const { AuthService } = await import('./auth.service.js');
const { User, UserRole } = await import('../users/entities/user.entity.js');

describe('AuthService.getOrCreateLocalUser', () => {
  const records: InstanceType<typeof User>[] = [];
  const repository = {
    findOne: jest.fn(async ({ where: { id } }: { where: { id: string } }) => records.find((u) => u.id === id) ?? null),
    findOneOrFail: jest.fn(async ({ where: { id } }: { where: { id: string } }) => records.find((u) => u.id === id)!),
    create: jest.fn((input: Partial<InstanceType<typeof User>>) => Object.assign(new User(), input)),
    save: jest.fn(async (user: InstanceType<typeof User>) => {
      if (!records.includes(user)) records.push(user);
      return user;
    }),
  } as unknown as Repository<InstanceType<typeof User>>;

  const options = { adminRole: 'admin', userRole: 'user' } as never;
  const service = new AuthService(repository, options);

  beforeEach(() => {
    records.length = 0;
    jest.clearAllMocks();
  });

  it('returns the existing local user without querying SuperTokens', async () => {
    records.push(Object.assign(new User(), {
      id: 'u-1', email: 'user@example.com', name: 'Киноман', role: UserRole.USER,
    }));

    const result = await service.getOrCreateLocalUser('u-1');

    expect(result).toEqual({ id: 'u-1', email: 'user@example.com', name: 'Киноман', role: UserRole.USER });
    expect(getUser).not.toHaveBeenCalled();
  });

  it('materializes a new local user from SuperTokens data and maps the admin role', async () => {
    getUser.mockResolvedValue({ id: 'st-42', emails: ['admin@example.com'] });
    getUserMetadata.mockResolvedValue({ metadata: { name: 'Администратор' } });
    getRolesForUser.mockResolvedValue({ roles: ['admin'] });

    const result = await service.getOrCreateLocalUser('st-42');

    expect(result).toEqual({ id: 'st-42', email: 'admin@example.com', name: 'Администратор', role: UserRole.ADMIN });
    expect(records).toHaveLength(1);
  });
});
