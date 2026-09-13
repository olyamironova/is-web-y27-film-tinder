import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoviesModule } from '../movies/movies.module.js';
import { Friendship } from '../users/entities/friendship.entity.js';
import { User } from '../users/entities/user.entity.js';
import { SeedService } from './seed.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friendship]), MoviesModule],
  providers: [SeedService],
})
export class DatabaseModule {}
