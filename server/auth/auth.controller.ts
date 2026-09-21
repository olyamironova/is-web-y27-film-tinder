import { Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import Session from 'supertokens-node/recipe/session';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { AuthenticatedUser } from '../common/types/authenticated-request.js';
import { AuthService } from './auth.service.js';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('me')
  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Get the current authenticated session user' })
  @ApiOkResponse({ description: 'Current session user' })
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  @Public()
  @Get('session')
  @ApiOperation({ summary: 'Resolve the current session user, or null for a guest' })
  @ApiOkResponse({ description: 'Current session user or null for a guest' })
  async session(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return { user: await this.auth.sessionUser(request, response) };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('session')
  @ApiOperation({ summary: 'Log out and revoke the current session' })
  @ApiOkResponse({ description: 'Session revoked' })
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const session = await Session.getSession(request, response, { sessionRequired: false });
    if (session) await session.revokeSession();
    return { status: 'OK' };
  }
}
