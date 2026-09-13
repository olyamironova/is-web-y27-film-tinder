import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { MoviesService } from '../movies/movies.service.js';
import { Friendship, FriendshipStatus } from '../users/entities/friendship.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';
import { SEED_MOVIE_MEDIA } from './seed-movie-media.js';

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
    const adminEmail = this.config.get<string>('ADMIN_EMAIL', 'admin@film-tinder.local').toLowerCase();
    const adminPassword = this.config.get<string>('ADMIN_PASSWORD', 'ChangeMe123!');
    let admin = await this.users.findOne({ where: { email: adminEmail } });
    if (!admin) {
      admin = await this.users.save(this.users.create({
        email: adminEmail,
        name: 'Администратор',
        passwordHash: await hash(adminPassword, 12),
        role: UserRole.ADMIN,
      }));
      this.logger.warn('Создан администратор из ADMIN_EMAIL/ADMIN_PASSWORD; смените пароль после первого запуска');
    }

    const demoEmail = 'user@film-tinder.local';
    let demo = await this.users.findOne({ where: { email: demoEmail } });
    if (!demo) {
      demo = await this.users.save(this.users.create({
        email: demoEmail,
        name: 'Киноман',
        passwordHash: await hash('User12345!', 12),
        role: UserRole.USER,
      }));
    }
    const friendshipExists = await this.friendships.exists({ where: { requesterId: admin.id, addresseeId: demo.id } });
    if (!friendshipExists) {
      await this.friendships.save(this.friendships.create({
        requesterId: admin.id,
        addresseeId: demo.id,
        status: FriendshipStatus.ACCEPTED,
      }));
    }
  }
}
