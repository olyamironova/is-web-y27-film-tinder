import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Movie } from './entities/movie.entity.js';

@ObjectType({ description: 'Pagination metadata' })
export class PaginationMeta {
  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  totalPages: number;
}

@ObjectType({ description: 'Paginated movie result' })
export class MovieConnection {
  @Field(() => [Movie])
  data: Movie[];

  @Field(() => PaginationMeta)
  meta: PaginationMeta;
}

@ObjectType()
export class SwipeResult {
  @Field()
  movieId: string;

  @Field()
  direction: string;
}
