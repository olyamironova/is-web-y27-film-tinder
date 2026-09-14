import { ForbiddenException, Injectable, MessageEvent, NotFoundException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { Observable, Subject, map, merge, timer } from 'rxjs';
import { MoviesService, MovieView } from '../movies/movies.service.js';

type Participant = { id: string; name: string };

interface RoomEvent {
  type: 'joined' | 'match';
  userId?: string;
  name?: string;
  movie?: MovieView;
}

interface Room {
  code: string;
  host: Participant;
  guest: Participant | null;
  likes: Map<string, Set<string>>;
  matches: string[];
  events: Subject<RoomEvent>;
  createdAt: number;
}

const ROOM_TTL_MS = 6 * 60 * 60 * 1000;

@Injectable()
export class RoomsService {
  private readonly rooms = new Map<string, Room>();

  constructor(private readonly movies: MoviesService) {}

  async create(user: Participant) {
    this.cleanup();
    let code = this.generateCode();
    while (this.rooms.has(code)) code = this.generateCode();
    this.rooms.set(code, {
      code,
      host: { id: user.id, name: user.name },
      guest: null,
      likes: new Map(),
      matches: [],
      events: new Subject<RoomEvent>(),
      createdAt: Date.now(),
    });
    return this.summary(code, user.id);
  }

  async join(code: string, user: Participant) {
    const room = this.getRoom(code);
    if (user.id !== room.host.id && room.guest?.id !== user.id) {
      if (room.guest) throw new ForbiddenException('В комнате уже двое участников');
      room.guest = { id: user.id, name: user.name };
      room.events.next({ type: 'joined', userId: user.id, name: user.name });
    }
    return this.summary(code, user.id);
  }

  async summary(code: string, userId: string) {
    const room = this.getRoom(code);
    this.assertParticipant(room, userId);
    const matches = await Promise.all(room.matches.map((id) => this.movies.findOne(id)));
    return {
      code: room.code,
      host: room.host,
      guest: room.guest,
      matches,
      role: userId === room.host.id ? 'host' : 'guest',
      ready: Boolean(room.guest),
    };
  }

  async swipe(code: string, userId: string, movieId: string, direction: 'like' | 'dislike') {
    const room = this.getRoom(code);
    this.assertParticipant(room, userId);
    let matched = false;
    if (direction === 'like') {
      const likers = room.likes.get(movieId) ?? new Set<string>();
      likers.add(userId);
      room.likes.set(movieId, likers);
      if (
        room.guest &&
        likers.has(room.host.id) &&
        likers.has(room.guest.id) &&
        !room.matches.includes(movieId)
      ) {
        room.matches.push(movieId);
        matched = true;
        const movie = await this.movies.findOne(movieId);
        room.events.next({ type: 'match', movie });
      }
    }
    return { matched };
  }

  streamFor(code: string, userId: string): Observable<MessageEvent> {
    const room = this.getRoom(code);
    this.assertParticipant(room, userId);
    const heartbeat = timer(0, 25_000).pipe(
      map((): MessageEvent => ({ data: { type: 'heartbeat' } })),
    );
    return merge(room.events.pipe(map((data): MessageEvent => ({ data }))), heartbeat);
  }

  private getRoom(code: string): Room {
    const room = this.rooms.get(code.toUpperCase());
    if (!room) throw new NotFoundException('Комната не найдена или истекла');
    return room;
  }

  private assertParticipant(room: Room, userId: string): void {
    if (room.host.id !== userId && room.guest?.id !== userId) {
      throw new ForbiddenException('Вы не участник этой комнаты');
    }
  }

  private generateCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i += 1) code += alphabet[randomInt(alphabet.length)];
    return code;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (now - room.createdAt > ROOM_TTL_MS) {
        room.events.complete();
        this.rooms.delete(code);
      }
    }
  }
}
