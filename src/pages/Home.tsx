import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MovieCard } from '../components/MovieCard';
import { MOVIES, CURRENT_USER } from '../mocks/data';

export function Home() {
    const [index, setIndex] = useState(0);
    const [movies] = useState(MOVIES);
    const [direction, setDirection] = useState<number>(0);

    const swipe = (dir: 'left' | 'right') => {
        const movie = movies[index];
        if (dir === 'right') {
            CURRENT_USER.likedMovies.push(movie.id);
        }
        setDirection(dir === 'right' ? 1 : -1);
        setTimeout(() => {
            setIndex(prev => prev + 1);
            setDirection(0);
        }, 50);
    };

    const currentMovie = movies[index];

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
