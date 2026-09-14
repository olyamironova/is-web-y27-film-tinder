import type { Movie, MoviePage, ReviewList, SessionUser, User } from '../types';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: options.body instanceof FormData
      ? options.headers
      : { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, Array.isArray(body.message) ? body.message.join('; ') : body.message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  movies: (page = 1, limit = 100) => request<MoviePage>(`/api/movies?page=${page}&limit=${limit}`),
  genres: () => request<{ id: string; name: string }[]>('/api/genres'),
  searchMovies: (params: { search?: string; genre?: string; yearFrom?: number; yearTo?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.genre) qs.set('genre', params.genre);
    if (params.yearFrom != null) qs.set('yearFrom', String(params.yearFrom));
    if (params.yearTo != null) qs.set('yearTo', String(params.yearTo));
    qs.set('limit', String(params.limit ?? 60));
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
  removeSwipe: (movieId: string) => request<void>(`/api/movies/${movieId}/swipes`, { method: 'DELETE' }),
  login: (email: string, password: string) => request<{ user: SessionUser }>('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password }),
  }),
  register: (email: string, name: string, password: string) => request<{ user: SessionUser }>('/api/auth/register', {
    method: 'POST', body: JSON.stringify({ email, name, password }),
  }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
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
