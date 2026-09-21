import type { Movie, MoviePage, ReviewList, RoomState, SessionUser, User } from '../types';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function rawFetch(path: string, options: RequestInit): Promise<Response> {
  return fetch(path, {
    credentials: 'include',
    ...options,
    headers: options.body instanceof FormData
      ? options.headers
      : { 'Content-Type': 'application/json', ...options.headers },
  });
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch('/auth/session/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: { rid: 'session' },
        });
        return response.ok;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response = await rawFetch(path, options);
  if (response.status === 401 && (await refreshSession())) {
    response = await rawFetch(path, options);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, Array.isArray(body.message) ? body.message.join('; ') : body.message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

interface FormFieldError {
  id: string;
  error: string;
}

interface SupertokensAuthResponse {
  status: string;
  message?: string;
  formFields?: FormFieldError[];
}

async function authRequest(path: string, formFields: { id: string; value: string }[]): Promise<void> {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', rid: 'emailpassword' },
    body: JSON.stringify({ formFields }),
  });
  const body = (await response.json().catch(() => ({ status: 'GENERAL_ERROR' }))) as SupertokensAuthResponse;
  if (body.status === 'OK') return;
  if (body.status === 'WRONG_CREDENTIALS_ERROR') {
    throw new ApiError(401, 'Неверный email или пароль');
  }
  if (body.status === 'FIELD_ERROR') {
    throw new ApiError(400, (body.formFields ?? []).map((field) => field.error).join('; ') || 'Проверьте введённые данные');
  }
  throw new ApiError(response.status || 400, body.message ?? 'Не удалось выполнить запрос');
}

export const api = {
  movies: (page = 1, limit = 100) => request<MoviePage>(`/api/movies?page=${page}&limit=${limit}`),
  genres: () => request<{ id: string; name: string }[]>('/api/genres'),
  searchMovies: (params: { search?: string; genre?: string; yearFrom?: number; yearTo?: number; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.genre) qs.set('genre', params.genre);
    if (params.yearFrom != null) qs.set('yearFrom', String(params.yearFrom));
    if (params.yearTo != null) qs.set('yearTo', String(params.yearTo));
    qs.set('page', String(params.page ?? 1));
    qs.set('limit', String(params.limit ?? 12));
    return request<MoviePage>(`/api/movies?${qs.toString()}`);
  },
  movie: (id: string) => request<Movie>(`/api/movies/${id}`),
  reviews: (movieId: string) => request<ReviewList>(`/api/movies/${movieId}/reviews`),
  submitReview: (movieId: string, rating: number, text: string) => request<ReviewList>(`/api/movies/${movieId}/reviews`, {
    method: 'POST', body: JSON.stringify({ rating, text }),
  }),
  deleteReview: (movieId: string) => request<ReviewList>(`/api/movies/${movieId}/reviews`, { method: 'DELETE' }),
  recommendations: () => request<Movie[]>('/api/movies/recommendations'),
  deck: () => request<Movie[]>('/api/movies/deck'),
  randomMovie: () => request<Movie>('/api/movies/random'),
  swipe: (movieId: string, direction: 'like' | 'dislike' | 'watch_later') => request(`/api/movies/${movieId}/swipes`, {
    method: 'POST',
    body: JSON.stringify({ direction }),
  }),
  session: () => request<{ user: SessionUser | null }>('/api/auth/session'),
  profile: () => request<User>('/api/users/me'),
  myLikes: () => request<Movie[]>('/api/users/me/likes'),
  myDislikes: () => request<Movie[]>('/api/users/me/dislikes'),
  myWatchlist: () => request<Movie[]>('/api/users/me/watchlist'),
  friendLikes: (userId: string) => request<Movie[]>(`/api/users/${userId}/likes`),
  matches: (userId: string) => request<Movie[]>(`/api/users/${userId}/matches`),
  createRoom: () => request<RoomState>('/api/rooms', { method: 'POST' }),
  joinRoom: (code: string) => request<RoomState>(`/api/rooms/${code}/join`, { method: 'POST' }),
  getRoom: (code: string) => request<RoomState>(`/api/rooms/${code}`),
  roomSwipe: (code: string, movieId: string, direction: 'like' | 'dislike') =>
    request<{ matched: boolean }>(`/api/rooms/${code}/swipe`, { method: 'POST', body: JSON.stringify({ movieId, direction }) }),
  removeSwipe: (movieId: string) => request<void>(`/api/movies/${movieId}/swipes`, { method: 'DELETE' }),
  login: (email: string, password: string) => authRequest('/auth/signin', [
    { id: 'email', value: email },
    { id: 'password', value: password },
  ]),
  register: (email: string, name: string, password: string) => authRequest('/auth/signup', [
    { id: 'email', value: email },
    { id: 'password', value: password },
    { id: 'name', value: name },
  ]),
  logout: () => fetch('/auth/signout', { method: 'POST', credentials: 'include', headers: { rid: 'session' } }).then(() => undefined),
  updateProfile: (input: { name: string; email: string }) => request<User>('/api/users/me', {
    method: 'PATCH', body: JSON.stringify(input),
  }),
  changePassword: (oldPassword: string, newPassword: string) => request<void>('/api/users/me/password', {
    method: 'PATCH', body: JSON.stringify({ oldPassword, newPassword }),
  }),
  uploadAvatar: (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return request<User>('/api/users/me/avatar', { method: 'POST', body });
  },
  selectAvatar: (url: string) => request<User>('/api/users/me/avatar', {
    method: 'PATCH', body: JSON.stringify({ url }),
  }),
  deleteAvatar: (url: string) => request<User>('/api/users/me/avatar', {
    method: 'DELETE', body: JSON.stringify({ url }),
  }),
  requestFriend: (email: string) => request<{ id: string }>('/api/users/me/friends', {
    method: 'POST', body: JSON.stringify({ email }),
  }),
  acceptFriend: (friendshipId: string) => request<{ id: string }>(`/api/users/me/friends/${friendshipId}/accept`, {
    method: 'PATCH',
  }),
  removeFriend: (friendshipId: string) => request<void>(`/api/users/me/friends/${friendshipId}`, {
    method: 'DELETE',
  }),
};
