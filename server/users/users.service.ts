import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcryptjs';
import { Repository } from 'typeorm';
import { MoviesService } from '../movies/movies.service.js';
import { ObjectStorageService } from '../storage/object-storage.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { Friendship, FriendshipStatus } from './entities/friendship.entity.js';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Friendship) private readonly friendships: Repository<Friendship>,
    private readonly movies: MoviesService,
    private readonly storage: ObjectStorageService,
  ) {}

  async profile(id: string) {
    const user = await this.findOne(id);
    const [likes, friendships] = await Promise.all([
      this.movies.likedByUser(id),
      this.friendships.find({
        where: [
          { requesterId: id, status: FriendshipStatus.ACCEPTED },
          { addresseeId: id, status: FriendshipStatus.ACCEPTED },
        ],
        relations: { requester: true, addressee: true },
      }),
    ]);
    const friends = friendships.map((friendship) =>
      friendship.requesterId === id ? friendship.addressee : friendship.requester,
    );
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl ?? '',
      role: user.role,
      likedMovies: likes.map((movie) => movie.id),
      friends: friends.map((friend) => ({
        id: friend.id,
        name: friend.name,
        avatarUrl: friend.avatarUrl ?? '',
        likedMovies: [],
        friends: [],
      })),
    };
  }

  async findAll(page: number, limit: number) {
    const [data, total] = await this.users.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: data.map((user) => this.sanitize(user)),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async updateProfile(id: string, input: UpdateProfileDto) {
    const user = await this.findOne(id);
    if (input.email && input.email.toLowerCase() !== user.email) {
      const email = input.email.trim().toLowerCase();
      if (await this.users.exists({ where: { email } })) throw new ConflictException('Email уже используется');
      user.email = email;
    }
    if (input.name) user.name = input.name.trim();
    await this.users.save(user);
    return this.profile(id);
  }

  async changePassword(id: string, input: ChangePasswordDto): Promise<void> {
    const user = await this.findOne(id);
    if (!(await compare(input.oldPassword, user.passwordHash))) {
      throw new UnauthorizedException('Старый пароль указан неверно');
    }
    user.passwordHash = await hash(input.newPassword, 12);
    await this.users.save(user);
  }

  async setAvatar(id: string, file: Express.Multer.File) {
    const user = await this.findOne(id);
    user.avatarUrl = await this.storage.uploadAvatar(file);
    await this.users.save(user);
    return { avatarUrl: user.avatarUrl };
  }

  async requestFriend(userId: string, email: string) {
    const addressee = await this.users.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!addressee) throw new NotFoundException('Пользователь не найден');
    if (addressee.id === userId) throw new BadRequestException('Нельзя добавить себя в друзья');
    const existing = await this.friendships.findOne({
      where: [
        { requesterId: userId, addresseeId: addressee.id },
        { requesterId: addressee.id, addresseeId: userId },
      ],
    });
    if (existing) throw new ConflictException('Заявка или дружба уже существует');
    return this.friendships.save(this.friendships.create({ requesterId: userId, addresseeId: addressee.id }));
  }

  async acceptFriend(userId: string, friendshipId: string) {
    const friendship = await this.friendships.findOne({ where: { id: friendshipId } });
    if (!friendship) throw new NotFoundException('Заявка не найдена');
    if (friendship.addresseeId !== userId) throw new UnauthorizedException('Эта заявка адресована другому пользователю');
    friendship.status = FriendshipStatus.ACCEPTED;
    return this.friendships.save(friendship);
  }

  private async findOne(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  private sanitize(user: User) {
    return { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, role: user.role, createdAt: user.createdAt };
  }
}
