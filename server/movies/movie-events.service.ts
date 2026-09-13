import { Injectable } from '@nestjs/common';
import { Observable, Subject, map, merge, timer } from 'rxjs';

export interface MovieEvent {
  type: 'created' | 'updated' | 'deleted';
  movieId: string;
  title?: string;
  occurredAt: string;
}

@Injectable()
export class MovieEventsService {
  private readonly events = new Subject<MovieEvent>();

  emit(type: MovieEvent['type'], movieId: string, title?: string): void {
    this.events.next({ type, movieId, title, occurredAt: new Date().toISOString() });
  }

  stream(): Observable<{ data: MovieEvent | { type: 'heartbeat'; occurredAt: string } }> {
    const heartbeat = timer(0, 25_000).pipe(
      map(() => ({ data: { type: 'heartbeat' as const, occurredAt: new Date().toISOString() } })),
    );
    return merge(this.events.pipe(map((data) => ({ data }))), heartbeat);
  }
}
