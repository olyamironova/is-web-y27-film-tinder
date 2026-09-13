import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Genre } from './genre.entity.js';
import { GenresController } from './genres.controller.js';
import { GenresService } from './genres.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Genre])],
  controllers: [GenresController],
  providers: [GenresService],
})
export class GenresModule {}
