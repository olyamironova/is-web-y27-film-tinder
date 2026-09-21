import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { AuthenticatedUser } from '../common/types/authenticated-request.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ReviewsService } from './reviews.service.js';

@ApiTags('reviews')
@Controller('api/movies/:movieId/reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List reviews for a movie with the average user rating' })
  @ApiOkResponse({ description: 'Reviews with average user rating' })
  list(@Param('movieId', ParseUUIDPipe) movieId: string) {
    return this.reviews.list(movieId);
  }

  @Post()
  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Create or update the current user review for a movie' })
  @ApiOkResponse({ description: 'Create or update the current user review, returns the updated list' })
  upsert(
    @Param('movieId', ParseUUIDPipe) movieId: string,
    @Body() input: CreateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reviews.upsert(user.id, movieId, input);
  }

  @Delete()
  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Remove the current user review for a movie' })
  @ApiOkResponse({ description: 'Remove the current user review, returns the updated list' })
  remove(@Param('movieId', ParseUUIDPipe) movieId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.reviews.remove(user.id, movieId);
  }
}
