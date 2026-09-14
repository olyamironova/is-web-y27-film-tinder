import { Module } from '@nestjs/common';
import { MoviesModule } from '../movies/movies.module.js';
import { RoomsController } from './rooms.controller.js';
import { RoomsService } from './rooms.service.js';

@Module({
  imports: [MoviesModule],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
