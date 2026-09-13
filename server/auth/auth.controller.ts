import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiConflictResponse, ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { AuthenticatedUser } from '../common/types/authenticated-request.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiCreatedResponse({ description: 'Account created and session started' })
  @ApiConflictResponse({ description: 'Email is already registered' })
  async register(@Body() input: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.register(input);
    this.setCookie(response, result.token);
    return result;
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOkResponse({ description: 'Session started' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() input: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(input);
    this.setCookie(response, result.token);
    return result;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('session')
  logout(@Req() request: Request, @Res({ passthrough: true }) response: Response): void {
    // Публичный и идемпотентный: повторный выход без cookie не должен давать 401
    response.clearCookie('film_tinder_token', { path: '/' });
    // Редиректим только настоящую навигацию по документу (форма MVC), но не fetch из SPA:
    // fetch с Accept: */* иначе тоже уходил бы в редирект и ломал клиентский выход
    const dest = request.headers['sec-fetch-dest'];
    const isDocumentNavigation = dest
      ? dest === 'document'
      : Boolean(request.accepts('html')) && !request.is('application/json');
    if (isDocumentNavigation) response.redirect('/login');
  }

  @Get('me')
  @ApiCookieAuth('session')
  @ApiOkResponse({ description: 'Current session user' })
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  @Public()
  @Get('session')
  async session(@Req() request: Request): Promise<{ user: AuthenticatedUser | null }> {
    return { user: await this.auth.authenticateRequest(request) };
  }

  private setCookie(response: Response, token: string): void {
    response.cookie('film_tinder_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
}
