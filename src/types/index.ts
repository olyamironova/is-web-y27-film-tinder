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

export interface FriendCard {
    id: string;
    name: string;
    avatarUrl: string;
}

export interface FriendRequest {
    id: string;
    user: FriendCard;
}

export interface User {
    id: string;
    email?: string;
    name: string;
    avatarUrl: string;
    role?: 'user' | 'admin';
    likedMovies: string[];
    dislikedMovies?: string[];
    watchLaterMovies?: string[];
    friends: User[];
    friendshipId?: string;
    incomingRequests?: FriendRequest[];
    outgoingRequests?: FriendRequest[];
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
    avatarUrl?: string;
}
