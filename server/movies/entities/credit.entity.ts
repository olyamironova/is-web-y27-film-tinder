import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { Movie } from './movie.entity.js';

export enum CreditRole {
  DIRECTOR = 'director',
  ACTOR = 'actor',
}

registerEnumType(CreditRole, { name: 'CreditRole' });

@ObjectType({ description: 'A person credited on a movie' })
@Entity('credits')
export class Credit {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId: string;

  @Field({ description: 'Person name' })
  @Column({ length: 120 })
  name: string;

  @Field(() => CreditRole)
  @Column({ type: 'enum', enum: CreditRole })
  role: CreditRole;

  @Field(() => Movie)
  @ManyToOne(() => Movie, (movie) => movie.credits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie: Relation<Movie>;
}
