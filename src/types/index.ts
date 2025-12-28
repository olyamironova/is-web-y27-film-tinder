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
    name: string;
    avatarUrl: string;
    likedMovies: string[];
    friends: User[];
}
