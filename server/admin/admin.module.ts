import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthRedirectMiddleware } from '../auth/auth-redirect.middleware.js';
import { MoviesModule } from '../movies/movies.module.js';
import { AdminController } from './admin.controller.js';

@Module({
  imports: [MoviesModule],
  controllers: [AdminController],
  providers: [AuthRedirectMiddleware],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthRedirectMiddleware).forRoutes(AdminController);
  }
}
