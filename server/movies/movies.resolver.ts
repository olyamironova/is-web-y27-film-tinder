import { Args, ID, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { AuthenticatedUser } from '../common/types/authenticated-request.js';
import { Genre } from '../genres/genre.entity.js';
import { SwipeDirection } from '../users/entities/swipe.entity.js';
import { UserRole } from '../users/entities/user.entity.js';
import { CreateMovieDto } from './dto/create-movie.dto.js';
import { UpdateMovieDto } from './dto/update-movie.dto.js';
import { Credit } from './entities/credit.entity.js';
import { Movie } from './entities/movie.entity.js';
import { MovieConnection, SwipeResult } from './movies.graphql.js';
import { MoviesService } from './movies.service.js';

@Resolver(() => Movie)
export class MoviesResolver {
  constructor(private readonly moviesService: MoviesService) {}

  @Public()
  @Query(() => MovieConnection, { description: 'Paginated movie catalog' })
  async movies(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<MovieConnection> {
    const result = await this.moviesService.findPage(Math.max(1, page), Math.min(100, Math.max(1, limit)));
    return { data: await Promise.all(result.data.map((movie) => this.moviesService.findOneEntity(movie.id))), meta: result.meta };
  }

  @Public()
  @Query(() => Movie, { description: 'Movie by ID' })
  movie(@Args('id', { type: () => ID }) id: string): Promise<Movie> {
    return this.moviesService.findOneEntity(id);
  }

  @Query(() => [Movie], { description: 'Unseen recommendations for current user' })
  async recommendations(
    @CurrentUser() user: AuthenticatedUser,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
  ): Promise<Movie[]> {
    const views = await this.moviesService.recommendations(user.id, Math.min(100, Math.max(1, limit)));
    return Promise.all(views.map((movie) => this.moviesService.findOneEntity(movie.id)));
  }

  @Mutation(() => Movie, { description: 'Create a catalog movie (admin only)' })
  @Roles(UserRole.ADMIN)
  async createMovie(@Args('input') input: CreateMovieDto): Promise<Movie> {
    const movie = await this.moviesService.create(input);
    return this.moviesService.findOneEntity(movie.id);
  }

  @Mutation(() => Movie, { description: 'Update a catalog movie (admin only)' })
  @Roles(UserRole.ADMIN)
  async updateMovie(@Args('id', { type: () => ID }) id: string, @Args('input') input: UpdateMovieDto): Promise<Movie> {
    const movie = await this.moviesService.update(id, input);
    return this.moviesService.findOneEntity(movie.id);
  }

  @Mutation(() => Boolean, { description: 'Delete a catalog movie (admin only)' })
  @Roles(UserRole.ADMIN)
  async deleteMovie(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.moviesService.remove(id);
    return true;
  }

  @Mutation(() => SwipeResult, { description: 'Like or dislike a movie' })
  swipeMovie(
    @CurrentUser() user: AuthenticatedUser,
    @Args('movieId', { type: () => ID }) movieId: string,
    @Args('direction', { type: () => SwipeDirection }) direction: SwipeDirection,
  ) {
    return this.moviesService.swipe(user.id, movieId, direction);
  }

  @ResolveField(() => [Genre], { description: 'Genres linked to this movie' })
  genres(@Parent() movie: Movie): Genre[] {
    return movie.genres ?? [];
  }

  @ResolveField(() => [Credit], { description: 'Cast and directors linked to this movie' })
  credits(@Parent() movie: Movie): Credit[] {
    return movie.credits ?? [];
  }
}
