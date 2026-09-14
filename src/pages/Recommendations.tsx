import { useEffect, useState } from 'react';
import type { Movie } from '../types';
import { Shuffle, Search, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export function Recommendations() {
    const [tab, setTab] = useState<'feed' | 'shuffle'>('feed');
    const [random, setRandom] = useState<Movie | null>(null);
    const [movies, setMovies] = useState<Movie[]>([]);
    const [error, setError] = useState('');
    const [genres, setGenres] = useState<{ id: string; name: string }[]>([]);
    const [search, setSearch] = useState('');
    const [genre, setGenre] = useState('');
    const [yearFrom, setYearFrom] = useState('');
    const [yearTo, setYearTo] = useState('');

    useEffect(() => {
        api.genres().then(setGenres).catch(() => undefined);
    }, []);

    // Каталог с фильтрами; поиск по названию с debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            api.searchMovies({
                search: search.trim() || undefined,
                genre: genre || undefined,
                yearFrom: Number(yearFrom) || undefined,
                yearTo: Number(yearTo) || undefined,
            }).then(({ data }) => { setMovies(data); setError(''); })
              .catch(() => setError('Не удалось загрузить каталог'));
        }, 300);
        return () => clearTimeout(timer);
    }, [search, genre, yearFrom, yearTo]);

    const resetFilters = () => { setSearch(''); setGenre(''); setYearFrom(''); setYearTo(''); };

    const pickRandom = async () => {
        try {
            setRandom(await api.randomMovie());
            setTab('shuffle');
        } catch {
            setError('Не удалось выбрать случайный фильм');
        }
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
                        <Search size={20} className="md:w-6 md:h-6" />
                        <span className="font-semibold text-xs md:text-sm">Каталог</span>
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
                    <div className="flex flex-wrap gap-2 md:gap-3 mb-4 md:mb-6 sticky top-0 bg-background/80 backdrop-blur-md py-2 z-10">
                        <div className="relative flex-1 min-w-[160px]">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext" />
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по названию…" className="w-full bg-surface border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm" />
                        </div>
                        <select value={genre} onChange={(e) => setGenre(e.target.value)} className="bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm">
                            <option value="">Все жанры</option>
                            {genres.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
                        </select>
                        <input value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} type="number" min={1888} max={2100} placeholder="год с" className="w-20 bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm" />
                        <input value={yearTo} onChange={(e) => setYearTo(e.target.value)} type="number" min={1888} max={2100} placeholder="по" className="w-20 bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm" />
                        {(search || genre || yearFrom || yearTo) && (
                            <button onClick={resetFilters} className="px-3 py-2 bg-white/10 rounded-xl text-sm hover:bg-white/20 transition-colors">Сброс</button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {error && <p className="col-span-full text-red-400">{error}</p>}
                        {!error && movies.length === 0 && <p className="col-span-full text-subtext py-8 text-center">Ничего не найдено. Измените фильтры.</p>}
                        {movies.map(movie => (
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
