import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { existsSync } from 'fs';
import { Response } from 'express';
import { join } from 'path';
import { Public } from './common/decorators/public.decorator.js';

@ApiTags('health')
@Controller()
export class AppController {
  @Public()
  @Get('api/health')
  @ApiOperation({ summary: 'Health check with a server timestamp' })
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get(['/', '/login', '/register', '/account', '/recommendations', '/movie/:id', '/room', '/room/:code'])
  spa(@Res() response: Response): void {
    const indexPath = join(process.cwd(), 'dist', 'client', 'index.html');
    if (!existsSync(indexPath)) {
      response.status(503).send('Frontend ещё не собран. Запустите `pnpm build:client` или откройте Vite на http://localhost:5173.');
      return;
    }
    response.sendFile(indexPath);
  }
}
