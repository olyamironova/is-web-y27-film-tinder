import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genre } from './genre.entity.js';

@Injectable()
export class GenresService {
  constructor(@InjectRepository(Genre) private readonly genres: Repository<Genre>) {}

  findAll(): Promise<Genre[]> {
    return this.genres.find({ order: { name: 'ASC' } });
  }

  async create(name: string): Promise<Genre> {
    const normalized = name.trim();
    if (await this.genres.exists({ where: { name: normalized } })) throw new ConflictException('Жанр уже существует');
    return this.genres.save(this.genres.create({ name: normalized }));
  }

  async update(id: string, name: string): Promise<Genre> {
    const genre = await this.findOne(id);
    genre.name = name.trim();
    return this.genres.save(genre);
  }

  async remove(id: string): Promise<void> {
    const genre = await this.findOne(id);
    await this.genres.remove(genre);
  }

  private async findOne(id: string): Promise<Genre> {
    const genre = await this.genres.findOne({ where: { id } });
    if (!genre) throw new NotFoundException('Жанр не найден');
    return genre;
  }
}
