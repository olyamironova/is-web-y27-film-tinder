import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation, Unique } from 'typeorm';
import { User } from './user.entity.js';

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('friendships')
@Unique(['requesterId', 'addresseeId'])
export class Friendship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'requester_id', type: 'uuid' })
  requesterId: string;

  @Column({ name: 'addressee_id', type: 'uuid' })
  addresseeId: string;

  @Column({ type: 'enum', enum: FriendshipStatus, default: FriendshipStatus.PENDING })
  status: FriendshipStatus;

  @ManyToOne(() => User, (user) => user.sentFriendships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requester_id' })
  requester: Relation<User>;

  @ManyToOne(() => User, (user) => user.receivedFriendships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'addressee_id' })
  addressee: Relation<User>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
