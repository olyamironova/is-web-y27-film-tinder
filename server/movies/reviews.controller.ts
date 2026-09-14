import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiOkResponse({ description: 'Reviews with average user rating' })
  list(@Param('movieId', ParseUUIDPipe) movieId: string) {
    return this.reviews.list(movieId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Create or update the current user review, returns the updated list' })
  upsert(
    @Param('movieId', ParseUUIDPipe) movieId: string,
    @Body() input: CreateReviewDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reviews.upsert(user.id, movieId, input);
  }

  @Delete()
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Remove the current user review, returns the updated list' })
  remove(@Param('movieId', ParseUUIDPipe) movieId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.reviews.remove(user.id, movieId);
  }
}
