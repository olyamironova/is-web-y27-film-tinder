import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation, Unique } from 'typeorm';
import { Movie } from '../../movies/entities/movie.entity.js';
import { User } from './user.entity.js';

export enum SwipeDirection {
  LIKE = 'like',
  DISLIKE = 'dislike',
}

registerEnumType(SwipeDirection, { name: 'SwipeDirection' });

@ObjectType({ description: 'A user decision for a movie' })
@Entity('swipes')
@Unique(['userId', 'movieId'])
export class Swipe {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId: string;

  @Field(() => SwipeDirection)
  @Column({ type: 'enum', enum: SwipeDirection })
  direction: SwipeDirection;

  @ManyToOne(() => User, (user) => user.swipes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Field(() => Movie)
  @ManyToOne(() => Movie, (movie) => movie.swipes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie: Relation<Movie>;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
