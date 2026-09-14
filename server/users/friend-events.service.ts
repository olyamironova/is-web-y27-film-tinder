import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, filter, map, merge, timer } from 'rxjs';

export interface FriendEvent {
  userId: string;
  type: 'friend-request' | 'friend-accepted';
  fromId: string;
  fromName: string;
  friendshipId?: string;
  occurredAt: string;
}

@Injectable()
export class FriendEventsService {
  private readonly events = new Subject<FriendEvent>();

  emit(userId: string, type: FriendEvent['type'], fromName: string, fromId: string, friendshipId?: string): void {
    this.events.next({ userId, type, fromName, fromId, friendshipId, occurredAt: new Date().toISOString() });
  }

  streamFor(userId: string): Observable<MessageEvent> {
    const userEvents = this.events.pipe(
      filter((event) => event.userId === userId),
      map((data): MessageEvent => ({ data })),
    );
    const heartbeat = timer(0, 25_000).pipe(
      map((): MessageEvent => ({ data: { type: 'heartbeat', occurredAt: new Date().toISOString() } })),
    );
    return merge(userEvents, heartbeat);
  }
}
