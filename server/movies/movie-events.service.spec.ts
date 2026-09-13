import { describe, expect, it } from '@jest/globals';
import { firstValueFrom, filter } from 'rxjs';
import { MovieEventsService } from './movie-events.service.js';

describe('MovieEventsService', () => {
  it('publishes a catalog mutation to SSE subscribers', async () => {
    const service = new MovieEventsService();
    const eventPromise = firstValueFrom(service.stream().pipe(filter((event) => event.data.type === 'created')));
    service.emit('created', 'movie-id', 'Новый фильм');
    await expect(eventPromise).resolves.toMatchObject({
      data: { type: 'created', movieId: 'movie-id', title: 'Новый фильм' },
    });
  });
});
