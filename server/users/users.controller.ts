import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { PaginationQueryDto } from '../common/dto.js';
import { AuthenticatedUser } from '../common/types/authenticated-request.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { CreateFriendshipDto } from './dto/create-friendship.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UserRole } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('api/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOkResponse({ description: 'Current user profile with likes and friends' })
  profile(@CurrentUser() user: AuthenticatedUser) {
    return this.users.profile(user.id);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() input: UpdateProfileDto) {
    return this.users.updateProfile(user.id, input);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(@CurrentUser() user: AuthenticatedUser, @Body() input: ChangePasswordDto): Promise<void> {
    await this.users.changePassword(user.id, input);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
      ],
    })) file: Express.Multer.File,
  ) {
    return this.users.setAvatar(user.id, file);
  }

  @Get('me/likes')
  @ApiOkResponse({ description: 'Movies the current user liked' })
  likedMovies(@CurrentUser() user: AuthenticatedUser) {
    return this.users.likes(user.id);
  }

  @Get('me/dislikes')
  @ApiOkResponse({ description: 'Movies the current user disliked' })
  dislikedMovies(@CurrentUser() user: AuthenticatedUser) {
    return this.users.dislikes(user.id);
  }

  @Get('me/watchlist')
  @ApiOkResponse({ description: 'Movies the current user saved to watch later' })
  watchlist(@CurrentUser() user: AuthenticatedUser) {
    return this.users.watchlist(user.id);
  }

  @Get(':id/likes')
  @ApiOkResponse({ description: 'Movies a friend liked' })
  friendLikes(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.users.friendLikes(user.id, id);
  }

  @Post('me/friends')
  requestFriend(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateFriendshipDto) {
    return this.users.requestFriend(user.id, input.email);
  }

  @Patch('me/friends/:id/accept')
  acceptFriend(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.users.acceptFriend(user.id, id);
  }

  @Delete('me/friends/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({ description: 'Reject incoming, cancel outgoing, or remove a friend' })
  async removeFriend(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.users.removeFriendship(user.id, id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query() query: PaginationQueryDto) {
    return this.users.findAll(query.page, query.limit);
  }
}
