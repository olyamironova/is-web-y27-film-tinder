import { Body, Controller, Get, MessageEvent, Param, Post, Sse } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AuthenticatedUser } from '../common/types/authenticated-request.js';
import { RoomSwipeDto } from './dto/room-swipe.dto.js';
import { RoomsService } from './rooms.service.js';

@ApiTags('rooms')
@ApiCookieAuth('session')
@Controller('api/rooms')
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Post()
  @ApiOkResponse({ description: 'Create a movie-night room, returns its code' })
  create(@CurrentUser() user: AuthenticatedUser) {
    return this.rooms.create(user);
  }

  @Post(':code/join')
  @ApiOkResponse({ description: 'Join a room as the second participant' })
  join(@Param('code') code: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rooms.join(code, user);
  }

  @Get(':code')
  @ApiOkResponse({ description: 'Room state: participants and current matches' })
  get(@Param('code') code: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rooms.summary(code, user.id);
  }

  @Post(':code/swipe')
  @ApiOkResponse({ description: 'Record a swipe; a mutual like becomes a match' })
  swipe(@Param('code') code: string, @Body() input: RoomSwipeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.rooms.swipe(code, user.id, input.movieId, input.direction);
  }

  @Sse(':code/events')
  events(@Param('code') code: string, @CurrentUser() user: AuthenticatedUser): Observable<MessageEvent> {
    return this.rooms.streamFor(code, user.id);
  }
}
