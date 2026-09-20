import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { Friendship } from './friendship.entity.js';
import { Swipe } from './swipe.entity.js';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

registerEnumType(UserRole, { name: 'UserRole' });

@ObjectType({ description: 'Film Tinder user account' })
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryColumn('uuid')
  id: string;

  @Field({ description: 'Unique login email' })
  @Column({ unique: true })
  email: string;

  @Field({ description: 'Public display name' })
  @Column({ length: 80 })
  name: string;

  @Field(() => String, { nullable: true, description: 'Public avatar URL' })
  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'avatar_urls', type: 'text', array: true, default: () => "'{}'" })
  avatarUrls: string[];

  @Field(() => UserRole)
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @OneToMany(() => Swipe, (swipe) => swipe.user)
  swipes: Relation<Swipe[]>;

  @OneToMany(() => Friendship, (friendship) => friendship.requester)
  sentFriendships: Relation<Friendship[]>;

  @OneToMany(() => Friendship, (friendship) => friendship.addressee)
  receivedFriendships: Relation<Friendship[]>;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
