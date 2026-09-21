import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Redirect, Render } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CreateMovieDto } from '../movies/dto/create-movie.dto.js';
import { MoviesService } from '../movies/movies.service.js';
import { UserRole } from '../users/entities/user.entity.js';

interface MovieFormBody {
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  rating: string;
  year: string;
  genres: string;
  director: string;
  cast: string;
}

@Controller('admin/movies')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly movies: MoviesService) {}

  @Get()
  @Render('movies/index')
  async index(@Query('session') session?: string) {
    const page = await this.movies.findPage(1, 100);
    const user = session === 'guest' ? undefined : { name: 'Администратор' };
    return { title: 'Управление фильмами', movies: page.data, user };
  }

  @Get('add')
  @Render('movies/form')
  add() {
    return { title: 'Добавить фильм', movie: {}, action: '/admin/movies', user: { name: 'Администратор' } };
  }

  @Post()
  @Redirect('/admin/movies')
  async create(@Body() body: MovieFormBody) {
    await this.movies.create(this.fromForm(body));
  }

  @Get(':id/edit')
  @Render('movies/form')
  async edit(@Param('id', ParseUUIDPipe) id: string) {
    const movie = await this.movies.findOne(id);
    return {
      title: 'Редактировать фильм',
      movie: { ...movie, genresCsv: movie.genres.join(', '), castCsv: movie.cast.join(', ') },
      action: `/admin/movies/${id}/update`,
      user: { name: 'Администратор' },
    };
  }

  @Post(':id/update')
  @Redirect('/admin/movies')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: MovieFormBody) {
    await this.movies.update(id, this.fromForm(body));
  }

  @Post(':id/delete')
  @Redirect('/admin/movies')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.movies.remove(id);
  }

  private fromForm(body: MovieFormBody): CreateMovieDto {
    return {
      title: body.title,
      description: body.description,
      posterUrl: body.posterUrl,
      backdropUrl: body.backdropUrl,
      rating: Number(body.rating),
      year: Number(body.year),
      genres: body.genres.split(',').map((value) => value.trim()).filter(Boolean),
      director: body.director,
      cast: body.cast.split(',').map((value) => value.trim()).filter(Boolean),
    };
  }
}
