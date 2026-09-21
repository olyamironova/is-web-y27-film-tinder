import { Body, Controller, Get, MessageEvent, Param, Post, Sse } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a movie-night room' })
  @ApiOkResponse({ description: 'Create a movie-night room, returns its code' })
  create(@CurrentUser() user: AuthenticatedUser) {
    return this.rooms.create(user);
  }

  @Post(':code/join')
  @ApiOperation({ summary: 'Join a room by its code' })
  @ApiOkResponse({ description: 'Join a room as the second participant' })
  join(@Param('code') code: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rooms.join(code, user);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get room state with participants and matches' })
  @ApiOkResponse({ description: 'Room state: participants and current matches' })
  get(@Param('code') code: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rooms.summary(code, user.id);
  }

  @Post(':code/swipe')
  @ApiOperation({ summary: 'Swipe in a room; a mutual like becomes a match' })
  @ApiOkResponse({ description: 'Record a swipe; a mutual like becomes a match' })
  swipe(@Param('code') code: string, @Body() input: RoomSwipeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.rooms.swipe(code, user.id, input.movieId, input.direction);
  }

  @Sse(':code/events')
  @ApiOperation({ summary: 'Subscribe to live room updates (participants and matches)' })
  events(@Param('code') code: string, @CurrentUser() user: AuthenticatedUser): Observable<MessageEvent> {
    return this.rooms.streamFor(code, user.id);
  }
}
