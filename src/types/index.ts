export interface Movie {
    id: string;
    title: string;
    description: string;
    posterUrl: string;
    backdropUrl: string;
    rating: number;
    genres: string[];
    year: number;
    director: string;
    cast: string[];
}

export interface User {
    id: string;
    email?: string;
    name: string;
    avatarUrl: string;
    role?: 'user' | 'admin';
    likedMovies: string[];
    friends: User[];
}

export interface MoviePage {
    data: Movie[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface SessionUser {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
}
