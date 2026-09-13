import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { Movie } from '../movies/entities/movie.entity.js';

@ObjectType({ description: 'Movie genre' })
@Entity('genres')
export class Genre {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'Unique genre name' })
  @Column({ unique: true, length: 64 })
  name: string;

  @ManyToMany(() => Movie, (movie) => movie.genres)
  movies: Relation<Movie[]>;
}
