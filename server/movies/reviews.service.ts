import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { Review } from './entities/review.entity.js';
import { MoviesService } from './movies.service.js';

export interface ReviewView {
  id: string;
  rating: number;
  text: string;
  createdAt: Date;
  author: { id: string; name: string; avatarUrl: string };
}

export interface ReviewList {
  average: number | null;
  count: number;
  reviews: ReviewView[];
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    private readonly movies: MoviesService,
  ) {}

  async list(movieId: string): Promise<ReviewList> {
    const reviews = await this.reviews.find({
      where: { movieId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
    const count = reviews.length;
    const average = count ? reviews.reduce((sum, review) => sum + review.rating, 0) / count : null;
    return {
      average: average !== null ? Number(average.toFixed(1)) : null,
      count,
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        text: review.text ?? '',
        createdAt: review.createdAt,
        author: { id: review.userId, name: review.user.name, avatarUrl: review.user.avatarUrl ?? '' },
      })),
    };
  }

  // Один отзыв на пользователя+фильм: повторный отзыв обновляет существующий
  async upsert(userId: string, movieId: string, input: CreateReviewDto): Promise<ReviewList> {
    await this.movies.findOneEntity(movieId); // 404, если фильма нет
    const existing = await this.reviews.findOne({ where: { userId, movieId } });
    const review = existing
      ? this.reviews.merge(existing, { rating: input.rating, text: input.text ?? null })
      : this.reviews.create({ userId, movieId, rating: input.rating, text: input.text ?? null });
    await this.reviews.save(review);
    return this.list(movieId);
  }

  async remove(userId: string, movieId: string): Promise<ReviewList> {
    await this.reviews.delete({ userId, movieId });
    return this.list(movieId);
  }
}
