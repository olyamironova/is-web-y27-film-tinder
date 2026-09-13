import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';
import { GenreDto } from './genre.dto.js';
import { GenresService } from './genres.service.js';

@ApiTags('genres')
@Controller('api/genres')
export class GenresController {
  constructor(private readonly genres: GenresService) {}

  @Public()
  @Get()
  findAll() {
    return this.genres.findAll();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  create(@Body() input: GenreDto) {
    return this.genres.create(input.name);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  update(@Param('id', ParseUUIDPipe) id: string, @Body() input: GenreDto) {
    return this.genres.update(id, input.name);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.genres.remove(id);
  }
}
