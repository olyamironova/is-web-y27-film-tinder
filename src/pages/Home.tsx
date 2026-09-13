import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MovieCard } from '../components/MovieCard';
import { api, ApiError } from '../api/client';
import type { Movie } from '../types';

export function Home() {
    const [index, setIndex] = useState(0);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [direction, setDirection] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    useEffect(() => {
        api.movies().then(({ data }) => setMovies(data)).catch(() => setError('Не удалось загрузить фильмы')).finally(() => setLoading(false));
        const source = new EventSource('/api/movies/events');
        source.onmessage = ({ data }) => {
            const event = JSON.parse(data);
            if (event.type !== 'heartbeat') setNotice(`Каталог обновлён: ${event.title ?? event.movieId}`);
        };
        return () => source.close();
    }, []);

    const swipe = async (dir: 'left' | 'right') => {
        const movie = movies[index];
        try {
            await api.swipe(movie.id, dir === 'right' ? 'like' : 'dislike');
        } catch (caught) {
            if (caught instanceof ApiError && caught.status === 401) {
                window.location.href = '/login';
                return;
            }
            setError('Не удалось сохранить выбор');
        }
        setDirection(dir === 'right' ? 1 : -1);
        setTimeout(() => {
            setIndex(prev => prev + 1);
            setDirection(0);
        }, 50);
    };

    const currentMovie = movies[index];

    if (loading) return <div className="flex h-[70vh] items-center justify-center text-subtext">Загружаем каталог…</div>;
    if (error && movies.length === 0) return <div className="p-10 text-center text-red-400">{error}</div>;

    if (!currentMovie) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center px-6">
                <h2 className="text-2xl font-bold mb-2">Фильмы закончились!</h2>
                <p className="text-subtext mb-6">Загляните позже за новыми фильмами.</p>
                <button onClick={() => setIndex(0)} className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-red-700 transition-colors">
                    Начать заново
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[calc(100vh-64px)] flex items-center justify-center p-4 perspective-1000 overflow-hidden">
            {(notice || error) && <div className="absolute top-4 z-40 bg-surface border border-white/10 rounded-xl px-4 py-2 text-sm">{error || notice}</div>}
            <AnimatePresence mode="wait" custom={direction}>
                {movies.slice(index, index + 2).reverse().map((movie) => {
                    const isFront = movie.id === currentMovie?.id;
                    return (
                        <motion.div
                            key={movie.id}
                            className="absolute inset-0 flex items-center justify-center p-4 pt-12"
                        >
                            <MovieCard
                                movie={movie}
                                onSwipe={swipe}
                                isFront={isFront}
                                custom={direction}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            <div className="absolute bottom-6 flex gap-6 z-10">
                <button onClick={() => swipe('left')} className="w-14 h-14 rounded-full bg-surface border border-white/10 shadow-xl flex items-center justify-center text-primary text-xl hover:scale-110 transition-transform">
                    ✕
                </button>
                <button onClick={() => swipe('right')} className="w-14 h-14 rounded-full bg-primary shadow-[0_0_20px_rgba(229,9,20,0.4)] flex items-center justify-center text-white text-xl hover:scale-110 transition-transform">
                    ♥
                </button>
            </div>
        </div>
    );
}
