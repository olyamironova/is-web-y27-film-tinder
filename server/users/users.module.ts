import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoviesModule } from '../movies/movies.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { Friendship } from './entities/friendship.entity.js';
import { User } from './entities/user.entity.js';
import { FriendEventsService } from './friend-events.service.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Friendship]), MoviesModule, StorageModule],
  controllers: [UsersController],
  providers: [UsersService, FriendEventsService],
  exports: [UsersService],
})
export class UsersModule {}
