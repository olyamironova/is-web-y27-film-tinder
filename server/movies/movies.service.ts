import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { DataSource, In, Repository } from 'typeorm';
import { Genre } from '../genres/genre.entity.js';
import { Swipe, SwipeDirection } from '../users/entities/swipe.entity.js';
import { CreateMovieDto } from './dto/create-movie.dto.js';
import { UpdateMovieDto } from './dto/update-movie.dto.js';
import { Credit, CreditRole } from './entities/credit.entity.js';
import { Movie } from './entities/movie.entity.js';
import { MovieEventsService } from './movie-events.service.js';

export interface MovieView {
  id: string;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  year: number;
  genres: string[];
  director: string;
  cast: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MoviePage {
  data: MovieView[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie) private readonly movies: Repository<Movie>,
    @InjectRepository(Genre) private readonly genres: Repository<Genre>,
    @InjectRepository(Swipe) private readonly swipes: Repository<Swipe>,
    private readonly dataSource: DataSource,
    private readonly events: MovieEventsService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async findPage(page = 1, limit = 20): Promise<MoviePage> {
    const cacheKey = `movies:${page}:${limit}`;
    const cached = await this.cache.get<MoviePage>(cacheKey);
    if (cached) return cached;

    const [movies, total] = await this.movies.findAndCount({
      relations: { genres: true, credits: true },
      order: { rating: 'DESC', title: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const result = {
      data: movies.map((movie) => this.toView(movie)),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
    await this.cache.set(cacheKey, result, 5_000);
    return result;
  }

  async findOneEntity(id: string): Promise<Movie> {
    const movie = await this.movies.findOne({ where: { id }, relations: { genres: true, credits: true } });
    if (!movie) throw new NotFoundException('Фильм не найден');
    return movie;
  }

  async findOne(id: string): Promise<MovieView> {
    return this.toView(await this.findOneEntity(id));
  }

  async create(input: CreateMovieDto): Promise<MovieView> {
    const movie = await this.dataSource.transaction(async (manager) => {
      const genres = await this.resolveGenres(input.genres, manager.getRepository(Genre));
      const entity = manager.create(Movie, {
        ...input,
        genres,
        credits: [
          manager.create(Credit, { name: input.director.trim(), role: CreditRole.DIRECTOR }),
          ...input.cast.map((name) => manager.create(Credit, { name: name.trim(), role: CreditRole.ACTOR })),
        ],
      });
      return manager.save(entity);
    });
    await this.invalidateCache();
    this.events.emit('created', movie.id, movie.title);
    return this.findOne(movie.id);
  }

  async update(id: string, input: UpdateMovieDto): Promise<MovieView> {
    const existing = await this.findOneEntity(id);
    await this.dataSource.transaction(async (manager) => {
      if (input.genres) existing.genres = await this.resolveGenres(input.genres, manager.getRepository(Genre));
      const scalarUpdates: Partial<Movie> = {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.posterUrl !== undefined ? { posterUrl: input.posterUrl } : {}),
        ...(input.backdropUrl !== undefined ? { backdropUrl: input.backdropUrl } : {}),
        ...(input.rating !== undefined ? { rating: input.rating } : {}),
        ...(input.year !== undefined ? { year: input.year } : {}),
      };
      Object.assign(existing, scalarUpdates);
      if (input.director !== undefined || input.cast !== undefined) {
        await manager.delete(Credit, { movieId: id });
        const director = input.director ?? existing.credits.find((credit) => credit.role === CreditRole.DIRECTOR)?.name;
        const cast = input.cast ?? existing.credits.filter((credit) => credit.role === CreditRole.ACTOR).map((credit) => credit.name);
        existing.credits = [
          ...(director ? [manager.create(Credit, { name: director.trim(), role: CreditRole.DIRECTOR })] : []),
          ...cast.map((name) => manager.create(Credit, { name: name.trim(), role: CreditRole.ACTOR })),
        ];
      }
      await manager.save(existing);
    });
    await this.invalidateCache();
    this.events.emit('updated', id, existing.title);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const movie = await this.findOneEntity(id);
    await this.movies.remove(movie);
    await this.invalidateCache();
    this.events.emit('deleted', id, movie.title);
  }

  async swipe(userId: string, movieId: string, direction: SwipeDirection): Promise<{ movieId: string; direction: SwipeDirection }> {
    await this.findOneEntity(movieId);
    let swipe = await this.swipes.findOne({ where: { userId, movieId } });
    swipe = swipe
      ? this.swipes.merge(swipe, { direction })
      : this.swipes.create({ userId, movieId, direction });
    await this.swipes.save(swipe);
    return { movieId, direction };
  }

  async recommendations(userId?: string, limit = 20): Promise<MovieView[]> {
    let excludedIds: string[] = [];
    if (userId) {
      excludedIds = (await this.swipes.find({ where: { userId }, select: { movieId: true } })).map((swipe) => swipe.movieId);
    }
    const query = this.movies.createQueryBuilder('movie')
      .leftJoinAndSelect('movie.genres', 'genre')
      .leftJoinAndSelect('movie.credits', 'credit')
      .orderBy('movie.rating', 'DESC')
      .take(limit);
    if (excludedIds.length) query.andWhere('movie.id NOT IN (:...excludedIds)', { excludedIds });
    return (await query.getMany()).map((movie) => this.toView(movie));
  }

  async random(): Promise<MovieView> {
    const movie = await this.movies.createQueryBuilder('movie')
      .leftJoinAndSelect('movie.genres', 'genre')
      .leftJoinAndSelect('movie.credits', 'credit')
      .orderBy('RANDOM()')
      .getOne();
    if (!movie) throw new NotFoundException('В каталоге пока нет фильмов');
    return this.toView(movie);
  }

  async likedByUser(userId: string): Promise<MovieView[]> {
    return this.swipedByUser(userId, SwipeDirection.LIKE);
  }

  async dislikedByUser(userId: string): Promise<MovieView[]> {
    return this.swipedByUser(userId, SwipeDirection.DISLIKE);
  }

  async watchLaterByUser(userId: string): Promise<MovieView[]> {
    return this.swipedByUser(userId, SwipeDirection.WATCH_LATER);
  }

  private async swipedByUser(userId: string, direction: SwipeDirection): Promise<MovieView[]> {
    const swipes = await this.swipes.find({
      where: { userId, direction },
      relations: { movie: { genres: true, credits: true } },
      order: { createdAt: 'DESC' },
    });
    return swipes.map((swipe) => this.toView(swipe.movie));
  }

  // Отмена свайпа: фильм снова попадёт в ленту рекомендаций
  async removeSwipe(userId: string, movieId: string): Promise<void> {
    await this.swipes.delete({ userId, movieId });
  }

  private async resolveGenres(names: string[], repository: Repository<Genre>): Promise<Genre[]> {
    const normalized = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
    if (!normalized.length) throw new BadRequestException('Нужно указать хотя бы один жанр');
    const existing = await repository.find({ where: { name: In(normalized) } });
    const found = new Set(existing.map((genre) => genre.name));
    return [...existing, ...normalized.filter((name) => !found.has(name)).map((name) => repository.create({ name }))];
  }

  private toView(movie: Movie): MovieView {
    return {
      id: movie.id,
      title: movie.title,
      description: movie.description,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
      rating: Number(movie.rating),
      year: movie.year,
      genres: (movie.genres ?? []).map((genre) => genre.name),
      director: movie.credits?.find((credit) => credit.role === CreditRole.DIRECTOR)?.name ?? 'Не указан',
      cast: (movie.credits ?? []).filter((credit) => credit.role === CreditRole.ACTOR).map((credit) => credit.name),
      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt,
    };
  }

  private async invalidateCache(): Promise<void> {
    await this.cache.clear();
  }
}
