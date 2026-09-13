import type { Movie, MoviePage, SessionUser, User } from '../types';

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
  movie: (id: string) => request<Movie>(`/api/movies/${id}`),
  recommendations: () => request<Movie[]>('/api/movies/recommendations'),
  randomMovie: () => request<Movie>('/api/movies/random'),
  swipe: (movieId: string, direction: 'like' | 'dislike') => request(`/api/movies/${movieId}/swipes`, {
    method: 'POST',
    body: JSON.stringify({ direction }),
  }),
  session: () => request<{ user: SessionUser | null }>('/api/auth/session'),
  profile: () => request<User>('/api/users/me'),
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
    return request<{ avatarUrl: string }>('/api/users/me/avatar', { method: 'POST', body });
  },
  requestFriend: (email: string) => request<{ id: string }>('/api/users/me/friends', {
    method: 'POST', body: JSON.stringify({ email }),
  }),
};
