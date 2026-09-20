import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import supertokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import UserMetadata from 'supertokens-node/recipe/usermetadata';
import UserRoles from 'supertokens-node/recipe/userroles';
import { AUTH_OPTIONS, type AuthModuleOptions } from '../auth/auth.types.js';
import { ensureRolesExist } from '../auth/supertokens.js';
import { MoviesService } from '../movies/movies.service.js';
import { Friendship, FriendshipStatus } from '../users/entities/friendship.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';
import { SEED_MOVIE_MEDIA } from './seed-movie-media.js';

const DEFAULT_TENANT = 'public';

const SEED_MOVIES = [
  ['Интерстеллар', 2014, 8.6, ['Фантастика', 'Драма', 'Приключения'], 'Кристофер Нолан', ['Мэттью Макконахи', 'Энн Хэтэуэй']],
  ['Побег из Шоушенка', 1994, 9.1, ['Драма'], 'Фрэнк Дарабонт', ['Тим Роббинс', 'Морган Фриман']],
  ['Крёстный отец', 1972, 8.7, ['Криминал', 'Драма'], 'Фрэнсис Форд Коппола', ['Марлон Брандо', 'Аль Пачино']],
  ['Тёмный рыцарь', 2008, 8.5, ['Боевик', 'Криминал', 'Драма'], 'Кристофер Нолан', ['Кристиан Бэйл', 'Хит Леджер']],
  ['Криминальное чтиво', 1994, 8.9, ['Криминал', 'Драма'], 'Квентин Тарантино', ['Джон Траволта', 'Ума Турман']],
  ['Форрест Гамп', 1994, 8.8, ['Драма', 'Мелодрама'], 'Роберт Земекис', ['Том Хэнкс', 'Робин Райт']],
  ['Начало', 2010, 8.8, ['Фантастика', 'Боевик', 'Триллер'], 'Кристофер Нолан', ['Леонардо ДиКаприо', 'Том Харди']],
  ['Матрица', 1999, 8.7, ['Фантастика', 'Боевик'], 'Лана и Лилли Вачовски', ['Киану Ривз', 'Кэрри-Энн Мосс']],
] as const;

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Friendship) private readonly friendships: Repository<Friendship>,
    private readonly movies: MoviesService,
    private readonly config: ConfigService,
    @Inject(AUTH_OPTIONS) private readonly authOptions: AuthModuleOptions,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedUsers();
    const catalog = await this.movies.findPage(1, 100);
    if (catalog.meta.total === 0) {
      for (const [index, [title, year, rating, genres, director, cast]] of SEED_MOVIES.entries()) {
        const media = SEED_MOVIE_MEDIA[index];
        await this.movies.create({
          title,
          year,
          rating,
          genres: [...genres],
          director,
          cast: [...cast],
          description: `${title} — фильм из стартового каталога Film Tinder. Оцените его свайпом и получите персональные рекомендации.`,
          posterUrl: media.posterUrl,
          backdropUrl: media.backdropUrl,
        });
      }
      this.logger.log(`Создан стартовый каталог: ${SEED_MOVIES.length} фильмов`);
    } else {
      await this.replacePlaceholderMedia(catalog.data);
    }
  }

  private async replacePlaceholderMedia(catalog: Awaited<ReturnType<MoviesService['findPage']>>['data']): Promise<void> {
    let updated = 0;
    for (const [index, [title]] of SEED_MOVIES.entries()) {
      const movie = catalog.find((item) => item.title === title);
      if (!movie) continue;

      const posterUrl = movie.posterUrl.includes('placehold.co') ? SEED_MOVIE_MEDIA[index].posterUrl : undefined;
      const backdropUrl = movie.backdropUrl.includes('placehold.co') ? SEED_MOVIE_MEDIA[index].backdropUrl : undefined;
      if (posterUrl || backdropUrl) {
        await this.movies.update(movie.id, { posterUrl, backdropUrl });
        updated += 1;
      }
    }
    if (updated) this.logger.log(`Обновлены постеры стартового каталога: ${updated}`);
  }

  private async seedUsers(): Promise<void> {
    await ensureRolesExist(this.authOptions);

    const adminEmail = this.config.get<string>('ADMIN_EMAIL', 'admin@film-tinder.local').toLowerCase();
    const adminPassword = this.config.get<string>('ADMIN_PASSWORD', 'ChangeMe123!');
    const adminId = await this.ensureSupertokensUser(adminEmail, adminPassword, 'Администратор', this.authOptions.adminRole);
    const admin = await this.upsertLocalUser(adminId, adminEmail, 'Администратор', UserRole.ADMIN);

    const demoEmail = 'user@film-tinder.local';
    const demoId = await this.ensureSupertokensUser(demoEmail, 'User12345!', 'Киноман', this.authOptions.userRole);
    const demo = await this.upsertLocalUser(demoId, demoEmail, 'Киноман', UserRole.USER);

    const friendshipExists = await this.friendships.exists({ where: { requesterId: admin.id, addresseeId: demo.id } });
    if (!friendshipExists) {
      await this.friendships.save(this.friendships.create({
        requesterId: admin.id,
        addresseeId: demo.id,
        status: FriendshipStatus.ACCEPTED,
      }));
    }
  }

  private async ensureSupertokensUser(email: string, password: string, name: string, role: string): Promise<string> {
    let userId: string | undefined;
    const existing = await supertokens.listUsersByAccountInfo(DEFAULT_TENANT, { email });
    if (existing.length > 0) {
      userId = existing[0].id;
    } else {
      const created = await EmailPassword.signUp(DEFAULT_TENANT, email, password);
      if (created.status === 'OK') {
        userId = created.user.id;
        if (role === this.authOptions.adminRole) {
          this.logger.warn('Создан администратор из ADMIN_EMAIL/ADMIN_PASSWORD; смените пароль после первого запуска');
        }
      } else {
        const raced = await supertokens.listUsersByAccountInfo(DEFAULT_TENANT, { email });
        userId = raced[0]?.id;
      }
    }
    if (!userId) throw new Error(`Не удалось создать пользователя SuperTokens: ${email}`);

    await UserMetadata.updateUserMetadata(userId, { name });
    await UserRoles.addRoleToUser(DEFAULT_TENANT, userId, role);
    return userId;
  }

  private async upsertLocalUser(id: string, email: string, name: string, role: UserRole): Promise<User> {
    const byId = await this.users.findOne({ where: { id } });
    if (byId) {
      byId.email = email;
      byId.name = name;
      byId.role = role;
      return this.users.save(byId);
    }

    const byEmail = await this.users.findOne({ where: { email } });
    if (byEmail && byEmail.id !== id) {
      await this.users.delete({ id: byEmail.id });
      this.logger.warn(`Удалена несовместимая учётная запись ${email} со старым идентификатором ${byEmail.id}`);
    }

    return this.users.save(this.users.create({ id, email, name, role }));
  }
}
