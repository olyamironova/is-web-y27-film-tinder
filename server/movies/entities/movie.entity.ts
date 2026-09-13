import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { Genre } from '../../genres/genre.entity.js';
import { Swipe } from '../../users/entities/swipe.entity.js';
import { Credit } from './credit.entity.js';

@ObjectType({ description: 'A movie available in Film Tinder' })
@Entity('movies')
export class Movie {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'Movie title' })
  @Column({ length: 200 })
  title: string;

  @Field({ description: 'Movie synopsis' })
  @Column({ type: 'text' })
  description: string;

  @Field({ description: 'Portrait poster URL' })
  @Column({ name: 'poster_url', type: 'text' })
  posterUrl: string;

  @Field({ description: 'Landscape backdrop URL' })
  @Column({ name: 'backdrop_url', type: 'text' })
  backdropUrl: string;

  @Field(() => Float, { description: 'Rating from 0 to 10' })
  @Column({ type: 'double precision' })
  rating: number;

  @Field(() => Int, { description: 'Release year' })
  @Column({ type: 'smallint' })
  year: number;

  @Field(() => [Genre])
  @ManyToMany(() => Genre, (genre) => genre.movies, { cascade: ['insert'] })
  @JoinTable({
    name: 'movie_genres',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'genre_id', referencedColumnName: 'id' },
  })
  genres: Relation<Genre[]>;

  @Field(() => [Credit])
  @OneToMany(() => Credit, (credit) => credit.movie, { cascade: true })
  credits: Relation<Credit[]>;

  @OneToMany(() => Swipe, (swipe) => swipe.movie)
  swipes: Relation<Swipe[]>;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
