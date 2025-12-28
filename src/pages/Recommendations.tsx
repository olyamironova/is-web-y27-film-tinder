import { useState } from 'react';
import { MOVIES } from '../mocks/data';
import type { Movie } from '../types';
import { Shuffle, Flame, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Recommendations() {
    const [tab, setTab] = useState<'feed' | 'shuffle'>('feed');
    const [random, setRandom] = useState<Movie | null>(null);

    const pickRandom = () => {
        if (MOVIES.length === 0) return;
        const idx = Math.floor(Math.random() * MOVIES.length);
        setRandom(MOVIES[idx]);
        setTab('shuffle');
    };

    const shuffle = () => {
        pickRandom();
    };

    return (
        <div className="p-4 md:p-6 h-[calc(100vh-64px)] flex flex-col overflow-hidden select-none touch-none">
            <div className={`transition-all duration-500 ease-in-out flex-shrink-0 ${tab === 'shuffle' ? 'scale-75 origin-top -translate-y-2 mb-2' : 'mb-4 md:mb-6'}`}>
                <h1 className={`text-xl md:text-2xl font-bold mb-4 md:mb-6 ${tab === 'shuffle' ? 'hidden' : 'block'}`}>Для тебя</h1>

                <div className="flex gap-3 md:gap-4">
                    <button
                        onClick={() => setTab('feed')}
                        className={`flex-1 py-3 md:py-4 rounded-xl flex flex-col items-center gap-2 transition-all ${tab === 'feed' ? 'bg-primary text-white shadow-lg scale-105' : 'bg-surface text-subtext'}`}
                    >
                        <Flame size={20} className="md:w-6 md:h-6" />
                        <span className="font-semibold text-xs md:text-sm">Поиск</span>
                    </button>
                    <button
                        onClick={shuffle}
                        className={`flex-1 py-3 md:py-4 rounded-xl flex flex-col items-center gap-2 transition-all ${tab === 'shuffle' ? 'bg-primary text-white shadow-lg scale-105' : 'bg-surface text-subtext'}`}
                    >
                        <Shuffle size={20} className="md:w-6 md:h-6" />
                        <span className="font-semibold text-xs md:text-sm">Случайный</span>
                    </button>
                </div>
            </div>

            {tab === 'feed' && (
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {MOVIES.map(movie => (
                            <Link key={movie.id} to={`/movie/${movie.id}`} className="block group">
                                <div className="relative h-36 md:h-48 rounded-xl overflow-hidden mb-2 md:mb-3">
                                    <img src={movie.backdropUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                                    <div className="absolute top-2 md:top-3 right-2 md:right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                                        <Star size={10} className="md:w-3 md:h-3 text-yellow-400" fill="currentColor" />
                                        {movie.rating}
                                    </div>
                                </div>
                                <h3 className="font-bold text-sm md:text-lg leading-tight mb-1 group-hover:text-primary transition-colors">{movie.title}</h3>
                                <p className="text-xs md:text-sm text-subtext line-clamp-1">{movie.genres.join(', ')}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'shuffle' && random && (
                <div className="flex-1 flex items-center justify-center min-h-0 py-2">
                    <div className="animate-slide-up w-full max-w-[320px] md:max-w-[360px] mx-auto flex flex-col bg-surface rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 h-full max-h-[800px] min-h-[500px]">
                        <div className="relative flex-grow min-h-0 overflow-hidden">
                            <img src={random.posterUrl} alt={random.title} className="w-full h-full object-cover" />
                        </div>

                        <div className="w-full p-4 flex flex-col items-center text-center gap-1.5 flex-shrink-0 bg-surface/50 backdrop-blur-md border-t border-white/10">
                            <h2 className="text-lg md:text-xl font-bold text-white line-clamp-1">{random.title}</h2>
                            <div className="flex gap-2 mb-1">
                                {random.genres.slice(0, 2).map(g => <span key={g} className="text-[9px] md:text-[10px] bg-white/5 px-2 py-0.5 rounded-full border border-white/10 text-subtext font-medium">{g}</span>)}
                            </div>
                            <div className="w-full space-y-2 mt-1">
                                <Link to={`/movie/${random.id}`} className="w-full py-2 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg text-xs md:text-sm">
                                    О фильме
                                </Link>
                                <button
                                    onClick={pickRandom}
                                    className="w-full py-2 bg-white/5 border border-white/10 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] text-xs md:text-sm"
                                >
                                    <Shuffle size={14} />
                                    Рандомный фильм
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
