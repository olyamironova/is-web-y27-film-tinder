import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Genre } from '../genres/genre.entity.js';
import { Swipe } from '../users/entities/swipe.entity.js';
import { Credit } from './entities/credit.entity.js';
import { Movie } from './entities/movie.entity.js';
import { MovieEventsService } from './movie-events.service.js';
import { MoviesApiController } from './movies-api.controller.js';
import { MoviesResolver } from './movies.resolver.js';
import { MoviesService } from './movies.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, Genre, Credit, Swipe])],
  controllers: [MoviesApiController],
  providers: [MoviesService, MovieEventsService, MoviesResolver],
  exports: [MoviesService, MovieEventsService],
})
export class MoviesModule {}
