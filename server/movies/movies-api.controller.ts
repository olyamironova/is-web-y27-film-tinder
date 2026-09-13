import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  Sse,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { PaginationQueryDto } from '../common/dto.js';
import { EtagInterceptor } from '../common/interceptors/etag.interceptor.js';
import { AuthenticatedUser } from '../common/types/authenticated-request.js';
import { UserRole } from '../users/entities/user.entity.js';
import { CreateMovieDto } from './dto/create-movie.dto.js';
import { SwipeDto } from './dto/swipe.dto.js';
import { UpdateMovieDto } from './dto/update-movie.dto.js';
import { MovieEventsService } from './movie-events.service.js';
import { MoviesService } from './movies.service.js';

@ApiTags('movies')
@Controller('api/movies')
export class MoviesApiController {
  constructor(private readonly movies: MoviesService, private readonly events: MovieEventsService) {}

  @Public()
  @Get()
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  @UseInterceptors(EtagInterceptor)
  @ApiOperation({ summary: 'Get a paginated movie catalog' })
  @ApiOkResponse({ description: 'Movie page with pagination metadata' })
  async findAll(@Query() query: PaginationQueryDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.movies.findPage(query.page, query.limit);
    const baseUrl = `${request.protocol}://${request.get('host')}${request.path}`;
    const links: string[] = [];
    if (query.page > 1) links.push(`<${baseUrl}?page=${query.page - 1}&limit=${query.limit}>; rel="prev"`);
    if (query.page < result.meta.totalPages) links.push(`<${baseUrl}?page=${query.page + 1}&limit=${query.limit}>; rel="next"`);
    if (links.length) response.setHeader('Link', links.join(', '));
    return result;
  }

  @Public()
  @Sse('events')
  @ApiOperation({ summary: 'Subscribe to live movie catalog changes' })
  stream(): Observable<MessageEvent> {
    return this.events.stream();
  }

  @Public()
  @Get('random')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ description: 'A random movie' })
  random() {
    return this.movies.random();
  }

  @Public()
  @Get('recommendations')
  @ApiOkResponse({ description: 'Rating-ranked unseen movies for a guest' })
  recommendations(@Query('limit') limit?: string) {
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    return this.movies.recommendations(undefined, safeLimit);
  }

  @Get('deck')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Swipe deck for the current user with already-swiped movies hidden' })
  deck(@CurrentUser() user: AuthenticatedUser) {
    return this.movies.recommendations(user.id, 100);
  }

  @Public()
  @Get(':id')
  @Header('Cache-Control', 'public, max-age=60')
  @UseInterceptors(EtagInterceptor)
  @ApiOkResponse({ description: 'Movie details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.movies.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Movie created' })
  create(@Body() input: CreateMovieDto) {
    return this.movies.create(input);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Movie updated' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateMovieDto) {
    return this.movies.update(id, input);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Movie deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.movies.remove(id);
  }

  @Post(':id/swipes')
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Swipe recorded or replaced' })
  swipe(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: SwipeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.movies.swipe(user.id, id, input.direction);
  }

  @Delete(':id/swipes')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Swipe removed, movie returns to the deck' })
  async removeSwipe(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.movies.removeSwipe(user.id, id);
  }
}
